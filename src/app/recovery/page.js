"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSolicitar = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/recovery/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Código enviado');
        setStep(2);
      } else {
        toast.error(data.error || 'Error al solicitar recuperación');
      }
    } catch (err) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/recovery/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, nuevaPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Contraseña actualizada correctamente');
        router.push('/login');
      } else {
        toast.error(data.error || 'Error al verificar el código');
      }
    } catch (err) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900 p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-transparent dark:border-slate-800 relative"
      >
        <Link href="/login" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        
        <div className="mb-8 flex flex-col items-center mt-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 mb-4">
            <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Recuperación</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 text-center">
            {step === 1 ? 'Ingresa tu correo para recibir un código de recuperación' : 'Ingresa el código que recibiste en tu correo'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSolicitar} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full outline-none focus:ring-2 focus:ring-blue-500 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white px-4 py-2"
                placeholder="usuario@spshealth.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 transition-colors"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerificar} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300" htmlFor="codigo">
                Código de 6 dígitos
              </label>
              <input
                id="codigo"
                type="text"
                required
                maxLength={6}
                className="mt-1 block text-center text-xl tracking-widest w-full outline-none focus:ring-2 focus:ring-blue-500 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white px-4 py-2"
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300" htmlFor="nuevaPassword">
                Nueva Contraseña
              </label>
              <input
                id="nuevaPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full outline-none focus:ring-2 focus:ring-blue-500 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white px-4 py-2"
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? 'Verificando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
