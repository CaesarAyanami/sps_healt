"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Upload, FileUp, Loader2, Trash2, FileText, ChevronDown, ChevronUp 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NewPatientPage() {
  const router = useRouter();
  
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
    caso: '',
    primerNombre: '',
    primerApellido: '',
    segundoNombre: '',
    segundoApellido: '',
    dni: '',
    sexo: '',
    edad: '',
    fechaNacimiento: '',
    telefono1: '',
    telefonoAlternativo: '',
    direccion: '',
    fechaOperacion: '',
    descripcion: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const getCookieValue = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return match[2];
      return null;
    };
    const idCookie = getCookieValue('user_id');
    if (idCookie) {
      setUserId(idCookie);
    }
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar PDF y tamaño
    const validFiles = files.filter(f => {
      if (f.type !== 'application/pdf') {
        toast.error(`El archivo ${f.name} no es un PDF válido.`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) { // 10MB
        toast.error(`El archivo ${f.name} supera los 10MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    // Limpiar input file para permitir subir el mismo archivo después si es borrado
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error('Debes anexar al menos un archivo PDF.');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      // Ya no necesitamos 'uploadType', el API asume todos individuales/enumerados
      data.append('caso', formData.caso);
      data.append('primerNombre', formData.primerNombre);
      data.append('primerApellido', formData.primerApellido);
      data.append('segundoNombre', formData.segundoNombre);
      data.append('segundoApellido', formData.segundoApellido);
      data.append('dni', formData.dni);
      data.append('sexo', formData.sexo);
      data.append('edad', formData.edad);
      data.append('fechaNacimiento', formData.fechaNacimiento);
      data.append('telefono1', formData.telefono1);
      data.append('telefonoAlternativo', formData.telefonoAlternativo);
      data.append('direccion', formData.direccion);
      data.append('fechaOperacion', formData.fechaOperacion);
      data.append('descripcion', formData.descripcion);
      data.append('creadoPorId', userId);

      selectedFiles.forEach(file => {
        data.append('files', file);
      });

      const res = await fetch('/api/patients', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(result.message || 'Paciente creado con éxito');
        // Resetear form en vez de sacar al usuario
        setFormData({ 
           caso: '', primerNombre: '', primerApellido: '', segundoNombre: '', segundoApellido: '',
           dni: '', sexo: '', edad: '', fechaNacimiento: '', telefono1: '', telefonoAlternativo: '',
           direccion: '', fechaOperacion: '', descripcion: '' 
        });
        setSelectedFiles([]);
        // El file input visualmente se limpia al cambiar el FileList, pero para forzar limpieza del native
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(result.error || 'Error al guardar paciente');
      }
    } catch {
      toast.error('Error de conexión con el servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/manage-patients" className="p-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition border border-slate-200 dark:border-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <FileUp className="mr-2 text-blue-600 dark:text-blue-400" />
            Registro de Nuevo Paciente
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Completa los datos básicos y sube los expedientes PDF correspondientes.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
      >
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100 dark:divide-slate-800/50">
          
          <div className="p-6 md:p-8 space-y-6">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Datos Personales e Identificación</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ID o Número de Caso <span className="text-red-500 dark:text-red-400">*</span></label>
                 <input 
                   required autoFocus type="text" 
                   value={formData.caso} onChange={e => setFormData({...formData, caso: e.target.value})} 
                   className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                   placeholder="Ej: CASO-001" 
                 />
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Debe ser único en el sistema.</p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cédula de Identidad (CI) <span className="text-red-500 dark:text-red-400">*</span></label>
                 <input 
                   required type="text" 
                   value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} 
                   className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                   placeholder="Ej: 12345678" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primer Nombre <span className="text-red-500 dark:text-red-400">*</span></label>
                 <input 
                   required type="text" 
                   value={formData.primerNombre} onChange={e => setFormData({...formData, primerNombre: e.target.value})} 
                   className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                   placeholder="Juan" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primer Apellido <span className="text-red-500 dark:text-red-400">*</span></label>
                 <input 
                   required type="text" 
                   value={formData.primerApellido} onChange={e => setFormData({...formData, primerApellido: e.target.value})} 
                   className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                   placeholder="Pérez" 
                 />
               </div>
               {showAdvanced && (
                 <>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Segundo Nombre</label>
                     <input 
                       type="text" 
                       value={formData.segundoNombre} onChange={e => setFormData({...formData, segundoNombre: e.target.value})} 
                       className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                       placeholder="Carlos (Opcional)" 
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Segundo Apellido</label>
                     <input 
                       type="text" 
                       value={formData.segundoApellido} onChange={e => setFormData({...formData, segundoApellido: e.target.value})} 
                       className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                       placeholder="Méndez (Opcional)" 
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sexo</label>
                     <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                       <option value="">Seleccione...</option>
                       <option value="M">Masculino</option>
                       <option value="F">Femenino</option>
                       <option value="O">Otro</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha de Nacimiento</label>
                     <input 
                       type="date" 
                       value={formData.fechaNacimiento} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} 
                       className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Edad</label>
                     <input 
                       type="number" 
                       value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} 
                       className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                       placeholder="Años" min="0" max="150"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono 1</label>
                     <input 
                       type="tel" 
                       value={formData.telefono1} onChange={e => setFormData({...formData, telefono1: e.target.value})} 
                       className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                       placeholder="Ej: +58 414 1234567" 
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono Alternativo</label>
                     <input 
                       type="tel" 
                       value={formData.telefonoAlternativo} onChange={e => setFormData({...formData, telefonoAlternativo: e.target.value})} 
                       className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                       placeholder="Opcional" 
                     />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dirección de Habitación</label>
                     <input 
                       type="text" 
                       value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} 
                       className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                       placeholder="Ej: Av. Principal, Edificio X, Apto Y" 
                     />
                   </div>
                 </>
               )}

               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha de Operación <span className="text-red-500 dark:text-red-400">*</span></label>
                 <input 
                   required type="date" 
                   value={formData.fechaOperacion} onChange={e => setFormData({...formData, fechaOperacion: e.target.value})} 
                   className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                 />
               </div>
             </div>

             <div className="flex justify-start mb-6">
               <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 px-4 py-2 rounded-full transition relative top-[-1rem]">
                 {showAdvanced ? (
                   <><ChevronUp size={16} className="mr-2" /> Ocultar Campos Adicionales</>
                 ) : (
                   <><ChevronDown size={16} className="mr-2" /> Mostrar Más Campos Opcionales</>
                 )}
               </button>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descripción breve o Notas (Opcional)</label>
               <textarea 
                 value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                 rows={3} maxLength={200} 
                 className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none" 
                 placeholder="Paciente hipertenso, 3 cirugías previas..." 
               />
               <div className="text-xs text-right text-slate-400 mt-1 font-mono">{formData.descripcion.length}/200 caracteres</div>
             </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900/50">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Anexar Expedientes PDF <span className="text-red-500 dark:text-red-400">*</span></h3>
             
             <label className="w-full flex-col flex items-center justify-center p-8 border-2 border-dashed border-blue-300 dark:border-blue-900/50 rounded-2xl bg-blue-50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition relative">
               <input 
                 type="file" 
                 multiple 
                 accept="application/pdf" 
                 onChange={handleFileChange}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
               <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4 text-blue-500 dark:text-blue-400">
                  <Upload size={28} />
               </div>
               <span className="text-slate-700 dark:text-slate-300 font-semibold text-lg">Click o Arrastra los PDFs aquí</span>
               <span className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center max-w-sm">Puedes seleccionar varios archivos a la vez. Máximo 10MB por archivo. Solo formato PDF.</span>
             </label>
             
             {selectedFiles.length > 0 && (
               <div className="mt-6">
                 <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Archivos Seleccionados ({selectedFiles.length})</h4>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {selectedFiles.map((file, i) => (
                     <motion.li initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                       <div className="flex items-center flex-1 min-w-0 mr-4">
                         <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-2 rounded-lg shrink-0 mr-3">
                           <FileText size={20} />
                         </div>
                         <div className="truncate">
                           <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{file.name}</span>
                           <span className="block text-xs text-slate-400 dark:text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                         </div>
                       </div>
                       <button type="button" onClick={() => removeFile(i)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Quitar archivo">
                         <Trash2 size={18} />
                       </button>
                     </motion.li>
                   ))}
                 </ul>
               </div>
             )}
          </div>

          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
             <Link href="/manage-patients" className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
               Finalizar / Volver
             </Link>
             <button 
               type="submit" 
               disabled={saving}
               className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition flex items-center"
             >
               {saving ? <><Loader2 size={20} className="animate-spin mr-2" /> Guardando...</> : 'Guardar y Continuar Creando'}
             </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
