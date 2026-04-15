"use client";

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Users, Activity, FileText, BarChart3, TrendingUp, History, Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const getCookieValue = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return match[2];
      return null;
    };
    
    const roleCookie = getCookieValue('user_role');
    let role = null;
    if (roleCookie) {
      role = roleCookie;
      setUserRole(role);
    }

    if (role) {
      fetchDashboardData(role);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async (role) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard?rol=${role}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        toast.error('No se pudo cargar la información del dashboard');
      }
    } catch {
      toast.error('Error de red cargando el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] justify-center items-center">
         <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mr-3" size={32} />
         <span className="text-xl text-slate-600 dark:text-slate-400 font-medium">Cargando métricas...</span>
      </div>
    );
  }

  if (!userRole || !data) return null;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Activity className="mr-2 text-blue-600 dark:text-blue-400" />
          Resumen General
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Métricas y actividad reciente en la plataforma</p>
      </div>

      {userRole === 'admin' ? (
        <>
          {/* Admin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center transition-colors">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mr-6">
                <Users size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Usuarios</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{data.stats?.totalUsers || 0}</h3>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center transition-colors">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mr-6">
                <FileText size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pacientes</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{data.stats?.totalPatients || 0}</h3>
              </div>
            </motion.div>
          </div>

          {/* Log de Auditoría */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center">
              <History className="text-blue-600 dark:text-blue-400 mr-2" size={20}/>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Registro de Auditoría (Logs)</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left">
                <thead className="bg-white dark:bg-slate-900 sticky top-0 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Fecha/Hora</th>
                    <th className="px-6 py-4 font-semibold">Usuario</th>
                    <th className="px-6 py-4 font-semibold">Acción</th>
                    <th className="px-6 py-4 font-semibold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {data.auditLogs?.length > 0 ? data.auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.fecha).toLocaleString('es-ES')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {log.user?.nombre || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                          {log.accion.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {log.detalles}
                      </td>
                    </tr>
                  )) : (
                     <tr><td colSpan="4" className="p-6 text-center text-slate-500 dark:text-slate-400">No hay registros recientes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Digitizer / Viewer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg text-white flex items-center relative overflow-hidden">
               <div className="absolute right-0 top-0 opacity-10 scale-150 transform translate-x-4 -translate-y-4">
                  <FileText size={120} />
               </div>
               <div className="relative z-10">
                 <p className="text-blue-100 font-medium mb-1">Total de Pacientes</p>
                 <h3 className="text-4xl font-bold">{data.totalPatients || 0}</h3>
               </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 mb-2">
                 <TrendingUp size={24} className="mr-2" />
                 <span className="font-bold text-lg">+{data.pacientesUltimos7Dias || 0}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Nuevos pacientes en los últimos 7 días</p>
            </motion.div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center">
                <BarChart3 className="text-blue-600 dark:text-blue-400 mr-2" size={20}/>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Últimos Pacientes Registrados</h3>
             </div>
             <div className="p-0">
               {data.ultimos5Pacientes?.length > 0 ? (
                 <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {data.ultimos5Pacientes.map((p, idx) => (
                      <motion.li 
                         key={p.id} 
                         initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                         className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between"
                      >
                         <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center mr-4">
                              {p.primerNombre.charAt(0)}{p.primerApellido.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{p.primerNombre} {p.primerApellido}</p>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono mt-0.5">CASO: {p.caso}</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-slate-400 dark:text-slate-500">Creado por</p>
                           <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{p.creadoPor?.nombre || 'Desconocido'}</p>
                         </div>
                      </motion.li>
                    ))}
                 </ul>
               ) : (
                 <div className="p-8 text-center text-slate-500 dark:text-slate-400">Aún no hay pacientes registrados.</div>
               )}
             </div>
          </div>
        </>
      )}
    </div>
  );
}
