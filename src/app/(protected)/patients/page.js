"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FilesIcon, Search, Eye, Download, Loader2 
} from 'lucide-react';
import Papa from 'papaparse';

export default function PatientsListPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patients');
      const data = await res.json();
      if (res.ok && data.success) {
        setPatients(data.data.pacientes);
      }
    } catch {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;
  
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filteredPatients = patients.filter(p => 
    p.caso.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.primerNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.primerApellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dni.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const handleExportCSV = () => {
    try {
      if (patients.length === 0) {
        toast.error('No hay datos para exportar.');
        return;
      }
      
      const dataToExport = filteredPatients.map(p => ({
        "Caso": p.caso,
        "Primer Nombre": p.primerNombre,
        "Primer Apellido": p.primerApellido,
        "DNI": p.dni,
        "Descripción": p.descripcion || '',
        "Cantidad Documentos": p._count.documentos,
        "Creado Por": p.creadoPor?.nombre || 'Desconocido',
        "Fecha Creación": new Date(p.createdAt).toLocaleString('es-ES')
      }));

      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8;" }); // BOM for UTF-8 Excel support
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Pacientes_SPS_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Archivo CSV exportado exitosamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <FilesIcon className="mr-2 text-blue-600 dark:text-blue-400" />
            Casos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Busca e inspecciona historiales médicos y PDFs asociados</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center shadow-md"
        >
          <Download size={20} className="mr-2" />
          Exportar a CSV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por caso, nombre, CI, fecha (ej: 2024)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center h-48 text-slate-400">
              <Loader2 className="animate-spin mr-2" size={24} /> Cargando datos...
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {paginatedPatients.length > 0 ? paginatedPatients.map((p) => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border text-center md:text-left border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 dark:border-slate-800 pb-3">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded">CASO {p.caso}</span>
                      <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{p.primerNombre} {p.primerApellido}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">CI: {p.dni}</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-4">
                      Operación: {p.fechaOperacion ? new Date(p.fechaOperacion).toLocaleDateString('es-ES') : 'No Registrada'}
                    </p>
                    
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg justify-center md:justify-start">
                      <FilesIcon size={16} className="text-blue-500 dark:text-blue-400 mr-2" />
                      {p._count.documentos} Documentos anexados
                    </div>
                  </div>
                  
                  <Link href={`/patients/${encodeURIComponent(p.caso)}`} className="w-full flex justify-center items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-medium rounded-lg group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white transition-colors">
                    <Eye size={18} className="mr-2" /> Ver Detalles e Historial
                  </Link>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                  No se encontraron resultados para la búsqueda.
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-0">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Mostrando {currentPage * itemsPerPage + 1} a {Math.min((currentPage + 1) * itemsPerPage, filteredPatients.length)} de {filteredPatients.length} resultados
                </span>
                <div className="flex space-x-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))} disabled={currentPage === 0} className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))} disabled={currentPage === totalPages - 1} className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
