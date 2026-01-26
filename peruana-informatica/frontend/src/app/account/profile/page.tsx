'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { User, Mail, Phone, Lock, Shield, Calendar, LogOut, ShoppingBag, Heart, Package } from 'lucide-react';
import { signOut } from 'next-auth/react';

type TabType = 'profile' | 'orders' | 'wishlist';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        auth_provider: '',
        createdAt: ''
    });
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [orders, setOrders] = useState<any[]>([]);
    const [wishlist, setWishlist] = useState<any[]>([]);

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') redirect('/account/login');

        if (session?.user) {
            loadProfile();
            if (activeTab === 'orders') loadOrders();
            if (activeTab === 'wishlist') loadWishlist();
        }
    }, [status, session, activeTab]);

    const loadProfile = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/customers/profile`, {
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data.user);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const loadOrders = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/customers/orders`, {
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    };

    const loadWishlist = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/wishlist`, {
                headers: {
                    'Authorization': `Bearer ${(session as any)?.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWishlist(data.items || []);
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/customers/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any)?.accessToken}`
                },
                body: JSON.stringify({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    phone: profile.phone
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('success');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('error');
            }
        } catch (error) {
            setMessage('error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage('password-mismatch');
            setLoading(false);
            return;
        }

        if (passwords.newPassword.length < 6) {
            setMessage('password-short');
            setLoading(false);
            return;
        }

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/customers/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(session as any)?.accessToken}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('password-success');
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('password-error');
            }
        } catch (error) {
            setMessage('password-error');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    const isGoogleUser = profile.auth_provider?.includes('google');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4 shadow-lg">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Mi Cuenta</h1>
                    <p className="text-gray-600">Gestiona tu perfil, pedidos y favoritos</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-2 flex gap-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'profile'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="hidden sm:inline">Mi Perfil</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'orders'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span className="hidden sm:inline">Mis Pedidos</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('wishlist')}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'wishlist'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Heart className="w-5 h-5" />
                            <span className="hidden sm:inline">Favoritos</span>
                        </button>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl shadow-lg ${message.includes('success') || message === 'password-success'
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-red-50 border-2 border-red-200'
                        } transform transition-all duration-300`}>
                        <div className="flex items-center gap-3">
                            {message.includes('success') || message === 'password-success' ? (
                                <>
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-800">
                                            {message === 'password-success' ? '¡Contraseña actualizada!' : '¡Perfil actualizado!'}
                                        </p>
                                        <p className="text-sm text-green-600">Los cambios se han guardado correctamente</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-red-800">
                                            {message === 'password-mismatch' ? 'Las contraseñas no coinciden' :
                                                message === 'password-short' ? 'La contraseña debe tener al menos 6 caracteres' :
                                                    'Hubo un error'}
                                        </p>
                                        <p className="text-sm text-red-600">Por favor, intenta nuevamente</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Profile Tab Content */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-6">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4 shadow-lg">
                                        <span className="text-3xl font-bold text-white">
                                            {profile.first_name?.[0]}{profile.last_name?.[0]}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {profile.first_name} {profile.last_name}
                                    </h2>
                                    <p className="text-gray-500 mt-1">{profile.email}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        {isGoogleUser ? (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Método de acceso</p>
                                                    <p className="font-semibold text-gray-900">Google</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Método de acceso</p>
                                                    <p className="font-semibold text-gray-900">Email/Contraseña</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {profile.createdAt && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Miembro desde</p>
                                                <p className="font-semibold text-gray-900">
                                                    {new Date(profile.createdAt).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Information */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
                                        <p className="text-gray-500">Actualiza tus datos personales</p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <User className="w-4 h-4 inline mr-2" />
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.first_name}
                                                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <User className="w-4 h-4 inline mr-2" />
                                                Apellido
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.last_name}
                                                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-500"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">El email no puede ser modificado</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={profile.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="+51 999 999 999"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition-all transform hover:scale-[1.02] shadow-lg"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Guardando...
                                            </span>
                                        ) : (
                                            'Guardar Cambios'
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Change Password */}
                            {!isGoogleUser && (
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <Lock className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Seguridad</h2>
                                            <p className="text-gray-500">Cambia tu contraseña</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Shield className="w-4 h-4 inline mr-2" />
                                                Contraseña Actual
                                            </label>
                                            <input
                                                type="password"
                                                value={passwords.currentPassword}
                                                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Lock className="w-4 h-4 inline mr-2" />
                                                Nueva Contraseña
                                            </label>
                                            <input
                                                type="password"
                                                value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Lock className="w-4 h-4 inline mr-2" />
                                                Confirmar Nueva Contraseña
                                            </label>
                                            <input
                                                type="password"
                                                value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 transition-all transform hover:scale-[1.02] shadow-lg"
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Actualizando...
                                                </span>
                                            ) : (
                                                'Cambiar Contraseña'
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {isGoogleUser && (
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-2">Cuenta vinculada con Google</h3>
                                            <p className="text-gray-600">
                                                Iniciaste sesión con Google. La gestión de contraseña se realiza a través de tu cuenta de Google.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Orders Tab Content */}
                {activeTab === 'orders' && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
                                <p className="text-gray-500">Historial de compras y pedidos realizados</p>
                            </div>
                        </div>

                        {orders.length === 0 ? (
                            <div className="text-center py-16">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin pedidos aún</h3>
                                <p className="text-gray-500 mb-6">Tus pedidos aparecerán aquí una vez que realices tu primera compra</p>
                                <a
                                    href="/products"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Explorar Productos
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order: any) => (
                                    <div key={order.id} className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">Pedido #{order.id}</p>
                                                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-ES')}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <p><span className="font-semibold">Total:</span> S/ {order.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Wishlist Tab Content */}
                {activeTab === 'wishlist' && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                                <Heart className="w-6 h-6 text-pink-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Mis Favoritos</h2>
                                <p className="text-gray-500">Productos que te gustan</p>
                            </div>
                        </div>

                        {wishlist.length === 0 ? (
                            <div className="text-center py-16">
                                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin favoritos aún</h3>
                                <p className="text-gray-500 mb-6">Guarda tus productos favoritos aquí para encontrarlos fácilmente más tarde</p>
                                <a
                                    href="/products"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-red-700 transition-all shadow-lg"
                                >
                                    <Heart className="w-5 h-5" />
                                    Explorar Productos
                                </a>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {wishlist.map((item: any) => (
                                    <div key={item.id} className="border-2 border-gray-100 rounded-xl p-4 hover:border-pink-200 transition-all">
                                        {item.product?.images?.[0] && (
                                            <img
                                                src={item.product.images[0].imagen}
                                                alt={item.product.name}
                                                className="w-full h-48 object-cover rounded-lg mb-3"
                                            />
                                        )}
                                        <h3 className="font-semibold text-gray-900 mb-2">{item.product?.name}</h3>
                                        <p className="text-lg font-bold text-blue-600">S/ {item.product?.price}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
