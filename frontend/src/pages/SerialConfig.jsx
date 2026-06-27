import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Cpu, Play, Square, RefreshCw, Save, Check, AlertTriangle, 
  Terminal, ShieldAlert, Wifi, WifiOff, FileText, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export default function SerialConfig() {
  // Config state
  const [comPort, setComPort] = useState('COM3');
  const [baudRate, setBaudRate] = useState(2400);
  const [dataBits, setDataBits] = useState(8);
  const [parity, setParity] = useState('none');
  const [stopBits, setStopBits] = useState(1);
  const [flowControl, setFlowControl] = useState('none');
  const [readMode, setReadMode] = useState('continuous');

  // Operational state
  const [ports, setPorts] = useState([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Real-time states
  const [status, setStatus] = useState('Disconnected'); // Connected, Disconnected, Error, Connecting
  const [connectedPort, setConnectedPort] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [liveWeight, setLiveWeight] = useState(0);
  const [stable, setStable] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL'); // ALL, ERROR, STABLE

  const terminalEndRef = useRef(null);

  // Fetch available COM ports
  const fetchPorts = useCallback(async () => {
    setLoadingPorts(true);
    try {
      const data = await api.get('/serial/ports');
      setPorts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load COM ports:', e);
    } finally {
      setLoadingPorts(false);
    }
  }, []);

  // Fetch current stored config
  const fetchConfig = useCallback(async () => {
    try {
      const config = await api.get('/serial/configuration');
      if (config) {
        setComPort(config.comPort || 'COM3');
        setBaudRate(config.baudRate || 2400);
        setDataBits(config.dataBits || 8);
        setParity(config.parity || 'none');
        setStopBits(config.stopBits || 1);
        setFlowControl(config.flowControl || 'none');
        setReadMode(config.readMode || 'continuous');
      }
    } catch (e) {
      console.error('Failed to load serial configuration:', e);
    }
  }, []);

  // Fetch initial status and logs
  const fetchStatusAndLogs = useCallback(async () => {
    try {
      const stat = await api.get('/serial/status');
      if (stat) {
        setStatus(stat.status);
        setConnectedPort(stat.port);
        setLastError(stat.error);
      }
      
      const latestLogs = await api.get('/serial/logs');
      setLogs(Array.isArray(latestLogs) ? latestLogs : []);
      
      const wt = await api.get('/serial/current-weight');
      if (wt) {
        setLiveWeight(wt.weight);
        setStable(wt.stable);
      }
    } catch (e) {
      console.error('Failed to fetch initial status or logs:', e);
    }
  }, []);

  // Initialize and load
  useEffect(() => {
    fetchPorts();
    fetchConfig();
    fetchStatusAndLogs();

    // Establish live socket connection
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    socket.on('connection:status', (data) => {
      setStatus(data.status);
      setConnectedPort(data.port);
      setLastError(data.error);
    });

    socket.on('weight:update', (data) => {
      setLiveWeight(data.weight);
      setStable(data.stable);
    });

    socket.on('serial:log', (logEntry) => {
      setLogs((prev) => [logEntry, ...prev].slice(0, 500));
    });

    socket.on('connection:error', (data) => {
      setLastError(data.error);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchPorts, fetchConfig, fetchStatusAndLogs]);

  // Scroll to bottom of terminal when logs update
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Save config to MongoDB
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await api.put('/serial/configuration', {
        comPort,
        baudRate: Number(baudRate),
        dataBits: Number(dataBits),
        parity,
        stopBits: Number(stopBits),
        flowControl,
        readMode
      });
      alert('Serial port configuration saved successfully.');
    } catch (err) {
      alert('Failed to save config: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await api.post('/serial/test', {
        comPort,
        baudRate: Number(baudRate),
        dataBits: Number(dataBits),
        parity,
        stopBits: Number(stopBits),
        flowControl
      });
      alert(res.message || 'Connection test successful!');
    } catch (err) {
      alert('Test failed: ' + (err.message || 'Could not access COM port.'));
    } finally {
      setTestingConnection(false);
    }
  };

  // Connect port
  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/serial/connect', {
        comPort,
        baudRate: Number(baudRate),
        dataBits: Number(dataBits),
        parity,
        stopBits: Number(stopBits),
        flowControl,
        readMode
      });
      if (res.error) throw new Error(res.error);
    } catch (err) {
      alert('Failed to connect: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Disconnect port
  const handleDisconnect = async () => {
    setActionLoading(true);
    try {
      await api.post('/serial/disconnect');
    } catch (err) {
      alert('Failed to disconnect: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    if (logFilter === 'ALL') return true;
    if (logFilter === 'ERROR') return log.error !== null;
    if (logFilter === 'STABLE') return log.status === 'STABLE';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-amber-bright" />
            Serial Port Configuration
          </h2>
          <p className="text-slate-500 mt-1">Configure parameters and monitor communication status with weighbridge indicators.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Live Scale Display & Status controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Real-time Indicator Weight Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] tracking-widest font-mono text-slate-500 uppercase">Live Weighbridge Scale</span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider",
                stable 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber border border-amber/20 animate-pulse"
              )}>
                {stable ? 'STABLE' : 'UNSTABLE'}
              </span>
            </div>

            {/* Simulated Digital Weight Readout */}
            <div className="flex flex-col items-center justify-center py-10 bg-black/40 rounded-2xl border border-slate-800/80 shadow-inner my-2">
              <span className={cn(
                "font-mono font-extrabold tracking-widest leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                liveWeight > 0 ? "text-amber-bright text-6xl md:text-7xl" : "text-slate-700 text-5xl md:text-6xl"
              )}>
                {liveWeight.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-slate-500 mt-4 tracking-widest uppercase">KILOGRAMS (KG)</span>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Port Name: <strong className="text-slate-300">{connectedPort || 'None'}</strong></span>
              <span>Last Read: <strong className="text-slate-300">{new Date().toLocaleTimeString()}</strong></span>
            </div>
          </div>

          {/* Connection Controller */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary-500" />
              Live Connection Controls
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Connection Status indicator */}
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100">
                <div className="relative">
                  <span className={cn(
                    "w-4 h-4 rounded-full inline-block",
                    status === 'Connected' && 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse',
                    status === 'Connecting' && 'bg-blue-500 animate-pulse',
                    status === 'Error' && 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
                    status === 'Disconnected' && 'bg-slate-400'
                  )}></span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Connection Status</p>
                  <p className="text-base font-bold text-slate-800">{status}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {status === 'Connected' || status === 'Error' || status === 'Connecting' ? (
                  <button 
                    onClick={handleDisconnect} 
                    disabled={actionLoading}
                    className="flex-1 py-3 px-5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Square className="w-4 h-4" /> Disconnect
                  </button>
                ) : (
                  <button 
                    onClick={handleConnect} 
                    disabled={actionLoading}
                    className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" /> Connect
                  </button>
                )}
                
                <button 
                  onClick={handleTestConnection} 
                  disabled={testingConnection || status === 'Connected'}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin"/> : 'Test Link'}
                </button>
              </div>

            </div>

            {lastError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-xs text-red-600">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Connection Error:</strong> {lastError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Parameters Form */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary-500" />
              RS232 Parameters
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">COM Port</label>
                <div className="flex gap-2">
                  <select 
                    value={comPort} 
                    onChange={e => setComPort(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {ports.length === 0 ? (
                      <option value={comPort}>{comPort} (Not Found)</option>
                    ) : (
                      ports.map(p => (
                        <option key={p.path} value={p.path}>
                          {p.path} {p.friendlyName ? `(${p.friendlyName})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <button 
                    type="button" 
                    onClick={fetchPorts}
                    disabled={loadingPorts}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={cn("w-4 h-4", loadingPorts && "animate-spin")} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Baud Rate</label>
                <select 
                  value={baudRate} 
                  onChange={e => setBaudRate(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value={1200}>1200 bps</option>
                  <option value={2400}>2400 bps (Default)</option>
                  <option value={4800}>4800 bps</option>
                  <option value={9600}>9600 bps</option>
                  <option value={19200}>19200 bps</option>
                  <option value={38400}>38400 bps</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Data Bits</label>
                  <select 
                    value={dataBits} 
                    onChange={e => setDataBits(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value={7}>7 Bits</option>
                    <option value={8}>8 Bits (Default)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Stop Bits</label>
                  <select 
                    value={stopBits} 
                    onChange={e => setStopBits(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value={1}>1 Bit (Default)</option>
                    <option value={1.5}>1.5 Bits</option>
                    <option value={2}>2 Bits</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Parity</label>
                  <select 
                    value={parity} 
                    onChange={e => setParity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="none">None (Default)</option>
                    <option value="even">Even</option>
                    <option value="odd">Odd</option>
                    <option value="mark">Mark</option>
                    <option value="space">Space</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Flow Control</label>
                  <select 
                    value={flowControl} 
                    onChange={e => setFlowControl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="none">None (Default)</option>
                    <option value="rtscts">RTS / CTS (Hardware)</option>
                    <option value="xonxoff">XON / XOFF (Software)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Read Mode</label>
                <select 
                  value={readMode} 
                  onChange={e => setReadMode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="continuous">Continuous Output (Default)</option>
                  <option value="demand">On-Demand Request</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={savingConfig}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save Parameter Config
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

      {/* Terminal Communication Logs (Full Width) */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl space-y-4">
        
        {/* Log Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-805 pb-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-amber-bright" />
            <h3 className="font-bold text-slate-200 text-sm font-mono uppercase tracking-wider">Indicator Data Stream Terminal</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={logFilter} 
              onChange={e => setLogFilter(e.target.value)}
              className="bg-slate-800 border-none text-xs text-slate-300 rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Stream Logs</option>
              <option value="STABLE">Stable Readings Only</option>
              <option value="ERROR">Errors Only</option>
            </select>
            
            <button 
              onClick={() => setLogs([])}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Clear Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Terminal Content */}
        <div className="h-64 overflow-y-auto bg-black/60 rounded-xl p-4 border border-slate-950 font-mono text-xs text-slate-300 space-y-1.5 shadow-inner">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 italic py-12 text-center">No communication logs recorded. Verify connection is open.</div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-4 hover:bg-white/5 py-0.5 rounded px-2">
                <span className="text-slate-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-slate-500 shrink-0">[{log.comPort}]</span>
                
                {log.error ? (
                  <span className="text-red-400 font-bold">ERROR: {log.error}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Read Weight:</span>
                    <span className={cn(
                      "font-bold",
                      log.status === 'STABLE' ? 'text-emerald-400' : 'text-amber'
                    )}>
                      {log.weight} kg
                    </span>
                    <span className={cn(
                      "text-[9px] px-1.5 rounded",
                      log.status === 'STABLE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber border border-amber/20'
                    )}>
                      {log.status}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
        
        <p className="text-[10px] text-slate-500 text-center font-mono">
          Terminal logs are stored in memory and limited to the latest 500 records.
        </p>
      </div>

    </div>
  );
}
