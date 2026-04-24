"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, FileText, Printer, User, FileBarChart, Loader2, X, Edit2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientDetailPage() {
  const { caso } = useParams();
  const router = useRouter();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  
  // Renombre state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${encodeURIComponent(caso)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPatient(data.data);
      } else {
        toast.error('Paciente no encontrado');
        router.push('/patients');
      }
    } catch {
      toast.error('Error al cargar paciente');
      router.push('/patients');
    } finally {
      setLoading(false);
    }
  }, [caso, router]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if(!newName.trim()) return;
    setSavingName(true);
    try {
      const docId = patient.documentos[currentDocIndex].id;
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreSistema: newName })
      });
      const data = await res.json();
      if(res.ok && data.success) {
        toast.success('Documento renombrado');
        setIsRenameModalOpen(false);
        fetchPatientData();
      } else {
        toast.error(data.error || 'Error al renombrar');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setSavingName(false);
    }
  };

  const handlePrintData = () => {
     window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
        <Loader2 className="animate-spin text-blue-600 mr-3" size={32} />
        <span className="text-xl text-slate-600 font-medium">Cargando expediente...</span>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Cabecera */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/patients" className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-medium">
          <ArrowLeft size={20} className="mr-2" />
          Volver a pacientes
        </Link>
        <button onClick={handlePrintData} className="flex items-center text-blue-600 bg-blue-50 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition">
          <Printer size={18} className="mr-2" /> Imprimir Ficha
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="h-4 bg-blue-600" />
        
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Info Básica */}
            <div className="flex-1 space-y-6">
              <div>
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs tracking-wider mb-3">
                  CASO #{patient.caso}
                </span>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                  {patient.primerNombre} {patient.primerApellido}
                </h2>
                <div className="flex items-center text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  <User size={16} className="mr-2" />
                  CI: <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1 mr-4">{patient.dni}</span>
                  {patient.fechaOperacion && (
                    <>
                      <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-blue-600 dark:text-blue-400 ml-2">Operación: {new Date(patient.fechaOperacion).toLocaleDateString('es-ES')}</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción del Historial</h4>
                 <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 min-h-[100px] text-slate-700 dark:text-slate-300">
                   {patient.descripcion || <span className="italic text-slate-400 dark:text-slate-500">Sin descripción registrada.</span>}
                 </div>
              </div>
              
              <div className="flex flex-wrap gap-x-12 gap-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
                 <div>
                   <div className="text-slate-400 font-medium mb-1 flex items-center">Fecha de Creación</div>
                   <div className="text-slate-800 dark:text-slate-200 font-semibold">{new Date(patient.createdAt).toLocaleDateString('es-ES', { year:'numeric', month:'long', day:'numeric' })}</div>
                 </div>
                 <div>
                   <div className="text-slate-400 font-medium mb-1">Registrado por</div>
                   <div className="text-slate-800 dark:text-slate-200 font-semibold">{patient.creadoPor?.nombre || 'Desconocido'}</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {patient.documentos.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col mt-6 print:hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950">
             <div className="flex items-center overflow-hidden max-w-full">
               <FileText className="text-red-500 shrink-0 mr-3" size={24} />
               <span className="font-bold text-slate-800 dark:text-slate-100 truncate" title={patient.documentos[currentDocIndex].nombreSistema}>
                 {patient.documentos[currentDocIndex].nombreSistema}
               </span>
               <button 
                 onClick={() => {
                   setNewName(patient.documentos[currentDocIndex].nombreSistema);
                   setIsRenameModalOpen(true);
                 }}
                 className="ml-3 shrink-0 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 transition"
                 title="Renombrar Documento"
               >
                 <Edit2 size={16} />
               </button>
             </div>
             
             <div className="flex items-center space-x-4 shrink-0">
               <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                 <button 
                   disabled={currentDocIndex === 0}
                   onClick={() => setCurrentDocIndex(prev => prev - 1)}
                   className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 transition-colors"
                 >
                   <ChevronLeft size={18} />
                 </button>
                 <span className="px-3 text-sm font-semibold text-slate-600 dark:text-slate-300 select-none">
                   Documento {currentDocIndex + 1} de {patient.documentos.length}
                 </span>
                 <button 
                   disabled={currentDocIndex === patient.documentos.length - 1}
                   onClick={() => setCurrentDocIndex(prev => prev + 1)}
                   className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-50 transition-colors"
                 >
                   <ChevronRight size={18} />
                 </button>
               </div>
               
               <button onClick={() => window.open(`/${patient.documentos[currentDocIndex].ruta}`, '_blank')} className="flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-4 py-2 rounded-xl transition-colors">
                 <Printer size={18} className="mr-2" /> Ampliar
               </button>
             </div>
          </div>
          
          <div className="w-full h-[70vh] bg-slate-900">
             <iframe 
               src={`/${patient.documentos[currentDocIndex].ruta}#view=FitH&toolbar=0`} 
               className="w-full h-full border-none"
             />
          </div>
        </div>
      )}
      
      {patient.documentos.length === 0 && (
         <div className="py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mt-6 text-slate-500 dark:text-slate-400 print:hidden transition-colors">
            <FileBarChart size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
            <p className="font-medium text-lg">No hay documentos asociados a este caso.</p>
         </div>
      )}

      {/* Rename Modal */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRenameModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-10 overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Renombrar Documento</h3>
                <button onClick={() => setIsRenameModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
              </div>
              <form onSubmit={handleRenameSubmit} className="p-6">
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 mb-6" 
                  placeholder="Nuevo nombre. Ej. examen_sangre.pdf" 
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsRenameModalOpen(false)} className="flex-1 py-2 rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Cancelar</button>
                  <button type="submit" disabled={savingName} className="flex-1 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition">
                    {savingName && <Loader2 size={16} className="animate-spin mr-2" />} Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
