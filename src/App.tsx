import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, ShieldQuestion, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlertStatus {
  status: string;
  beitShemesh?: boolean;
  jerusalem?: boolean;
  message?: string;
  source?: string;
}

export default function App() {
  const [status, setStatus] = useState<AlertStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const apiUrl = `/api/alerts?t=${lastUpdated?.getTime() || 0}`;

  const playAlert = () => {
    if (!audioEnabled) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    const currentApiUrl = `/api/alerts?t=${Date.now()}`;
    try {
      const response = await fetch(currentApiUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 50)}`);
      }
      const data = await response.json();
      if (data.status === 'error') {
        setError(data.message || 'Failed to fetch alert data.');
      } else {
        // Play sound if there's an alert
        if (data.status === 'siren expected' || data.status === 'siren maybe') {
          playAlert();
        }
        setStatus(data);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      setError(`Connection Error: ${err.message || 'Check your internet connection'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [audioEnabled]);

  const getStatusColor = () => {
    if (!status) return 'bg-zinc-100 text-zinc-500';
    switch (status.status) {
      case 'siren expected':
        return 'bg-red-500 text-white shadow-red-200';
      case 'siren maybe':
        return 'bg-orange-500 text-white shadow-orange-200';
      case 'no alerts in the last 20 minutes':
        return 'bg-emerald-500 text-white shadow-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-500';
    }
  };

  const getStatusIcon = () => {
    if (!status) return <ShieldQuestion className="w-12 h-12" />;
    switch (status.status) {
      case 'siren expected':
        return <ShieldAlert className="w-12 h-12" />;
      case 'siren maybe':
        return <ShieldQuestion className="w-12 h-12" />;
      case 'no alerts in the last 20 minutes':
        return <ShieldCheck className="w-12 h-12" />;
      default:
        return <ShieldQuestion className="w-12 h-12" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="mb-4 px-3 py-1 bg-zinc-200 text-zinc-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
        System Version 2.1
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-zinc-100"
      >
        <div className="p-8 flex flex-col items-center text-center">
          <h1 className="text-xl font-semibold text-zinc-800 mb-8 tracking-tight uppercase">
            Siren Expected in Beit Shemesh
          </h1>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-12"
              >
                <RefreshCw className="w-12 h-12 text-zinc-300 animate-spin" />
                <p className="mt-4 text-zinc-400 font-medium">Checking alerts...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-12"
              >
                <ShieldAlert className="w-12 h-12 text-red-400" />
                <p className="mt-4 text-red-500 font-medium">{error}</p>
                <button 
                  onClick={fetchStatus}
                  className="mt-6 px-6 py-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-colors"
                >
                  Retry
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="status"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center w-full"
              >
                <div className={`p-8 rounded-full mb-8 shadow-lg ${getStatusColor()}`}>
                  {getStatusIcon()}
                </div>
                
                <h2 className="text-3xl font-bold text-zinc-900 mb-2 capitalize">
                  {status?.status}
                </h2>
                
                <div className="flex flex-col gap-2 w-full mt-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <span className="text-zinc-500 font-medium">Beit Shemesh</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status?.beitShemesh ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {status?.beitShemesh ? 'Alerted' : 'Clear'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`mt-2 p-3 rounded-xl text-xs font-medium transition-all ${audioEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-zinc-50 text-zinc-400 border border-zinc-100'}`}
                  >
                    {audioEnabled ? '🔊 Alert Sound Enabled' : '🔇 Alert Sound Disabled (Click to Enable)'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-zinc-50 p-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Last updated: {lastUpdated?.toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1 hover:text-zinc-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      <p className="mt-8 text-zinc-400 text-sm max-w-xs text-center">
        Data sourced from {status?.source === 'tzevaadom' ? 'Tzevaadom' : 'Oref'} Alert History. Always follow official Home Front Command instructions.
      </p>
    </div>
  );
}
