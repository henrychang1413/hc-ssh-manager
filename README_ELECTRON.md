# HC-SSH Desktop App Packaging

This project is configured to be packaged as a desktop application for **Windows, macOS, and Linux**.

## Prerequisites

- Node.js (v18+)
- npm

## How to Build the Installer

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Build the app (CRITICAL)**:
    ```bash
    npm run build
    ```
    This creates the `dist` folder (frontend) and `dist-server` folder (backend) which the app needs in production mode.

3.  **Generate the Installer**:
    ```bash
    npm run make
    ```
    - **Windows**: Creates a `.exe` installer in `out/make/squirrel.windows/`.
    - **macOS**: Creates a `.dmg` or `.zip` in `out/make/`.
    - **Linux**: Creates a `.deb` package in `out/make/deb/`.

## Security Features

- **Credential Encryption**: All SSH passwords are encrypted using AES-256 before being stored in the local database.
- **Secret Key Isolation**: The encryption key is generated locally on the first run and stored separately from the database.
- **Input Validation**: Server-side validation prevents malformed connection requests.

## Troubleshooting: Blank Screen

If the app opens to a blank screen:

1.  **Check Build**: Ensure you ran `npm run build` before `npm run make`. The server looks for a `dist` folder to serve the UI.
2.  **Check Port**: The app starts a local server on port 3000. Ensure no other service is using that port.
3.  **Logs**: Run the app from a terminal to see any error logs.

## Running the App in Development Mode

To test the Electron app locally without packaging:

```bash
npm run electron:start
```
