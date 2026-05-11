"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function QrUploadPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | valid | expired | used | uploading | success | error
  const [patient, setPatient] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/qr-upload/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPatient(data.patient);
          setStatus('valid');
        } else {
          setStatus(data.error?.includes('expirado') || data.error?.includes('utilizado') ? 
            (data.error.includes('utilizado') ? 'used' : 'expired') : 'error');
          setErrorMsg(data.error);
        }
      })
      .catch(() => { setStatus('error'); setErrorMsg('Error de conexión'); });
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Solo se permiten archivos PDF');
      setSelectedFile(null);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('El archivo no puede superar los 50 MB');
      setSelectedFile(null);
      return;
    }
    setErrorMsg('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStatus('uploading');
    setProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 85));
    }, 400);

    try {
      const res = await fetch(`/api/qr-upload/${token}`, {
        method: 'POST',
        body: formData,
      });
      clearInterval(progressInterval);
      setProgress(100);
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Error al subir el archivo');
      }
    } catch {
      clearInterval(progressInterval);
      setStatus('error');
      setErrorMsg('Error de conexión con el servidor');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Logo / Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0', letterSpacing: '-0.3px' }}>
          SPS Health
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0' }}>
          Subida de documento médico
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>

        {/* LOADING */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#3b82f6', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ color: '#94a3b8', margin: 0 }}>Verificando enlace...</p>
          </div>
        )}

        {/* VALID - Form */}
        {status === 'valid' && (
          <>
            {patient && (
              <div style={{
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: '12px', padding: '14px 16px', marginBottom: '24px',
              }}>
                <p style={{ color: '#93c5fd', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>
                  Expediente
                </p>
                <p style={{ color: 'white', fontSize: '17px', fontWeight: '700', margin: '0 0 2px' }}>
                  {patient.primerNombre} {patient.primerApellido}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Caso #{patient.caso}</p>
              </div>
            )}

            <p style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '20px', lineHeight: '1.5' }}>
              Selecciona el archivo PDF que deseas adjuntar al expediente.
            </p>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${selectedFile ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '16px',
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: selectedFile ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.25s ease',
                marginBottom: '16px',
              }}
            >
              <div style={{
                width: '48px', height: '48px',
                background: selectedFile ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedFile ? '#3b82f6' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              {selectedFile ? (
                <>
                  <p style={{ color: '#3b82f6', fontWeight: '600', fontSize: '15px', margin: '0 0 4px' }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Toca para cambiar
                  </p>
                </>
              ) : (
                <>
                  <p style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '15px', margin: '0 0 4px' }}>
                    Toca para seleccionar PDF
                  </p>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Máximo 50 MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                color: '#fca5a5', fontSize: '14px',
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              style={{
                width: '100%', padding: '15px',
                background: selectedFile
                  ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                  : 'rgba(255,255,255,0.07)',
                color: selectedFile ? 'white' : '#475569',
                border: 'none', borderRadius: '14px',
                fontSize: '16px', fontWeight: '700',
                cursor: selectedFile ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: selectedFile ? '0 4px 20px rgba(59,130,246,0.4)' : 'none',
              }}
            >
              Subir PDF al Expediente
            </button>
          </>
        )}

        {/* UPLOADING */}
        {status === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '64px', height: '64px',
              border: '4px solid rgba(255,255,255,0.1)',
              borderTopColor: '#3b82f6', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
            }} />
            <p style={{ color: 'white', fontWeight: '600', fontSize: '17px', margin: '0 0 16px' }}>
              Subiendo archivo...
            </p>
            {/* Progress bar */}
            <div style={{
              width: '100%', height: '8px',
              background: 'rgba(255,255,255,0.1)', borderRadius: '99px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                borderRadius: '99px',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '10px' }}>{progress}%</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'rgba(34,197,94,0.15)',
              border: '2px solid rgba(34,197,94,0.3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>
              ¡Documento subido!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
              El archivo fue adjuntado al expediente correctamente. Puedes cerrar esta ventana.
            </p>
          </div>
        )}

        {/* EXPIRED */}
        {(status === 'expired' || status === 'used') && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'rgba(234,179,8,0.12)',
              border: '2px solid rgba(234,179,8,0.25)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>
              {status === 'used' ? 'Enlace ya utilizado' : 'Enlace expirado'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
              {status === 'used'
                ? 'Este código QR ya fue usado. Genera uno nuevo desde el sistema.'
                : 'Este código QR expiró (15 min). Genera uno nuevo desde el sistema.'}
            </p>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'rgba(239,68,68,0.12)',
              border: '2px solid rgba(239,68,68,0.25)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>Error</h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>{errorMsg || 'Ocurrió un error inesperado.'}</p>
          </div>
        )}
      </div>

      <p style={{ color: '#334155', fontSize: '12px', marginTop: '24px', textAlign: 'center' }}>
        SPS Health · Sistema de Expedientes Médicos
      </p>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
