export interface SSHConnection {
  id?: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  folder_id?: number | null;
}

export interface Folder {
  id: number;
  name: string;
}

export interface Script {
  id: number;
  name: string;
  content: string;
}

export interface Tab {
  id: string;
  title: string;
  connection?: SSHConnection;
  type: 'terminal' | 'manager';
}

export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
}
