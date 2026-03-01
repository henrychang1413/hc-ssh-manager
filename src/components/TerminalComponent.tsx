import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';
import { SSHConnection, Script, TerminalSettings } from '../types';

export interface TerminalHandle {
  getBuffer: () => string;
}

interface TerminalComponentProps {
  connection: SSHConnection;
  onClose: () => void;
  activeScript?: Script | null;
  onScriptExecuted?: () => void;
  settings: TerminalSettings;
}

const TerminalComponent = forwardRef<TerminalHandle, TerminalComponentProps>(({ connection, onClose, activeScript, onScriptExecuted, settings }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const statusRef = useRef<'connecting' | 'connected' | 'disconnected'>('connecting');
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // 10 minutes inactivity timeout
    inactivityTimerRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        xtermRef.current?.writeln('\r\n\x1b[33mSession closed due to 10 minutes of inactivity. Press Enter to reconnect.\x1b[0m');
        setStatus('disconnected');
        socketRef.current.disconnect();
      }
    }, 10 * 60 * 1000);
  };

  const connect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setStatus('connecting');
    statusRef.current = 'connecting';
    xtermRef.current?.writeln('\r\n\x1b[36mReconnecting...\x1b[0m');
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      xtermRef.current?.writeln('\x1b[32mConnected to terminal proxy...\x1b[0m');
      socket.emit('ssh-connect', connection);
      resetInactivityTimer();
    });

    socket.on('disconnect', () => {
      if (statusRef.current !== 'disconnected') {
        xtermRef.current?.writeln('\r\n\x1b[33mConnection lost. Press Enter to reconnect.\x1b[0m');
        setStatus('disconnected');
        statusRef.current = 'disconnected';
      }
    });

    socket.on('ssh-output', (data: string) => {
      xtermRef.current?.write(data);
      resetInactivityTimer();
    });

    socket.on('ssh-error', (err: string) => {
      xtermRef.current?.writeln(`\r\n\x1b[31mSSH Error: ${err}\x1b[0m`);
      setStatus('disconnected');
      statusRef.current = 'disconnected';
    });

    socket.on('ssh-status', (status: string) => {
      if (status === 'disconnected') {
        xtermRef.current?.writeln('\r\n\x1b[33mSSH Session Disconnected. Press Enter to reconnect.\x1b[0m');
        setStatus('disconnected');
        statusRef.current = 'disconnected';
      } else if (status === 'connected') {
        setStatus('connected');
        statusRef.current = 'connected';
      }
    });
  };

  useImperativeHandle(ref, () => ({
    getBuffer: () => {
      if (!xtermRef.current) return '';
      const buffer = xtermRef.current.buffer.active;
      let lines: string[] = [];
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        if (line) {
          const lineStr = line.translateToString().trimEnd();
          if (line.isWrapped && lines.length > 0) {
            lines[lines.length - 1] += lineStr;
          } else {
            lines.push(lineStr);
          }
        }
      }
      // Remove trailing empty lines that often fill the bottom of the terminal
      while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      return lines.join('\n');
    }
  }));

  useEffect(() => {
    if (activeScript && socketRef.current?.connected) {
      // Send script lines with a small delay between them to ensure processing
      const lines = activeScript.content.split('\n');
      lines.forEach((line, index) => {
        setTimeout(() => {
          socketRef.current?.emit('ssh-input', line + '\r');
        }, index * 300); // 300ms delay between commands
      });
      onScriptExecuted?.();
      resetInactivityTimer();
    }
  }, [activeScript]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      scrollback: 5000,
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#f7768e',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    // Safety check for fit
    const safeFit = () => {
      try {
        if (terminalRef.current && terminalRef.current.offsetWidth > 0) {
          fitAddon.fit();
          if (socketRef.current?.connected) {
            socketRef.current.emit('ssh-resize', term.cols, term.rows);
          }
        }
      } catch (e) {
        console.warn('XTerm fit failed:', e);
      }
    };

    // Use ResizeObserver for more robust fitting
    const resizeObserver = new ResizeObserver(() => {
      safeFit();
    });
    resizeObserver.observe(terminalRef.current);

    xtermRef.current = term;

    connect();

    term.onData((data) => {
      if (statusRef.current === 'disconnected' && (data === '\r' || data === '\n')) {
        connect();
      } else if (socketRef.current?.connected) {
        socketRef.current.emit('ssh-input', data);
        resetInactivityTimer();
      }
    });

    return () => {
      resizeObserver.disconnect();
      if (socketRef.current) socketRef.current.disconnect();
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      term.dispose();
    };
  }, [connection, settings.fontSize, settings.fontFamily]);

  return (
    <div className="w-full h-full bg-[#1a1b26] p-2 overflow-hidden">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
});

export default TerminalComponent;
