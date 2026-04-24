"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Files,
  Menu,
  LogOut,
  X,
  Sun,
  Moon,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from 'next-themes';

export default function ProtectedLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowSessionModal(true);
    }, 9 * 60 * 1000); // 9 mins
    return () => clearInterval(timer);
  }, []);

  const handleExtendSession = async () => {
    try {
      const res = await fetch('/api/auth/extend', { method: 'POST' });
      if (res.ok) {
        toast.success('Sesión extendida exitosamente');
        setShowSessionModal(false);
      } else {
        toast.error('La sesión expiró o no se pudo extender');
        handleLogout();
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  // En un caso real, obtendríamos el rol del usuario desde el context o cookie
  // Por simplicidad en la UI, leemos la cookie si estamos en el cliente, 
  // o hacemos fetch a una API para /auth/me, o decodificamos el JWT payload en el cliente.
  // Aquí usamos la extracción base64 para mostrar el rol:
  useEffect(() => {
    const getCookieValue = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return match[2];
      return null;
    };

    const roleCookie = getCookieValue('user_role');
    if (roleCookie) {
      setUserRole(roleCookie);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Sesión cerrada');
      router.push('/login');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'digitizer', 'viewer'] },
    { name: 'Gestionar Usuarios', path: '/manage-users', icon: <Users size={20} />, roles: ['admin'] },
    { name: 'Gestionar Pacientes', path: '/manage-patients', icon: <UserPlus size={20} />, roles: ['admin', 'digitizer'] },
    { name: 'Pacientes y PDFs', path: '/patients', icon: <Files size={20} />, roles: ['admin', 'digitizer', 'viewer'] },
  ];

  // Filtrar asegurando que userRole exista (si es nulo, mostrar vacío o solo lo público si lo hubiera)
  const filteredMenu = userRole ? menuItems.filter(item => item.roles.includes(userRole)) : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {/* Modal Extensor Sesión */}
      {showSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 text-center border border-slate-200 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40 mb-4">
              <Clock className="h-7 w-7 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Sesión por caducar</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Por tu seguridad, la sesión expirará pronto. ¿Deseas seguir conectado?
            </p>
            <div className="flex gap-3">
              <button onClick={handleLogout} className="flex-1 py-2 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Salir</button>
              <button onClick={handleExtendSession} className="flex-1 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition">Extender</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Móvil Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white dark:bg-slate-900 w-64 shadow-xl z-50 transform transition-transform duration-300 ease-in-out dark:border-r border-slate-800
        lg:relative lg:translate-x-0 lg:shadow-none border-r border-slate-100
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Image src="/SPS_Logo_2025.svg" alt="SPS Health Logo" width={100} height={32} className="h-8 w-auto" />
            <span className="text-xl font-bold text-blue-800 dark:text-blue-500 hidden sm:block">SPS Health</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 dark:text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredMenu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center px-4 py-3 rounded-xl transition-colors
                ${pathname.startsWith(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
              `}
            >
              <span className={pathname.startsWith(item.path) ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 dark:text-slate-500'}>
                {item.icon}
              </span>
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 lg:px-8 shrink-0 z-30 transition-colors">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mr-4 lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 capitalize lg:hidden">
              {pathname.split('/')[1]?.replace('-', ' ') || 'S Health'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Alternar Tema"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}

            {userRole && (
              <span className="text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full hidden sm:block">
                Rol: {userRole}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
