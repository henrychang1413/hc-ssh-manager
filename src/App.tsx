import React, { useState, useEffect, useRef } from 'react';
import { 
  Download,
  Upload,
  Copy,
  Check,
  Plus, 
  Terminal as TerminalIcon, 
  HelpCircle, 
  X, 
  Server, 
  Key, 
  Trash2, 
  ChevronRight,
  Monitor,
  Layout,
  Folder as FolderIcon,
  FolderPlus,
  ChevronDown,
  Edit2,
  Play,
  FileCode,
  ChevronUp,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TerminalComponent, { TerminalHandle } from './components/TerminalComponent';
import { SSHConnection, Tab, Folder, Script, TerminalSettings } from './types';

const POPULAR_FONTS = [
  { name: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
  { name: 'Fira Code', value: 'Fira Code, monospace' },
  { name: 'Source Code Pro', value: 'Source Code Pro, monospace' },
  { name: 'Roboto Mono', value: 'Roboto Mono, monospace' },
  { name: 'Ubuntu Mono', value: 'Ubuntu Mono, monospace' },
  { name: 'Space Mono', value: 'Space Mono, monospace' },
  { name: 'Inconsolata', value: 'Inconsolata, monospace' },
  { name: 'Anonymous Pro', value: 'Anonymous Pro, monospace' },
  { name: 'IBM Plex Mono', value: 'IBM Plex Mono, monospace' },
  { name: 'Courier Prime', value: 'Courier Prime, monospace' },
];

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'manager', title: 'Connections', type: 'manager' }]);
  const [activeTabId, setActiveTabId] = useState('manager');
  const [savedConnections, setSavedConnections] = useState<SSHConnection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isAddingScript, setIsAddingScript] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showTerminalSettings, setShowTerminalSettings] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<number, boolean>>({});
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [showTools, setShowTools] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [terminalSettings, setTerminalSettings] = useState<TerminalSettings>(() => {
    const saved = localStorage.getItem('hc_terminal_settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace'
    };
  });

  const terminalRefs = useRef<Record<string, TerminalHandle | null>>({});

  useEffect(() => {
    localStorage.setItem('hc_terminal_settings', JSON.stringify(terminalSettings));
  }, [terminalSettings]);

  const [newConn, setNewConn] = useState<SSHConnection>({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    folder_id: null
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [newScript, setNewScript] = useState<Omit<Script, 'id'>>({
    name: '',
    content: ''
  });

  const isPrivateIP = (host: string) => {
    const parts = host.split('.').map(Number);
    if (parts.length !== 4) return false;
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  };

  const isCloudPreview = window.location.hostname.includes('run.app');
  const showPrivateIPWarning = isCloudPreview && isPrivateIP(newConn.host);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [connRes, folderRes, scriptRes] = await Promise.all([
        fetch('/api/connections'),
        fetch('/api/folders'),
        fetch('/api/scripts')
      ]);
      const conns = await connRes.json();
      const flds = await folderRes.json();
      const scrs = await scriptRes.json();
      setSavedConnections(conns);
      setFolders(flds);
      setScripts(scrs);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingConnection ? 'PUT' : 'POST';
      const url = editingConnection ? `/api/connections/${editingConnection.id}` : '/api/connections';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConn)
      });
      if (res.ok) {
        fetchData();
        setIsAddingConnection(false);
        setEditingConnection(null);
        setNewConn({ name: '', host: '', port: 22, username: '', password: '', folder_id: null });
      }
    } catch (err) {
      console.error('Failed to save connection', err);
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingFolder ? 'PUT' : 'POST';
      const url = editingFolder ? `/api/folders/${editingFolder.id}` : '/api/folders';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      });
      if (res.ok) {
        fetchData();
        setIsAddingFolder(false);
        setEditingFolder(null);
        setNewFolderName('');
      }
    } catch (err) {
      console.error('Failed to save folder', err);
    }
  };

  const handleAddScript = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingScript ? 'PUT' : 'POST';
      const url = editingScript ? `/api/scripts/${editingScript.id}` : '/api/scripts';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScript)
      });
      if (res.ok) {
        fetchData();
        setIsAddingScript(false);
        setEditingScript(null);
        setNewScript({ name: '', content: '' });
      }
    } catch (err) {
      console.error('Failed to save script', err);
    }
  };

  const deleteConnection = async (id: number) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    try {
      await fetch(`/api/connections/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete connection', err);
    }
  };

  const deleteFolder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this folder? Connections inside will be uncategorized.')) return;
    try {
      await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete folder', err);
    }
  };

  const deleteScript = async (id: number) => {
    if (!confirm('Are you sure you want to delete this script?')) return;
    try {
      await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete script', err);
    }
  };

  const openConnection = (conn: SSHConnection) => {
    const existingTab = tabs.find(t => t.connection?.id === conn.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const tabId = `ssh-${Date.now()}`;
    const newTab: Tab = {
      id: tabId,
      title: conn.name,
      connection: conn,
      type: 'terminal'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(tabId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === 'manager') return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const toggleFolder = (id: number) => {
    setCollapsedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddConnection = () => {
    setActiveTabId('manager');
    setIsAddingConnection(true);
    setIsAddingFolder(false);
    setIsAddingScript(false);
    setEditingConnection(null);
    setNewConn({ name: '', host: '', port: 22, username: '', password: '', folder_id: null });
  };

  const openEditConnection = (conn: SSHConnection) => {
    setActiveTabId('manager');
    setIsAddingConnection(true);
    setEditingConnection(conn);
    setNewConn({ ...conn });
  };

  const openAddFolder = () => {
    setActiveTabId('manager');
    setIsAddingFolder(true);
    setEditingFolder(null);
    setNewFolderName('');
    setIsAddingConnection(false);
    setIsAddingScript(false);
  };

  const openEditFolder = (folder: Folder) => {
    setActiveTabId('manager');
    setIsAddingFolder(true);
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setIsAddingConnection(false);
    setIsAddingScript(false);
  };

  const openAddScript = () => {
    setActiveTabId('manager');
    setIsAddingScript(true);
    setIsAddingConnection(false);
    setIsAddingFolder(false);
    setEditingScript(null);
    setNewScript({ name: '', content: '' });
  };

  const openEditScript = (script: Script) => {
    setActiveTabId('manager');
    setIsAddingScript(true);
    setEditingScript(script);
    setNewScript({ name: script.name, content: script.content });
  };

  const onDragStart = (e: React.DragEvent, connectionId: number) => {
    e.dataTransfer.setData('connectionId', connectionId.toString());
  };

  const onDrop = async (e: React.DragEvent, folderId: number | null) => {
    e.preventDefault();
    const connectionId = parseInt(e.dataTransfer.getData('connectionId'));
    try {
      await fetch(`/api/connections/${connectionId}/folder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to move connection', err);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const copyTerminalOutput = (tabId: string) => {
    const handle = terminalRefs.current[tabId];
    if (handle) {
      const content = handle.getBuffer();
      navigator.clipboard.writeText(content);
      setCopySuccess(tabId);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const exportData = () => {
    const data = {
      folders,
      connections: savedConnections.map(({ id, ...rest }) => rest), // Remove IDs for clean import
      scripts: scripts.map(({ id, ...rest }) => rest)
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webssh-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!confirm('This will import folders, connections, and scripts. Continue?')) return;

        // Import Folders first
        const folderMap: Record<string, number> = {};
        if (data.folders) {
          for (const folder of data.folders) {
            const res = await fetch('/api/folders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: folder.name })
            });
            const { id } = await res.json();
            folderMap[folder.id] = id;
          }
        }

        // Import Connections
        if (data.connections) {
          for (const conn of data.connections) {
            const newConn = { ...conn };
            if (conn.folder_id && folderMap[conn.folder_id]) {
              newConn.folder_id = folderMap[conn.folder_id];
            } else {
              newConn.folder_id = null;
            }
            await fetch('/api/connections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newConn)
            });
          }
        }

        // Import Scripts
        if (data.scripts) {
          for (const script of data.scripts) {
            await fetch('/api/scripts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(script)
            });
          }
        }

        fetchData();
        alert('Import successful!');
      } catch (err) {
        console.error('Import failed', err);
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-[#0f111a] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <div 
        onDoubleClick={(e) => {
          // Only hide if double clicking the sidebar background, not elements
          if (e.target === e.currentTarget) {
            setIsSidebarHidden(true);
          }
        }}
        className={`
          bg-[#1a1b26] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out relative
          ${isSidebarHidden ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'}
        `}
      >
        <div className="p-4 border-bottom border-white/5 flex items-center justify-between overflow-hidden whitespace-nowrap">
          <div 
            className="flex items-center gap-2 font-semibold text-white cursor-pointer hover:text-indigo-400 transition-colors group"
            onClick={() => setShowHelp(true)}
            title="Click for Help & About"
          >
            <img src="/Logo.png" alt="Logo" className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
            <span>HC-SSH</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={exportData}
              className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-500"
              title="Export Config"
            >
              <Download size={18} />
            </button>
            <label className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-500 cursor-pointer" title="Import Config">
              <Upload size={18} />
              <input type="file" className="hidden" accept=".json" onChange={importData} />
            </label>
            <button 
              onClick={openAddFolder}
              className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-500"
              title="New Folder"
            >
              <FolderPlus size={18} />
            </button>
            <button 
              onClick={openAddConnection}
              className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-500"
              title="New Connection"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin" onDoubleClick={() => setIsSidebarHidden(true)}>
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Saved Sessions
          </div>
          
          {/* Folders */}
          {folders.map(folder => (
            <div 
              key={folder.id} 
              className="space-y-1"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, folder.id)}
            >
              <div 
                className="flex items-center justify-between p-2 rounded-md hover:bg-white/5 cursor-pointer group"
                onClick={() => toggleFolder(folder.id)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {collapsedFolders[folder.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <FolderIcon size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200 truncate">{folder.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}
                    className="p-1 hover:text-indigo-400"
                    title="Rename Folder"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                    className="p-1 hover:text-red-400"
                    title="Delete Folder"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              
              {!collapsedFolders[folder.id] && (
                <div className="ml-4 border-l border-white/5 pl-2 space-y-1 min-h-[10px]">
                  {savedConnections.filter(c => c.folder_id === folder.id).map(conn => (
                    <div 
                      key={conn.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, conn.id!)}
                      className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 cursor-pointer transition-all"
                      onClick={() => openConnection(conn)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Server size={14} className="text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-medium text-slate-200 truncate">{conn.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditConnection(conn); }}
                          className="p-1 hover:text-indigo-400"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id!); }}
                          className="p-1 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Uncategorized Connections */}
          <div 
            className="mt-4 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, null)}
          >
            Uncategorized
          </div>
          <div className="min-h-[20px]">
            {savedConnections.filter(c => !c.folder_id).map(conn => (
              <div 
                key={conn.id}
                draggable
                onDragStart={(e) => onDragStart(e, conn.id!)}
                className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 cursor-pointer transition-all"
                onClick={() => openConnection(conn)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Server size={16} className="text-slate-500 group-hover:text-indigo-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-sm font-medium text-slate-200 truncate">{conn.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{conn.host}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditConnection(conn); }}
                    className="p-1 hover:text-indigo-400"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id!); }}
                    className="p-1 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Scripts Section */}
          <div className="mt-8 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold flex justify-between items-center">
            <span>Command Scripts</span>
            <button onClick={openAddScript} className="hover:text-white"><Plus size={12} /></button>
          </div>
          {scripts.map(script => (
            <div 
              key={script.id}
              className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 cursor-pointer transition-all"
              onClick={() => openEditScript(script)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileCode size={16} className="text-emerald-500 shrink-0" />
                <div className="text-sm font-medium text-slate-200 truncate">{script.name}</div>
              </div>
              <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditScript(script); }}
                  className="p-1 hover:text-indigo-400"
                  title="Edit Script"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteScript(script.id); }}
                  className="p-1 hover:text-red-400"
                  title="Delete Script"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Bar */}
        <div className="flex bg-[#1a1b26] border-b border-white/5 overflow-x-auto scrollbar-hide items-center">
          {isSidebarHidden && (
            <button 
              onClick={() => setIsSidebarHidden(false)}
              className="p-3 hover:bg-white/5 text-indigo-400 border-r border-white/5 transition-colors"
              title="Show Sidebar"
            >
              <Monitor size={18} />
            </button>
          )}
          <div className="flex flex-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm cursor-pointer border-r border-white/5 min-w-[120px] max-w-[200px] transition-all shrink-0
                  ${activeTabId === tab.id ? 'bg-[#0f111a] text-white border-t-2 border-t-indigo-500' : 'hover:bg-white/5'}
                `}
              >
                {tab.type === 'manager' ? <Layout size={14} /> : <TerminalIcon size={14} />}
                <span className="truncate flex-1">{tab.title}</span>
                {tab.id !== 'manager' && (
                  <X 
                    size={14} 
                    className="hover:text-white" 
                    onClick={(e) => closeTab(e, tab.id)}
                  />
                )}
              </div>
            ))}
          </div>
          
          {activeTabId !== 'manager' && (
            <div className="flex items-center px-2 gap-1 border-l border-white/5 h-full">
              <button 
                onClick={() => copyTerminalOutput(activeTabId)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all flex items-center gap-1.5 text-xs"
                title="Copy Output"
              >
                {copySuccess === activeTabId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button 
                onClick={() => setShowTerminalSettings(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all flex items-center gap-1.5 text-xs"
                title="Terminal Settings"
              >
                <Monitor size={14} />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence>
            {showTerminalSettings && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#0f111a]/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#1a1b26] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <Monitor size={20} className="text-indigo-400" />
                      <h2 className="text-xl font-bold text-white">Terminal Settings</h2>
                    </div>
                    <button onClick={() => setShowTerminalSettings(false)} className="text-slate-500 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Font Family</label>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {POPULAR_FONTS.map(font => (
                          <button
                            key={font.name}
                            onClick={() => setTerminalSettings({...terminalSettings, fontFamily: font.value})}
                            className={`
                              flex items-center justify-between p-3 rounded-lg border transition-all text-left
                              ${terminalSettings.fontFamily === font.value 
                                ? 'bg-indigo-500/10 border-indigo-500 text-white' 
                                : 'bg-[#0f111a] border-white/5 text-slate-400 hover:border-white/20'}
                            `}
                            style={{ fontFamily: font.value }}
                          >
                            <span>{font.name}</span>
                            {terminalSettings.fontFamily === font.value && <Check size={16} className="text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-medium text-slate-500 uppercase">Font Size</label>
                        <span className="text-indigo-400 font-mono font-bold">{terminalSettings.fontSize}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="24" 
                        step="1"
                        value={terminalSettings.fontSize}
                        onChange={(e) => setTerminalSettings({...terminalSettings, fontSize: parseInt(e.target.value)})}
                        className="w-full h-2 bg-[#0f111a] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>10px</span>
                        <span>24px</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <div className="p-4 bg-[#0f111a] rounded-lg border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase mb-2">Preview</p>
                        <p 
                          className="text-white truncate" 
                          style={{ 
                            fontFamily: terminalSettings.fontFamily, 
                            fontSize: `${terminalSettings.fontSize}px` 
                          }}
                        >
                          admin@hc-ssh:~$ ls -la
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowTerminalSettings(false)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Apply Settings
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {showHelp && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#0f111a]/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#1a1b26] border border-white/10 p-8 rounded-2xl max-w-2xl shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500"></div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                        <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">HC-SSH Manager</h2>
                        <p className="text-xs text-slate-500">Version V1.0.0</p>
                      </div>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-6 text-slate-300 text-sm">
                    <section>
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        About the App
                      </h3>
                      <p className="leading-relaxed">
                        HC-SSH Manager is a professional-grade SSH client manager designed for developers and system administrators. 
                        It features multi-tabbed terminal sessions, secure credential storage, organized folder structures, and automated script execution.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        How to Install Locally
                      </h3>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                        <p className="text-xs text-slate-400">To manage local network devices (192.168.x.x, etc.), you should run this app on your own machine:</p>
                        <ol className="list-decimal list-inside space-y-2 text-xs">
                          <li>Install <span className="text-white font-mono">Node.js 20+</span> on your system.</li>
                          <li>Download the project source code.</li>
                          <li>Open terminal in the project folder and run <code className="text-emerald-400 bg-emerald-400/5 px-1 rounded">npm install</code>.</li>
                          <li>Start the application with <code className="text-emerald-400 bg-emerald-400/5 px-1 rounded">npm run dev</code>.</li>
                          <li>Access the manager at <code className="text-indigo-400 bg-indigo-400/5 px-1 rounded">http://localhost:3000</code>.</li>
                        </ol>
                      </div>
                    </section>

                    <section className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Author</span>
                        <span className="text-white font-medium">Henry Chang</span>
                        <a href="mailto:henrychang1413@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs">
                          henrychang1413@gmail.com
                        </a>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">License</span>
                        <p className="text-white text-xs">MIT License</p>
                      </div>
                    </section>
                  </div>
                  
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Got it
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent Tab Rendering */}
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`absolute inset-0 ${activeTabId === tab.id ? 'block' : 'hidden'}`}
            >
              {tab.type === 'manager' ? (
                <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome to HC-SSH Manager</h1>
                    <p className="text-slate-500">Manage your remote servers and automated scripts with ease.</p>
                  </div>
                  
                  {isAddingFolder ? (
                    <div className="bg-[#1a1b26] p-6 rounded-xl border border-white/5 shadow-xl mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">{editingFolder ? 'Rename Folder' : 'Add New Folder'}</h2>
                        <button onClick={() => setIsAddingFolder(false)} className="text-slate-500 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleAddFolder} className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Folder Name</label>
                          <input 
                            required
                            autoFocus
                            type="text" 
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                            placeholder="Servers"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg transition-colors"
                        >
                          {editingFolder ? 'Update Folder' : 'Create Folder'}
                        </button>
                      </form>
                    </div>
                  ) : isAddingScript ? (
                    <div className="bg-[#1a1b26] p-6 rounded-xl border border-white/5 shadow-xl mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">{editingScript ? 'Edit Script' : 'Add New Script'}</h2>
                        <button onClick={() => setIsAddingScript(false)} className="text-slate-500 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleAddScript} className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Script Name</label>
                          <input 
                            required
                            type="text" 
                            value={newScript.name}
                            onChange={e => setNewScript({...newScript, name: e.target.value})}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                            placeholder="Debug Mode"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Commands (One per line)</label>
                          <textarea 
                            required
                            rows={8}
                            value={newScript.content}
                            onChange={e => setNewScript({...newScript, content: e.target.value})}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                            placeholder={"fnsysctl shell\nusername\npassword"}
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg transition-colors"
                        >
                          {editingScript ? 'Update Script' : 'Save Script'}
                        </button>
                      </form>
                    </div>
                  ) : isAddingConnection ? (
                    <div className="bg-[#1a1b26] p-6 rounded-xl border border-white/5 shadow-xl">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">{editingConnection ? 'Edit Connection' : 'Add New Connection'}</h2>
                        <button onClick={() => setIsAddingConnection(false)} className="text-slate-500 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleAddConnection} className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-2">
                          <p className="text-xs text-amber-200 leading-relaxed">
                            <strong>Note:</strong> Since this app runs in a cloud environment, it can only connect to servers with <strong>public IP addresses</strong> or those reachable via the internet. Local IPs (like 192.168.x.x) will not work.
                          </p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Display Name</label>
                          <input 
                            required
                            type="text" 
                            value={newConn.name}
                            onChange={e => setNewConn({...newConn, name: e.target.value})}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                            placeholder="My Ubuntu Server"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Hostname / IP</label>
                          <input 
                            required
                            type="text" 
                            value={newConn.host}
                            onChange={e => setNewConn({...newConn, host: e.target.value})}
                            className={`w-full bg-[#0f111a] border rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 ${showPrivateIPWarning ? 'border-red-500/50' : 'border-white/10'}`}
                            placeholder="192.168.1.10"
                          />
                          {showPrivateIPWarning && (
                            <p className="text-[10px] text-red-400 mt-1">
                              ⚠️ This is a private IP. Cloud Preview cannot reach it.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Port</label>
                          <input 
                            type="number" 
                            value={newConn.port}
                            onChange={e => setNewConn({...newConn, port: parseInt(e.target.value)})}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                            placeholder="22"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Username</label>
                          <input 
                            required
                            type="text" 
                            value={newConn.username}
                            onChange={e => setNewConn({...newConn, username: e.target.value})}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                            placeholder="root"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Password</label>
                          <input 
                            type="password" 
                            value={newConn.password}
                            onChange={e => setNewConn({...newConn, password: e.target.value})}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Folder</label>
                          <select 
                            value={newConn.folder_id || ''}
                            onChange={e => setNewConn({...newConn, folder_id: e.target.value ? parseInt(e.target.value) : null})}
                            className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">None</option>
                            {folders.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 pt-4">
                          <button 
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg transition-colors"
                          >
                            {editingConnection ? 'Update Connection' : 'Save Connection'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedConnections.length === 0 ? (
                          <div className="col-span-2 py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <Server size={48} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500">No saved connections yet.</p>
                            <div className="flex justify-center gap-4 mt-4">
                              <button 
                                onClick={openAddFolder}
                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                              >
                                Create a folder
                              </button>
                              <button 
                                onClick={openAddConnection}
                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                              >
                                Create a session
                              </button>
                            </div>
                          </div>
                        ) : (
                          savedConnections.map(conn => (
                            <div 
                              key={conn.id}
                              onClick={() => openConnection(conn)}
                              className="bg-[#1a1b26] p-4 rounded-xl border border-white/5 hover:border-indigo-500/50 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                  <Server size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-white font-semibold truncate">{conn.name}</h3>
                                  <p className="text-xs text-slate-500 truncate">{conn.username}@{conn.host}:{conn.port}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openEditConnection(conn); }}
                                    className="p-2 hover:bg-white/10 rounded-md text-slate-500 hover:text-indigo-400 transition-colors"
                                    title="Edit Connection"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id!); }}
                                    className="p-2 hover:bg-white/10 rounded-md text-slate-500 hover:text-red-400 transition-colors"
                                    title="Delete Connection"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <ChevronRight size={18} className="text-slate-700 group-hover:text-indigo-400 ml-1" />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border-t border-white/5 pt-8">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-white">Command Scripts</h2>
                          <button 
                            onClick={openAddScript}
                            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            <Plus size={16} />
                            New Script
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {scripts.map(script => (
                            <div 
                              key={script.id}
                              onClick={() => openEditScript(script)}
                              className="bg-[#1a1b26] p-4 rounded-xl border border-white/5 hover:border-emerald-500/50 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                  <FileCode size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-white font-semibold truncate">{script.name}</h3>
                                  <p className="text-xs text-slate-500 truncate">{script.content.split('\n').length} commands</p>
                                </div>
                                <Edit2 size={16} className="text-slate-700 group-hover:text-emerald-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {/* Script Tools Overlay */}
                  <div className="absolute top-4 right-4 z-40">
                    <div className="relative">
                      <button 
                        onClick={() => setShowTools(showTools === tab.id ? null : tab.id)}
                        className="bg-[#1a1b26]/80 backdrop-blur-md border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#24283b] transition-all shadow-xl"
                      >
                        <Play size={14} className="text-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Tools</span>
                        {showTools === tab.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      <AnimatePresence>
                        {showTools === tab.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full mt-2 right-0 w-56 bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                          >
                            <div className="p-2 text-[10px] uppercase font-bold text-slate-500 border-b border-white/5">Run Script</div>
                            <div className="max-h-64 overflow-y-auto">
                              {scripts.length === 0 ? (
                                <div className="p-4 text-xs text-slate-500 text-center italic">No scripts saved</div>
                              ) : (
                                scripts.map(s => (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      setActiveScript(s);
                                      setShowTools(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 flex items-center gap-3 transition-colors group"
                                  >
                                    <FileCode size={14} className="text-emerald-500" />
                                    <span className="flex-1 truncate">{s.name}</span>
                                    <Play size={10} className="opacity-0 group-hover:opacity-100 text-emerald-400" />
                                  </button>
                                ))
                              )}
                            </div>
                            <div className="p-2 border-t border-white/5">
                              <button 
                                onClick={() => { setActiveTabId('manager'); setIsAddingScript(true); setShowTools(null); }}
                                className="w-full py-1.5 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                Manage Scripts
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <TerminalComponent 
                    ref={el => terminalRefs.current[tab.id] = el}
                    connection={tab.connection!} 
                    activeScript={activeScript}
                    onScriptExecuted={() => setActiveScript(null)}
                    onClose={() => closeTab({ stopPropagation: () => {} } as any, tab.id)} 
                    settings={terminalSettings}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
