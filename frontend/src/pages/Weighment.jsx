import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, Truck, Save, CheckCircle2, X, Loader2, Search, Clock, 
  AlertCircle, Camera, Check, RotateCcw, Printer, RefreshCw, Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import './weighment-console.css';
import { io } from 'socket.io-client';
import { cn } from '../lib/utils';

const DRAFT_KEY = "antigravity_weighment_react_draft";

export default function Weighment() {
  // Master lists from API
  const [weighments, setWeighments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form states
  const [ticketNo, setTicketNo] = useState('');
  const [entryDateTime, setEntryDateTime] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState(null); // If set, we are editing/completing a ticket
  const [isSecondWeightMode, setIsSecondWeightMode] = useState(false);

  // Form Fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Weight fields
  const [weightMode, setWeightMode] = useState('auto'); // 'auto' | 'manual'
  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [smsNotify, setSmsNotify] = useState(true);

  // Live scale link states
  const [scaleLiveWeight, setScaleLiveWeight] = useState(0);
  const [scaleStable, setScaleStable] = useState(false);
  const [scaleOnline, setScaleOnline] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [focusedCustomerIndex, setFocusedCustomerIndex] = useState(-1);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Camera states
  const [capturedFront, setCapturedFront] = useState(false);
  const [capturedRear, setCapturedRear] = useState(false);
  const [capturingFront, setCapturingFront] = useState(false);
  const [capturingRear, setCapturingRear] = useState(false);
  const [flashFront, setFlashFront] = useState(false);
  const [flashRear, setFlashRear] = useState(false);

  // Modals & Toasts
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Draft indicator
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const draftTimerRef = useRef(null);

  // Clock
  const [consoleTime, setConsoleTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setConsoleTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) => {
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const formatDate = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Toast helper
  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch Master Data & Tickets
  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    try {
      const [w, c, m, d] = await Promise.all([
        api.get('/weighments', { search: searchQuery, status: statusFilter, limit: 50 }),
        api.get('/customers', { status: 'Active' }),
        api.get('/materials', { status: 'Active' }),
        api.get('/drivers', { status: 'Active' }),
      ]);
      setWeighments(Array.isArray(w) ? w : []);
      setCustomers(Array.isArray(c) ? c : []);
      setMaterials(Array.isArray(m) ? m : []);
      setDrivers(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
      addToast('error', 'Fetch Error', 'Failed to retrieve records.');
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('connection:status', (data) => {
      setScaleOnline(data.status === 'Connected');
    });

    socket.on('weight:update', (data) => {
      setScaleLiveWeight(data.weight);
      setScaleStable(data.stable);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handle customer combobox list filtering
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    (c.code && c.code.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Initialize new ticket
  const startNewEntry = useCallback(() => {
    const nextNum = weighments.length > 0 
      ? `WB-${String(weighments.length + 1001).padStart(5, '0')}`
      : 'WB-01001';
    setTicketNo(nextNum);
    setEntryDateTime(`${formatDate(new Date())}, ${formatTime(new Date())}`);
    setSelectedTicketId(null);
    setIsSecondWeightMode(false);
    setVehicleNumber('');
    setCustomerId('');
    setCustomerName('');
    setCustomerSearch('');
    setMaterialId('');
    setDriverId('');
    setDriverName('');
    setDriverMobile('');
    setGrossWeight('');
    setTareWeight('');
    setRemarks('');
    setCapturedFront(false);
    setCapturedRear(false);
    setErrorMessage('');
    localStorage.removeItem(DRAFT_KEY);
  }, [weighments]);

  // Load existing ticket for completing 2nd weight
  const loadTicketForSecondWeight = (ticket) => {
    setSelectedTicketId(ticket._id);
    setIsSecondWeightMode(true);
    setTicketNo(ticket.ticketNo);
    setEntryDateTime(formatDate(new Date(ticket.firstWeightTime || ticket.createdAt)));
    setVehicleNumber(ticket.vehicleNumber);
    
    // Find customer
    setCustomerId(ticket.customerId);
    setCustomerName(ticket.customerName);
    setCustomerSearch(ticket.customerName);

    setMaterialId(ticket.materialId || '');
    setDriverId(ticket.driverId || '');
    setDriverName(ticket.driverName || '');
    
    // Find driver phone if available
    const matchedDriver = drivers.find(d => d._id === ticket.driverId);
    setDriverMobile(matchedDriver?.phone || ticket.driverMobile || '');

    setGrossWeight(ticket.grossWeight);
    setTareWeight(ticket.tareWeight || '');
    setRemarks(ticket.remarks || '');
    
    setCapturedFront(true); // Simulate past captured feeds
    setCapturedRear(true);

    addToast('info', 'Ticket Loaded', `Loaded ticket ${ticket.ticketNo} for Second Weight.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-focus the tare weight input or its read button
    setTimeout(() => {
      if (weightMode === 'auto') {
        const readBtn = document.getElementById('read-tare-btn');
        if (readBtn) readBtn.focus();
      } else {
        const tareInput = document.getElementById('tare-weight-input');
        if (tareInput) tareInput.focus();
      }
    }, 200);
  };

  useEffect(() => {
    const handleGlobalSearch = (e) => {
      const query = e.detail?.trim();
      if (!query) return;

      // Find in existing weighments (pending or completed)
      const matched = weighments.find(w => 
        w.ticketNo.toLowerCase() === query.toLowerCase() || 
        w.vehicleNumber.toLowerCase() === query.toLowerCase()
      );

      if (matched) {
        if (matched.status === 'First Weight') {
          loadTicketForSecondWeight(matched);
        } else {
          addToast('warning', 'Completed Ticket', `Ticket ${matched.ticketNo} for ${matched.vehicleNumber} is already completed.`);
        }
      } else {
        // If not found in the list, start a new entry with this vehicle number
        startNewEntry();
        setVehicleNumber(query.toUpperCase());
        addToast('info', 'New Vehicle', `Started new first weight entry for vehicle: ${query.toUpperCase()}`);
        
        // Auto-focus the customer search field
        setTimeout(() => {
          const custInput = document.getElementById('customer-search-input');
          if (custInput) custInput.focus();
        }, 150);
      }
    };

    window.addEventListener('antigravity-global-search', handleGlobalSearch);
    return () => window.removeEventListener('antigravity-global-search', handleGlobalSearch);
  }, [weighments, loadTicketForSecondWeight, startNewEntry]);

  // Restore draft on mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        setTicketNo(draft.ticketNo);
        setEntryDateTime(draft.entryDateTime);
        setVehicleNumber(draft.vehicleNumber);
        setCustomerId(draft.customerId);
        setCustomerName(draft.customerName);
        setCustomerSearch(draft.customerName);
        setMaterialId(draft.materialId);
        setDriverId(draft.driverId);
        setDriverName(draft.driverName);
        setDriverMobile(draft.driverMobile);
        setGrossWeight(draft.grossWeight);
        setTareWeight(draft.tareWeight);
        setRemarks(draft.remarks);
        setWeightMode(draft.weightMode);
        setSmsNotify(draft.smsNotify);
        setCapturedFront(draft.capturedFront);
        setCapturedRear(draft.capturedRear);
      } else {
        startNewEntry();
      }
    } catch (e) {
      startNewEntry();
    }
  }, [weighments.length, startNewEntry]);

  // Trigger autosave draft
  const triggerAutosave = useCallback(() => {
    if (selectedTicketId) return; // Don't autosave while finishing an existing ticket
    const draftData = {
      ticketNo,
      entryDateTime,
      vehicleNumber,
      customerId,
      customerName,
      materialId,
      driverId,
      driverName,
      driverMobile,
      grossWeight,
      tareWeight,
      remarks,
      weightMode,
      smsNotify,
      capturedFront,
      capturedRear
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    setShowDraftSaved(true);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => setShowDraftSaved(false), 2000);
  }, [
    ticketNo, entryDateTime, vehicleNumber, customerId, customerName, materialId,
    driverId, driverName, driverMobile, grossWeight, tareWeight, remarks,
    weightMode, smsNotify, capturedFront, capturedRear, selectedTicketId
  ]);

  // Recalculate net weight
  const getNetWeight = () => {
    const g = parseFloat(grossWeight) || 0;
    const t = parseFloat(tareWeight) || 0;
    if (g === 0 || t === 0) return '— — — —';
    return g - t;
  };

  // Read Scale (real or simulated fallback)
  const handleScaleRead = (field) => {
    if (weightMode === 'manual') return;
    const isGross = field === 'gross';
    
    if (scaleOnline) {
      if (isGross) {
        setGrossWeight(scaleLiveWeight);
        addToast('success', 'Gross Locked', `Weighbridge locked weight: ${scaleLiveWeight} kg`);
      } else {
        setTareWeight(scaleLiveWeight);
        addToast('success', 'Tare Locked', `Weighbridge locked weight: ${scaleLiveWeight} kg`);
      }
      triggerAutosave();
    } else {
      // Fallback to simulation
      addToast('info', 'Scale Link Offline', 'Starting weighbridge scale simulation fallback...');
      setTimeout(() => {
        if (isGross) {
          const tareVal = parseFloat(tareWeight) || 9200;
          const simulatedGross = tareVal + Math.round((Math.random() * 15000 + 10000) / 10) * 10;
          setGrossWeight(simulatedGross);
          addToast('success', 'Gross Locked', `Weighbridge locked weight: ${simulatedGross} kg`);
        } else {
          const simulatedTare = Math.round((Math.random() * 6000 + 6000) / 10) * 10;
          setTareWeight(simulatedTare);
          addToast('success', 'Tare Locked', `Weighbridge locked weight: ${simulatedTare} kg`);
        }
        triggerAutosave();
      }, 700);
    }
  };

  // Camera Capture Simulation
  const simulateCameraCapture = (cam) => {
    const isFront = cam === 'front';
    const setCapturing = isFront ? setCapturingFront : setCapturingRear;
    const setCaptured = isFront ? setCapturedFront : setCapturedRear;
    const setFlash = isFront ? setFlashFront : setFlashRear;

    if (isFront ? capturedFront : capturedRear) {
      // Retake action
      setCaptured(false);
      triggerAutosave();
      return;
    }

    setCapturing(true);
    setTimeout(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      setCapturing(false);
      setCaptured(true);
      addToast('success', 'Camera Captured', `${isFront ? 'Front-facing' : 'Rear-facing'} license snapshot locked.`);
      triggerAutosave();
    }, 700);
  };

  // Submit / Save Ticket
  const handleSave = async (printAfter = false) => {
    if (actionLoading) return;
    setErrorMessage('');
    
    // Validation
    if (!customerId) {
      setErrorMessage('Please select a valid customer.');
      return;
    }
    if (!vehicleNumber) {
      setErrorMessage('Vehicle Number is required.');
      return;
    }
    if (!materialId) {
      setErrorMessage('Please select a material.');
      return;
    }
    if (!grossWeight || parseFloat(grossWeight) <= 0) {
      setErrorMessage('Gross weight is required.');
      return;
    }

    if (isSecondWeightMode) {
      if (!tareWeight || parseFloat(tareWeight) <= 0) {
        setErrorMessage('Tare weight is required to complete the ticket.');
        return;
      }
      if (parseFloat(grossWeight) <= parseFloat(tareWeight)) {
        setErrorMessage('Gross weight must be strictly greater than Tare weight.');
        return;
      }
    }

    setActionLoading(true);
    try {
      let savedTicket;
      if (isSecondWeightMode) {
        // Complete weighment (Record second weight)
        savedTicket = await api.put(`/weighments/${selectedTicketId}/second-weight`, {
          tareWeight: parseFloat(tareWeight)
        });
      } else {
        // Create first weight weighment
        savedTicket = await api.post('/weighments', {
          customerId,
          materialId,
          driverId: driverId || null,
          vehicleNumber: vehicleNumber.toUpperCase(),
          grossWeight: parseFloat(grossWeight),
          remarks
        });
      }

      if (savedTicket.message && !savedTicket._id) {
        throw new Error(savedTicket.message);
      }

      addToast('success', 'Transaction Saved', `Ticket ${savedTicket.ticketNo} recorded successfully.`);
      
      // Update list
      setWeighments(prev => {
        const idx = prev.findIndex(w => w._id === savedTicket._id);
        if (idx >= 0) {
          const n = [...prev];
          n[idx] = savedTicket;
          return n;
        }
        return [savedTicket, ...prev];
      });

      if (printAfter) {
        setPrintData({
          ...savedTicket,
          entryDateTime: new Date(savedTicket.createdAt).toLocaleString(),
          material: materials.find(m => m._id === savedTicket.materialId)?.name || savedTicket.materialName || 'N/A',
          customerName: customers.find(c => c._id === savedTicket.customerId)?.name || savedTicket.customerName || 'N/A',
          driver: drivers.find(d => d._id === savedTicket.driverId)?.name || driverName || 'N/A',
          phone: driverMobile || 'N/A'
        });
        setShowPrintModal(true);
      }

      // Reset
      startNewEntry();
      fetchAll();
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during save.');
      addToast('error', 'Save Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Keyboard navigation for customer select
  const handleCustomerKeyDown = (e) => {
    if (!showCustomerDropdown) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const matSelect = document.getElementById('material-select-input');
        if (matSelect) matSelect.focus();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedCustomerIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedCustomerIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      let selected = null;
      if (focusedCustomerIndex >= 0 && filteredCustomers[focusedCustomerIndex]) {
        selected = filteredCustomers[focusedCustomerIndex];
      } else if (filteredCustomers.length > 0) {
        selected = filteredCustomers[0];
      }
      
      if (selected) {
        setCustomerId(selected._id);
        setCustomerName(selected.name);
        setCustomerSearch(selected.name);
        setShowCustomerDropdown(false);
        triggerAutosave();
        
        // Auto-focus the next field: Material Select
        setTimeout(() => {
          const matSelect = document.getElementById('material-select-input');
          if (matSelect) matSelect.focus();
        }, 100);
      }
    } else if (e.key === 'Escape') {
      setShowCustomerDropdown(false);
    }
  };

  // Keyboard navigation for other inputs
  const handleVehicleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTimeout(() => {
        const custInput = document.getElementById('customer-search-input');
        if (custInput) custInput.focus();
      }, 100);
    }
  };

  const handleMaterialKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTimeout(() => {
        const driverSelect = document.getElementById('driver-select-input');
        if (driverSelect) driverSelect.focus();
      }, 100);
    }
  };

  const handleDriverKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTimeout(() => {
        if (weightMode === 'auto') {
          handleScaleRead(isSecondWeightMode ? 'tare' : 'gross');
          const remarksInput = document.getElementById('remarks-input');
          if (remarksInput) remarksInput.focus();
        } else {
          const wtInput = document.getElementById(isSecondWeightMode ? 'tare-weight-input' : 'gross-weight-input');
          if (wtInput) wtInput.focus();
        }
      }, 100);
    }
  };

  const handleRemarksKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave(false);
    }
  };

  // When driver selected from master list
  const handleDriverChange = (dId) => {
    setDriverId(dId);
    const selected = drivers.find(d => d._id === dId);
    if (selected) {
      setDriverName(selected.name);
      setDriverMobile(selected.phone || '');
    } else {
      setDriverName('');
      setDriverMobile('');
    }
    triggerAutosave();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Toast Stack */}
      <div className="fixed bottom-24 right-6 z-[300] flex flex-col gap-2.5 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className={`p-4 rounded-lg shadow-2xl border flex gap-3 items-start bg-slate-900 ${
                t.type === 'success' ? 'border-emerald-500/30' : t.type === 'error' ? 'border-red-500/30' : 'border-amber/30'
              }`}
            >
              <div className="mt-0.5">
                {t.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : t.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Scale className="w-5 h-5 text-amber" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-slate-100">{t.title}</div>
                <div className="text-xs text-slate-400 mt-1">{t.message}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Weighbridge Operator Console</h2>
          <p className="text-slate-500 mt-1">Capture live digital scale readings and generate weighment receipts.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-950/20 px-4 py-2 border border-slate-200/50 rounded-xl">
          <div className="text-right">
            <span className="block text-[9px] font-mono tracking-widest text-slate-500 uppercase leading-none">Console Ticket</span>
            <span className="text-lg font-mono font-bold text-amber-bright tracking-wider">{ticketNo || 'WB-00000'}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Form Panels */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Panel 01: Identification */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm panel-glow">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50/50">
              <span className="font-mono text-xs font-semibold text-amber border border-amber/40 rounded px-2 py-0.5">01</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Identification</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Entry Date / Time</label>
                <input type="text" value={entryDateTime} readOnly className="px-4 py-2.5 text-sm" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ticket Number</label>
                <input type="text" value={ticketNo} readOnly className="px-4 py-2.5 text-sm font-mono font-bold text-amber-bright" />
              </div>

              {/* Customer combobox search */}
              <div className="sm:col-span-2 flex flex-col gap-1.5 relative">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Customer <span className="text-amber">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    id="customer-search-input"
                    value={customerSearch}
                    disabled={isSecondWeightMode}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerId('');
                      setCustomerName('');
                      setShowCustomerDropdown(true);
                      setFocusedCustomerIndex(-1);
                    }}
                    onFocus={() => {
                      if (!isSecondWeightMode) setShowCustomerDropdown(true);
                    }}
                    onKeyDown={handleCustomerKeyDown}
                    placeholder="Search by customer name or code..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm"
                  />
                  {customerId && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  )}
                </div>

                {/* Combobox dropdown suggestions */}
                {showCustomerDropdown && !isSecondWeightMode && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowCustomerDropdown(false)}></div>
                    <ul className="absolute top-[100%] left-0 right-0 z-40 bg-slate-900 border border-slate-200 mt-1 max-h-60 overflow-y-auto rounded-lg shadow-2xl p-1.5">
                      {filteredCustomers.length === 0 ? (
                        <li className="p-3 text-sm text-slate-500 text-center">No matching customers</li>
                      ) : (
                        filteredCustomers.map((c, idx) => (
                          <li 
                            key={c._id}
                            onClick={() => {
                              setCustomerId(c._id);
                              setCustomerName(c.name);
                              setCustomerSearch(c.name);
                              setShowCustomerDropdown(false);
                              triggerAutosave();
                              setTimeout(() => {
                                const matSelect = document.getElementById('material-select-input');
                                if (matSelect) matSelect.focus();
                              }, 100);
                            }}
                            className={`p-2.5 rounded-md cursor-pointer flex items-center justify-between text-sm ${
                              idx === focusedCustomerIndex ? 'bg-primary-50 text-amber' : 'text-slate-200 hover:bg-slate-200/20 hover:text-amber-bright'
                            }`}
                          >
                            <span>{c.name}</span>
                            <span className="text-xs font-mono text-slate-400 uppercase">{c.code || 'NO-CODE'}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Vehicle Number <span className="text-amber">*</span>
                </label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    id="vehicle-number-input"
                    value={vehicleNumber}
                    disabled={isSecondWeightMode}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value.toUpperCase());
                      triggerAutosave();
                    }}
                    onKeyDown={handleVehicleKeyDown}
                    placeholder="e.g. MH12AB1234"
                    className="w-full pl-10 pr-4 py-2.5 text-sm uppercase font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Material <span className="text-amber">*</span>
                </label>
                <select 
                  id="material-select-input"
                  value={materialId}
                  disabled={isSecondWeightMode}
                  onChange={(e) => {
                    setMaterialId(e.target.value);
                    triggerAutosave();
                  }}
                  onKeyDown={handleMaterialKeyDown}
                  className="w-full px-4 py-2.5 text-sm"
                >
                  <option value="" disabled>Select material...</option>
                  {materials.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Panel 02: Driver Details */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm panel-glow">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50/50">
              <span className="font-mono text-xs font-semibold text-amber border border-amber/40 rounded px-2 py-0.5">02</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Driver Details</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Select Registered Driver</label>
                <select 
                  id="driver-select-input"
                  value={driverId}
                  disabled={isSecondWeightMode}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  onKeyDown={handleDriverKeyDown}
                  className="w-full px-4 py-2.5 text-sm"
                >
                  <option value="">-- Choose Driver (Optional) --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Driver Name</label>
                <input 
                  type="text" 
                  value={driverName}
                  disabled={isSecondWeightMode}
                  onChange={(e) => {
                    setDriverName(e.target.value);
                    triggerAutosave();
                  }}
                  placeholder="Custom name if not in list"
                  className="px-4 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Driver Mobile Number</label>
                <input 
                  type="tel" 
                  value={driverMobile}
                  disabled={isSecondWeightMode}
                  onChange={(e) => {
                    setDriverMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                    triggerAutosave();
                  }}
                  placeholder="e.g. 9876543210"
                  className="px-4 py-2.5 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Panel 03: Weighment */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm panel-glow">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50/50">
              <span className="font-mono text-xs font-semibold text-amber border border-amber/40 rounded px-2 py-0.5">03</span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Weighment Control</h3>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Mode toggles */}
              <div className="flex bg-slate-900 p-1 border border-slate-200 rounded-lg gap-1.5 items-center justify-between">
                <div className="flex gap-1.5 flex-1">
                  <button 
                    type="button"
                    onClick={() => setWeightMode('auto')}
                    className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 border border-transparent transition-all cursor-pointer ${
                      weightMode === 'auto' ? 'bg-amber text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Auto Scale Mode
                  </button>
                  <button 
                    type="button"
                    onClick={() => setWeightMode('manual')}
                    className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 border border-transparent transition-all cursor-pointer ${
                      weightMode === 'manual' ? 'bg-amber text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" /> Manual Entry
                  </button>
                </div>
                {weightMode === 'auto' && (
                  <div className="px-3 py-1 bg-black/40 rounded border border-slate-800 flex items-center gap-2 text-xs font-mono ml-2 shrink-0">
                    <span className={cn(
                      "w-2 h-2 rounded-full inline-block",
                      scaleOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                    )} />
                    <span className={cn("font-bold", scaleOnline ? "text-amber" : "text-slate-500")}>
                      {scaleOnline ? `${scaleLiveWeight} kg` : 'OFFLINE'}
                    </span>
                    {scaleOnline && (
                      <span className={cn(
                        "text-[9px] px-1 rounded",
                        scaleStable ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber"
                      )}>
                        {scaleStable ? 'STABLE' : 'LIVE'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Weight Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Gross Weight */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Gross Weight (kg)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      id="gross-weight-input"
                      value={grossWeight}
                      readOnly={weightMode === 'auto' || isSecondWeightMode}
                      onChange={(e) => {
                        setGrossWeight(e.target.value);
                        triggerAutosave();
                      }}
                      placeholder="0"
                      className="flex-1 px-4 py-2.5 text-sm font-mono font-bold"
                    />
                    {weightMode === 'auto' && !isSecondWeightMode && (
                      <button 
                        type="button"
                        id="read-gross-btn"
                        onClick={() => handleScaleRead('gross')}
                        className="bg-slate-800 text-amber hover:bg-slate-200/20 border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" /> Read
                      </button>
                    )}
                  </div>
                </div>

                {/* Tare Weight */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tare Weight (kg)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      id="tare-weight-input"
                      value={tareWeight}
                      readOnly={weightMode === 'auto' || !isSecondWeightMode}
                      onChange={(e) => {
                        setTareWeight(e.target.value);
                        triggerAutosave();
                      }}
                      placeholder="0"
                      className="flex-1 px-4 py-2.5 text-sm font-mono font-bold"
                    />
                    {weightMode === 'auto' && isSecondWeightMode && (
                      <button 
                        type="button"
                        id="read-tare-btn"
                        onClick={() => handleScaleRead('tare')}
                        className="bg-slate-800 text-amber hover:bg-slate-200/20 border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" /> Read
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* LED Net Weight display */}
              <div className="bg-slate-950 border border-slate-200/80 rounded-xl p-5 relative overflow-hidden flex flex-wrap items-baseline gap-2.5 crt-screen">
                <div className="absolute inset-0 bg-radial-gradient-vignette pointer-events-none z-10" />
                <span className="font-mono text-[10px] tracking-wider text-slate-500 uppercase w-full relative z-10">Net Weight</span>
                
                <span className={`font-mono font-bold text-4xl tracking-wide transition-colors relative z-10 ${
                  getNetWeight() !== '— — — —' && parseFloat(getNetWeight()) >= 0
                    ? 'led-glow-green'
                    : 'led-glow-red'
                }`}>
                  {typeof getNetWeight() === 'number' ? getNetWeight().toLocaleString() : getNetWeight()}
                </span>
                <span className="font-mono text-sm text-slate-500">kg</span>
                <span className="ml-auto font-mono text-[10px] text-slate-500">Gross − Tare</span>
              </div>

              {/* SMS Notification Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer select-none text-slate-600 text-sm">
                <input 
                  type="checkbox"
                  checked={smsNotify}
                  onChange={(e) => {
                    setSmsNotify(e.target.checked);
                    triggerAutosave();
                  }}
                  className="w-4 h-4 rounded border-slate-200 text-amber focus:ring-amber/40 bg-slate-900 cursor-pointer"
                />
                <span>Queue SMS notification to client on completion</span>
              </label>

              {/* Form Remarks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Remarks / Notes</label>
                <textarea 
                  value={remarks}
                  id="remarks-input"
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    triggerAutosave();
                  }}
                  onKeyDown={handleRemarksKeyDown}
                  rows={2}
                  placeholder="Enter remarks..."
                  className="px-4 py-2.5 text-sm resize-none"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Camera feeds & Captured Badge */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm panel-glow">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-amber border border-amber/40 rounded px-2 py-0.5">04</span>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Camera Capture</h3>
              </div>
              <span className={`text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                (capturedFront && capturedRear) ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {(capturedFront && capturedRear) ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                {((capturedFront ? 1 : 0) + (capturedRear ? 1 : 0))}/2 Captured
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Front Camera Feed */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-slate-200/80 bg-slate-950 shadow-inner group crt-screen">
                  <div className="absolute inset-0 bg-radial-gradient-vignette pointer-events-none z-10" />
                  
                  {/* Live HUD */}
                  <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-center text-[10px] font-mono text-slate-200 z-10">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${capturedFront ? 'bg-slate-600' : 'bg-red-500 animate-pulse shadow-[0_0_6px_#ff3b30]'}`} />
                      <span>{capturedFront ? 'CAPTURED' : 'LIVE'}</span>
                    </div>
                    <span>{formatTime(consoleTime)}</span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-3 bg-black/40 text-[9.5px] font-mono text-slate-300 z-10">
                    <span>FRONT CAM · WB-01</span>
                  </div>

                  {/* Captured Badge overlay */}
                  {capturedFront && (
                    <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[0.5px] flex items-center justify-center z-10">
                      <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-mono font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                        <CheckCircle2 className="w-4 h-4" /> CAPTURED
                      </div>
                    </div>
                  )}

                  {/* Mock camera flash */}
                  {flashFront && <div className="absolute inset-0 bg-white z-20 animate-fade-out" />}

                  {/* Camera lens graphic */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700/40">
                    <Camera className="w-16 h-16" />
                    <span className="text-[10px] font-mono mt-2 tracking-widest uppercase">Lens Active</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => simulateCameraCapture('front')}
                  disabled={capturingFront}
                  className={`w-full py-3 rounded-lg border font-semibold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    capturedFront 
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 hover:content-["Retake"]' 
                      : 'border-slate-200 text-slate-300 bg-slate-900 hover:border-amber-dim hover:text-amber-bright hover:bg-primary-50'
                  }`}
                >
                  {capturingFront ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Capturing License...
                    </>
                  ) : capturedFront ? (
                    <>
                      <RotateCcw className="w-4 h-4" /> Retake Front
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Capture Front
                    </>
                  )}
                </button>
              </div>

              {/* Rear Camera Feed */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-slate-200/80 bg-slate-950 shadow-inner group crt-screen">
                  <div className="absolute inset-0 bg-radial-gradient-vignette pointer-events-none z-10" />
                  
                  <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-center text-[10px] font-mono text-slate-200 z-10">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${capturedRear ? 'bg-slate-600' : 'bg-red-500 animate-pulse shadow-[0_0_6px_#ff3b30]'}`} />
                      <span>{capturedRear ? 'CAPTURED' : 'LIVE'}</span>
                    </div>
                    <span>{formatTime(consoleTime)}</span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-3 bg-black/40 text-[9.5px] font-mono text-slate-300 z-10">
                    <span>REAR CAM · WB-02</span>
                  </div>

                  {capturedRear && (
                    <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[0.5px] flex items-center justify-center z-10">
                      <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-mono font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                        <CheckCircle2 className="w-4 h-4" /> CAPTURED
                      </div>
                    </div>
                  )}

                  {flashRear && <div className="absolute inset-0 bg-white z-20 animate-fade-out" />}

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700/40">
                    <Camera className="w-16 h-16" />
                    <span className="text-[10px] font-mono mt-2 tracking-widest uppercase">Lens Active</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => simulateCameraCapture('rear')}
                  disabled={capturingRear}
                  className={`w-full py-3 rounded-lg border font-semibold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    capturedRear 
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400' 
                      : 'border-slate-200 text-slate-300 bg-slate-900 hover:border-amber-dim hover:text-amber-bright hover:bg-primary-50'
                  }`}
                >
                  {capturingRear ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Capturing License...
                    </>
                  ) : capturedRear ? (
                    <>
                      <RotateCcw className="w-4 h-4" /> Retake Rear
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Capture Rear
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Panel 05: Active & Pending Tickets (Full-Width table below) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm panel-glow">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-amber border border-amber/40 rounded px-2 py-0.5">05</span>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active &amp; Recent Transactions</h3>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 border border-slate-200 rounded-full">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs font-mono text-slate-200 w-36 outline-none focus:ring-0 placeholder-slate-500 py-0.5 px-0"
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border-none text-xs text-slate-400 cursor-pointer outline-none focus:ring-0 py-0 px-2 select-clean"
            >
              <option value="All">All</option>
              <option value="First Weight">Pending (1st Wt)</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber" />
            </div>
          ) : weighments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No weighments found matching the criteria.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Gross (kg)</th>
                  <th className="px-5 py-3">Tare (kg)</th>
                  <th className="px-5 py-3">Net (kg)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weighments.map(w => (
                  <tr key={w._id} className="hover:bg-primary-50/20 transition-all">
                    <td className="px-5 py-3.5 font-bold font-mono text-xs text-slate-200">{w.ticketNo}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-200 uppercase">{w.vehicleNumber}</td>
                    <td className="px-5 py-3.5 text-slate-400 truncate max-w-[150px]">{w.customerName}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-300">{w.grossWeight?.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-300">{w.tareWeight ? w.tareWeight.toLocaleString() : '—'}</td>
                    <td className={`px-5 py-3.5 font-mono font-bold text-xs ${w.netWeight > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {w.netWeight ? w.netWeight.toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        w.status === 'Completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber border-amber/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {w.status === 'First Weight' ? (
                        <button 
                          onClick={() => loadTicketForSecondWeight(w)}
                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Scale className="w-3 h-3" /> Finish 2nd Wt
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sticky Actionbar at the bottom of the console */}
      <footer className="sticky bottom-0 z-40 -mx-6 md:-mx-8 -mb-6 md:-mb-8 bg-slate-900 border-t border-slate-200/50 p-4 px-8 flex items-center justify-between gap-4 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
        
        {/* Autosaved Indicator */}
        <div className={`flex items-center gap-2 text-xs font-mono text-emerald-400 transition-opacity duration-300 ${
          showDraftSaved ? 'opacity-100' : 'opacity-0'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Console Draft Autosaved</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-300 hover:border-red-500 hover:text-red-400 transition-colors text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" /> Cancel / Clear
          </button>
          
          <button 
            type="button"
            onClick={() => handleSave(false)}
            disabled={actionLoading}
            className="px-6 py-2.5 rounded-lg border border-amber/30 text-amber bg-primary-50 hover:bg-amber-soft transition-colors text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSecondWeightMode ? 'Complete Weighment' : 'Save First Weight'}
          </button>

          <button 
            type="button"
            onClick={() => handleSave(true)}
            disabled={actionLoading}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-bright to-amber-dim text-slate-950 hover:brightness-110 font-bold transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Save &amp; Print Slip
          </button>
        </div>
      </footer>

      {/* Cancel confirm modal */}
      {showCancelModal && (
        <div className="modal-overlay-custom">
          <div className="bg-slate-800 border border-slate-200 max-w-sm w-full p-6 rounded-xl shadow-2xl text-center">
            <AlertCircle className="w-12 h-12 text-amber mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-100 mb-2">Discard this entry?</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              All currently entered details and captured camera photographs for Ticket <strong className="text-amber">{ticketNo}</strong> will be permanently discarded.
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-300 hover:bg-slate-200/20 text-xs font-bold transition-all cursor-pointer"
              >
                Keep Editing
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  startNewEntry();
                  addToast('info', 'Form Cleared', 'Console reset and new ticket number issued.');
                }}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Discard Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print slip modal */}
      {showPrintModal && printData && (
        <div className="modal-overlay-custom">
          <div className="bg-slate-800 border border-slate-200 max-w-md w-full p-6 rounded-xl shadow-2xl">
            
            {/* The white ticket container */}
            <div id="printArea" className="bg-white text-slate-950 p-6 rounded-lg font-sans">
              <h2 className="text-lg font-extrabold text-slate-950 border-b-2 border-slate-900 pb-2.5 mb-4 text-center uppercase tracking-wide">
                Weighment Transaction Receipt
              </h2>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Ticket Number:</span>
                  <span className="font-bold font-mono">{printData.ticketNo}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Date / Time:</span>
                  <span className="font-mono">{printData.entryDateTime}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Customer Name:</span>
                  <span className="font-bold">{printData.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Vehicle Number:</span>
                  <span className="font-bold font-mono uppercase">{printData.vehicleNumber}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Material Type:</span>
                  <span className="font-bold">{printData.material}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Driver Details:</span>
                  <span>{printData.driver} ({printData.phone})</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Gross Weight:</span>
                  <span className="font-mono font-bold">{printData.grossWeight?.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="text-slate-600">Tare Weight:</span>
                  <span className="font-mono font-bold">{printData.tareWeight ? `${printData.tareWeight.toLocaleString()} kg` : '—'}</span>
                </div>
              </div>

              {printData.netWeight > 0 && (
                <div className="bg-slate-900 text-amber text-center py-3.5 px-4 rounded-md font-mono text-xl font-bold tracking-wider mt-5">
                  {printData.netWeight?.toLocaleString()} kg NET
                </div>
              )}

              <p className="text-[10px] text-slate-500 mt-5 text-center leading-relaxed">
                Generated by Antigravity ERP System<br />
                Weighbridge digital console gateway · WB-01/02
              </p>
            </div>

            {/* Print actions */}
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintData(null);
                }}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-300 hover:bg-slate-200/20 text-xs font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>
              <button 
                type="button"
                onClick={() => {
                  try {
                    window.print();
                  } catch (e) {
                    addToast('error', 'Print Failed', 'Browser print controller blocked or unavailable.');
                  }
                }}
                className="flex-1 py-2 rounded-lg bg-amber text-slate-950 hover:brightness-110 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Trigger System Print
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
