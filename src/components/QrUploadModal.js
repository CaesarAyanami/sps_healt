"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, CheckCircle2, Clock, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';

/**
 * QrUploadModal
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   patient: { id, caso, primerNombre, primerApellido }
 *   onSuccess: () => void  — callback al completar la subida
 */
export default function QrUploadModal({ isOpen, onClose, patient, onSuccess }) {
  const [phase, setPhase] = useState('idle'); // idle | generating | waiting | success | error | expired
  const [uploadUrl, setUploadUrl] = useState('');
  const [token, setToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const pollingRef = useRef(null);
  const timerRef = useRef(null);

  // Limpiar todo al cerrar
  const handleClose = useCallback(() => {
    clearInterval(pollingRef.current);
    clearInterval(timerRef.current);
    setPhase('idle');
    setUploadUrl('');
    setToken('');
    setQrDataUrl('');
    setExpiresAt(null);
    setTimeLeft(0);
    setErrorMsg('');
    onClose();
  }, [onClose]);

  // Generar QR
  const generateQr = useCallback(async () => {
    if (!patient?.id) return;
    setPhase('generating');
    setErrorMsg('');

    try {
      const res = await fetch('/api/qr-upload/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      // Generar imagen QR
      const dataUrl = await QRCode.toDataURL(data.uploadUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });

      setUploadUrl(data.uploadUrl);
      setToken(data.token);
      setQrDataUrl(dataUrl);
      setExpiresAt(new Date(data.expiresAt));
      setPhase('waiting');
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Error al generar el código QR');
    }
  }, [patient]);

  // Auto-generar al abrir
  useEffect(() => {
    if (isOpen && phase === 'idle') {
      generateQr();
    }
  }, [isOpen, phase, generateQr]);

  // Temporizador visual (cuenta regresiva)
  useEffect(() => {
    if (phase !== 'waiting' || !expiresAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        clearInterval(pollingRef.current);
        setPhase('expired');
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, expiresAt]);

  // Polling de estado (cada 3 segundos)
  useEffect(() => {
    if (phase !== 'waiting' || !token) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/qr-upload/status/${token}`);
        const data = await res.json();
        if (!data.success) return;
        if (data.usado) {
          clearInterval(pollingRef.current);
          clearInterval(timerRef.current);
          setPhase('success');
          toast.success('¡Documento subido desde el móvil!');
          onSuccess?.();
        } else if (data.expired) {
          clearInterval(pollingRef.current);
          setPhase('expired');
        }
      } catch { /* ignorar errores de red temporales */ }
    };

    pollingRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollingRef.current);
  }, [phase, token, onSuccess]);

  // Formatear tiempo
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPct = expiresAt ? Math.max(0, (timeLeft / 900) * 100) : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-600 to-blue-600">
              <div className="flex items-center gap-2.5">
                <QrCode size={20} className="text-white" />
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">Subir por QR</h3>
                  <p className="text-violet-200 text-xs leading-tight">
                    {patient?.primerNombre} {patient?.primerApellido} · #{patient?.caso}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/70 hover:text-white transition rounded-lg p-1">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">

              {/* GENERATING */}
              {phase === 'generating' && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="w-10 h-10 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Generando código QR...</p>
                </div>
              )}

              {/* WAITING */}
              {phase === 'waiting' && (
                <>
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Smartphone size={15} className="text-violet-500" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Escanea con tu teléfono
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">Abre la cámara o CamScanner y apunta al QR</p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100">
                      {qrDataUrl && (
                        <img src={qrDataUrl} alt="QR de subida" width={200} height={200} className="rounded-lg" />
                      )}
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> Expira en
                      </span>
                      <span className={`font-bold tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${timeLeft < 60 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-blue-500'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Waiting indicator */}
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                      Esperando archivo del móvil...
                    </span>
                  </div>

                  {/* URL manual */}
                  <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">O accede manualmente:</p>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all leading-relaxed">{uploadUrl}</p>
                  </div>
                </>
              )}

              {/* SUCCESS */}
              {phase === 'success' && (
                <div className="flex flex-col items-center py-8 text-center gap-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={36} className="text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">¡Archivo recibido!</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      El PDF fue subido desde el móvil y ya está en el expediente.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {/* EXPIRED */}
              {phase === 'expired' && (
                <div className="flex flex-col items-center py-6 text-center gap-4">
                  <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle size={30} className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">QR Expirado</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      El código QR ha expirado (15 min). Genera uno nuevo.
                    </p>
                  </div>
                  <button
                    onClick={generateQr}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition text-sm"
                  >
                    <RefreshCw size={16} /> Generar nuevo QR
                  </button>
                </div>
              )}

              {/* ERROR */}
              {phase === 'error' && (
                <div className="flex flex-col items-center py-6 text-center gap-4">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <X size={28} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Error</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{errorMsg}</p>
                  </div>
                  <button
                    onClick={generateQr}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition text-sm"
                  >
                    <RefreshCw size={16} /> Reintentar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
