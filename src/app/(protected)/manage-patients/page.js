"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    UserPlus, Search,
    FileUp, X, Loader2, Trash2, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ManagePatientsPage() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [userId, setUserId] = useState('');
    const [userRole, setUserRole] = useState('');
    const [saving, setSaving] = useState(false);

    // Edit/Delete Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentPatient, setCurrentPatient] = useState(null);
    const [formData, setFormData] = useState({
        caso: '', primerNombre: '', primerApellido: '', segundoNombre: '', segundoApellido: '', dni: '', sexo: '', edad: '', fechaNacimiento: '', telefono1: '', telefonoAlternativo: '', direccion: '', fechaOperacion: '', descripcion: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        const getCookieValue = (name) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            if (match) return match[2];
            return null;
        };
        const roleCookie = getCookieValue('user_role');
        const idCookie = getCookieValue('user_id');
        if (roleCookie) setUserRole(roleCookie);
        if (idCookie) setUserId(idCookie);
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
    const itemsPerPage = 10;

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

    const handleEditConfirm = async () => {
        setSaving(true);
        try {
            const data = new FormData();
            data.append('primerNombre', formData.primerNombre);
            data.append('primerApellido', formData.primerApellido);
            data.append('segundoNombre', formData.segundoNombre || '');
            data.append('segundoApellido', formData.segundoApellido || '');
            data.append('dni', formData.dni);
            data.append('sexo', formData.sexo || '');
            data.append('edad', formData.edad || '');
            data.append('fechaNacimiento', formData.fechaNacimiento || '');
            data.append('telefono1', formData.telefono1 || '');
            data.append('telefonoAlternativo', formData.telefonoAlternativo || '');
            data.append('direccion', formData.direccion || '');
            data.append('fechaOperacion', formData.fechaOperacion || '');
            data.append('descripcion', formData.descripcion || '');
            
            selectedFiles.forEach(file => {
                data.append('files', file);
            });

            const res = await fetch(`/api/patients/${currentPatient.caso}`, {
                method: 'PUT',
                body: data
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success(result.message || 'Paciente actualizado');
                setIsEditModalOpen(false);
                fetchPatients();
            } else {
                toast.error(result.error || 'Error al actualizar');
            }
        } catch {
            toast.error('Error de red');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/patients/${currentPatient.caso}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success(result.message || 'Paciente eliminado');
                setIsDeleteModalOpen(false);
                fetchPatients();
            } else {
                toast.error(result.error || 'Error al eliminar');
            }
        } catch {
            toast.error('Error de red');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col items-center flex-1">
            <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <UserPlus className="mr-2 text-blue-600" />
                        Gestión de Pacientes
                    </h2>
                    <p className="text-slate-500 mt-1">Sube nuevos historiales usando PDF</p>
                </div>

                <Link
                    href="/manage-patients/new"
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center shadow-md bg-gradient-to-r from-blue-600 to-blue-500"
                >
                    <FileUp size={20} className="mr-2" />
                    Nuevo Paciente
                </Link>
            </div>

            <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 relative flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar paciente por caso, nombre, CI, año..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="flex justify-center items-center h-48 text-slate-400">
                            <Loader2 className="animate-spin mr-2" size={24} /> Cargando datos...
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 text-slate-500 text-sm font-semibold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Caso #</th>
                                        <th className="px-6 py-4">Paciente</th>
                                        <th className="px-6 py-4">CI</th>
                                        <th className="px-6 py-4">Fecha Op.</th>
                                        <th className="px-6 py-4">Documentos</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedPatients.length > 0 ? paginatedPatients.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-700">{p.caso}</td>
                                            <td className="px-6 py-4 text-slate-900 font-medium">{p.primerNombre} {p.primerApellido}</td>
                                            <td className="px-6 py-4 text-slate-600">{p.dni}</td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">{p.fechaOperacion ? new Date(p.fechaOperacion).toLocaleDateString('es-ES') : 'N/A'}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold">{p._count.documentos} archivos</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {userRole === 'admin' && (
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setCurrentPatient(p);
                                                                setFormData({
                                                                    caso: p.caso, primerNombre: p.primerNombre,
                                                                    primerApellido: p.primerApellido, segundoNombre: p.segundoNombre || '', segundoApellido: p.segundoApellido || '',
                                                                    dni: p.dni, sexo: p.sexo || '', edad: p.edad || '', 
                                                                    fechaNacimiento: p.fechaNacimiento ? new Date(p.fechaNacimiento).toISOString().split('T')[0] : '', 
                                                                    telefono1: p.telefono1 || '', telefonoAlternativo: p.telefonoAlternativo || '', 
                                                                    direccion: p.direccion || '', 
                                                                    fechaOperacion: p.fechaOperacion ? new Date(p.fechaOperacion).toISOString().split('T')[0] : '', 
                                                                    descripcion: p.descripcion || ''
                                                                });
                                                                setSelectedFiles([]);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-blue-600 transition"
                                                            title="Editar Datos"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setCurrentPatient(p); setIsDeleteModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-red-600 transition"
                                                            title="Eliminar Todo"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No se encontraron pacientes</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-white">
                                    <span className="text-sm text-slate-500">
                                        Mostrando {currentPage * itemsPerPage + 1} a {Math.min((currentPage + 1) * itemsPerPage, filteredPatients.length)} de {filteredPatients.length} pacientes
                                    </span>
                                    <div className="flex space-x-2">
                                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))} disabled={currentPage === 0} className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))} disabled={currentPage === totalPages - 1} className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-slate-900/60 backdrop-blur-sm shadow-xl overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden self-center">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Datos del Paciente</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20} /></button>
                            </div>
                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CI</span>
                                    <input type="text" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Primer Nombre</span>
                                    <input type="text" value={formData.primerNombre} onChange={e => setFormData({ ...formData, primerNombre: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Primer Apellido</span>
                                    <input type="text" value={formData.primerApellido} onChange={e => setFormData({ ...formData, primerApellido: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Segundo Nombre</span>
                                    <input type="text" value={formData.segundoNombre} onChange={e => setFormData({ ...formData, segundoNombre: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Opcional" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Segundo Apellido</span>
                                    <input type="text" value={formData.segundoApellido} onChange={e => setFormData({ ...formData, segundoApellido: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Opcional" />
                                </label>
                                <label className="block">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sexo</span>
                                  <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">Seleccione...</option><option value="M">Masculino</option><option value="F">Femenino</option><option value="O">Otro</option>
                                  </select>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha Nacimiento</span>
                                    <input type="date" value={formData.fechaNacimiento} onChange={e => setFormData({ ...formData, fechaNacimiento: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edad</span>
                                    <input type="number" min="0" max="150" value={formData.edad} onChange={e => setFormData({ ...formData, edad: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono 1</span>
                                    <input type="tel" value={formData.telefono1} onChange={e => setFormData({ ...formData, telefono1: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono Auxiliar</span>
                                    <input type="tel" value={formData.telefonoAlternativo} onChange={e => setFormData({ ...formData, telefonoAlternativo: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block md:col-span-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</span>
                                    <input type="text" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block md:col-span-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha Operación *</span>
                                    <input required type="date" value={formData.fechaOperacion} onChange={e => setFormData({ ...formData, fechaOperacion: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                <label className="block md:col-span-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción Médica</span>
                                    <textarea rows={2} value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} className="mt-1 w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </label>
                                
                                <div className="block md:col-span-2 mt-4 p-4 border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Anexar nuevos PDFs (Opcional)</label>
                                  <input type="file" multiple accept=".pdf" onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-200 dark:hover:file:bg-blue-800" />
                                  {selectedFiles.length > 0 && (
                                      <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                      {selectedFiles.length} archivo(s) listo(s) para añadir.
                                      </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition font-medium">Cancelar</button>
                                <button onClick={handleEditConfirm} disabled={saving} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center font-medium transition">
                                    {saving && <Loader2 size={16} className="animate-spin mr-2" />} Guardar Cambios
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-slate-900/60 backdrop-blur-sm shadow-xl overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center self-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-7 w-7 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Paciente y PDFs?</h3>
                            <p className="text-slate-500 mb-6 text-sm">
                                Se borrarán los datos y los archivos físicos asociados al caso <span className="font-semibold text-slate-700">{currentPatient?.caso}</span> permanentemente.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition">Cancelar</button>
                                <button onClick={handleDeleteConfirm} disabled={saving} className="flex-1 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition flex items-center justify-center">
                                    {saving && <Loader2 size={16} className="animate-spin mr-2" />}
                                    Eliminar Todo
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
