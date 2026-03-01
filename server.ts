import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { Client } from "ssh2";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.USER_DATA_PATH 
  ? path.join(process.env.USER_DATA_PATH, "ssh_manager.db")
  : "ssh_manager.db";

const keyPath = process.env.USER_DATA_PATH
  ? path.join(process.env.USER_DATA_PATH, ".secret_key")
  : ".secret_key";

// Encryption setup
let ENCRYPTION_KEY: Buffer;
if (fs.existsSync(keyPath)) {
  ENCRYPTION_KEY = Buffer.from(fs.readFileSync(keyPath, "utf-8"), "hex");
} else {
  ENCRYPTION_KEY = crypto.randomBytes(32);
  fs.writeFileSync(keyPath, ENCRYPTION_KEY.toString("hex"));
}

const IV_LENGTH = 16;

function encrypt(text: string) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string) {
  if (!text) return null;
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption failed:", err);
    return text; // Fallback to original if it wasn't encrypted (backward compatibility)
  }
}

console.log("Using database at:", dbPath);
const db = new Database(dbPath);

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 22,
    username TEXT NOT NULL,
    password TEXT,
    folder_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // API Routes
  app.get("/api/folders", (req, res) => {
    const folders = db.prepare("SELECT * FROM folders ORDER BY name ASC").all();
    res.json(folders);
  });

  app.post("/api/folders", (req, res) => {
    const { name } = req.body;
    const info = db.prepare("INSERT INTO folders (name) VALUES (?)").run(name);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/folders/:id", (req, res) => {
    db.prepare("DELETE FROM folders WHERE id = ?").run(req.params.id);
    res.status(204).send();
  });

  app.put("/api/folders/:id", (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE folders SET name = ? WHERE id = ?").run(name, req.params.id);
    res.status(204).send();
  });

  app.get("/api/connections", (req, res) => {
    const connections = db.prepare("SELECT * FROM connections ORDER BY created_at DESC").all();
    const decryptedConnections = connections.map((conn: any) => ({
      ...conn,
      password: conn.password ? decrypt(conn.password) : null
    }));
    res.json(decryptedConnections);
  });

  app.post("/api/connections", (req, res) => {
    const { name, host, port, username, password, folder_id } = req.body;
    
    // Basic validation
    if (!name || !host || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const encryptedPassword = password ? encrypt(password) : null;
    const info = db.prepare(
      "INSERT INTO connections (name, host, port, username, password, folder_id) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name, host, port || 22, username, encryptedPassword, folder_id || null);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/connections/:id", (req, res) => {
    const { name, host, port, username, password, folder_id } = req.body;
    
    if (!name || !host || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const encryptedPassword = password ? encrypt(password) : null;
    db.prepare(
      "UPDATE connections SET name = ?, host = ?, port = ?, username = ?, password = ?, folder_id = ? WHERE id = ?"
    ).run(name, host, port, username, encryptedPassword, folder_id, req.params.id);
    res.status(204).send();
  });

  app.patch("/api/connections/:id/folder", (req, res) => {
    const { folder_id } = req.body;
    db.prepare("UPDATE connections SET folder_id = ? WHERE id = ?").run(folder_id, req.params.id);
    res.status(204).send();
  });

  app.delete("/api/connections/:id", (req, res) => {
    db.prepare("DELETE FROM connections WHERE id = ?").run(req.params.id);
    res.status(204).send();
  });

  // Scripts API
  app.get("/api/scripts", (req, res) => {
    const scripts = db.prepare("SELECT * FROM scripts ORDER BY name ASC").all();
    res.json(scripts);
  });

  app.post("/api/scripts", (req, res) => {
    const { name, content } = req.body;
    const info = db.prepare("INSERT INTO scripts (name, content) VALUES (?, ?)").run(name, content);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/scripts/:id", (req, res) => {
    const { name, content } = req.body;
    db.prepare("UPDATE scripts SET name = ?, content = ? WHERE id = ?").run(name, content, req.params.id);
    res.status(204).send();
  });

  app.delete("/api/scripts/:id", (req, res) => {
    db.prepare("DELETE FROM scripts WHERE id = ?").run(req.params.id);
    res.status(204).send();
  });

  // Socket.io for SSH
  io.on("connection", (socket) => {
    console.log("Client connected to socket");
    let sshClient: Client | null = null;

    socket.on("ssh-connect", (config) => {
      console.log(`Attempting SSH connection to ${config.host} for user ${config.username}`);
      sshClient = new Client();
      
      sshClient
        .on("ready", () => {
          console.log("SSH Ready");
          socket.emit("ssh-status", "connected");
          sshClient?.shell((err, stream) => {
            if (err) {
              console.error("Shell error:", err);
              socket.emit("ssh-error", err.message);
              return;
            }

            socket.on("ssh-input", (data) => {
              stream.write(data);
            });

            socket.on("ssh-resize", (cols, rows) => {
              stream.setWindow(rows, cols, 0, 0);
            });

            stream.on("data", (data: Buffer) => {
              socket.emit("ssh-output", data.toString("utf-8"));
            });

            stream.on("close", () => {
              socket.emit("ssh-status", "disconnected");
              sshClient?.end();
            });
          });
        })
        .on("keyboard-interactive", (name, instructions, instructionsLang, prompts, finish) => {
          // Handle keyboard-interactive auth (common in Ubuntu)
          if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
            finish([config.password]);
          } else {
            finish([]);
          }
        })
        .on("error", (err) => {
          console.error("SSH Connection Error:", err.message);
          socket.emit("ssh-error", err.message);
        })
        .on("close", () => {
          socket.emit("ssh-status", "disconnected");
        })
        .connect({
          host: config.host,
          port: config.port || 22,
          username: config.username,
          password: config.password,
          tryKeyboard: true, // Enable keyboard-interactive
          readyTimeout: 40000,
          keepaliveInterval: 10000,
          keepaliveCountMax: 3,
        });
    });

    socket.on("disconnect", () => {
      if (sshClient) {
        sshClient.end();
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, the server might be running from dist-server or root
    let distPath = path.join(__dirname, "dist");
    if (!fs.existsSync(distPath)) {
      distPath = path.join(__dirname, "..", "dist");
    }
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
