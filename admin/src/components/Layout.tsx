import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface LayoutProps {
    children: React.ReactNode;
}

interface MenuStats {
    pendingVehicles: number;
    pendingUsers: number;
    pendingVehicleChanges: number;
}

const menuItems = [
    {
        path: '/',
        label: 'Dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        statsKey: null,
    },
    {
        path: '/users',
        label: 'Usuários',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        statsKey: 'pendingUsers' as const,
    },
    {
        path: '/vehicle-change-requests',
        label: 'Alterações de Veículo',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
        statsKey: 'pendingVehicleChanges' as const,
    },
];

export default function Layout({ children }: LayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [stats, setStats] = useState<MenuStats>({
        pendingVehicles: 0,
        pendingUsers: 0,
        pendingVehicleChanges: 0,
    });

    useEffect(() => {
        loadStats();
        // Atualizar stats a cada 30 segundos
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    async function loadStats() {
        try {
            const [vehiclesRes, usersRes, changeRequestsRes] = await Promise.all([
                api.get('/vehicles').catch(() => ({ data: [] })),
                api.get('/users', { params: { status: 'PENDING' } }).catch(() => ({ data: [] })),
                api.get('/vehicle-change-requests/pending').catch(() => ({ data: [] })),
            ]);

            setStats({
                pendingVehicles: vehiclesRes.data.filter((v: any) => v.status === 'PENDING').length,
                pendingUsers: usersRes.data.length,
                pendingVehicleChanges: changeRequestsRes.data.length,
            });
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`${
                    sidebarOpen ? 'w-64' : 'w-20'
                } bg-gradient-to-b from-indigo-700 to-purple-800 text-white transition-all duration-300 flex flex-col`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🚀</span>
                        </div>
                        {sidebarOpen && (
                            <div>
                                <h1 className="font-bold text-lg">Vai no Pulo</h1>
                                <p className="text-xs text-white/60">Painel Admin</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-20 -right-3 bg-white shadow-lg rounded-full p-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
                    style={{ left: sidebarOpen ? '248px' : '68px' }}
                >
                    <svg
                        className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Menu Items */}
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const badgeCount = item.statsKey ? stats[item.statsKey] : 0;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive(item.path)
                                        ? 'bg-white/20 text-white shadow-lg'
                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                {sidebarOpen && (
                                    <>
                                        <span className="flex-1 text-left font-medium">{item.label}</span>
                                        {badgeCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {badgeCount}
                                            </span>
                                        )}
                                    </>
                                )}
                                {!sidebarOpen && badgeCount > 0 && (
                                    <span className="absolute left-14 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                        {badgeCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-white/10">
                    <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-white/60 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={signOut}
                        className={`mt-4 w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${
                            sidebarOpen ? '' : 'justify-center'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {sidebarOpen && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
