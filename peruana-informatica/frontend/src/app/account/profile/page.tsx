'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { User, ShoppingBag, Heart } from 'lucide-react';
import { ProfileData, PasswordForm, CustomerOrder, WishlistItem } from './types';
import { ProfileMessage } from '@/components/account/profile/ProfileMessage';
import { ProfileSidebar } from '@/components/account/profile/ProfileSidebar';
import { PersonalInfoForm } from '@/components/account/profile/PersonalInfoForm';
import { SecurityForm } from '@/components/account/profile/SecurityForm';
import { GoogleAccountNotice } from '@/components/account/profile/GoogleAccountNotice';
import { OrdersTab } from '@/components/account/profile/OrdersTab';
import { WishlistTab } from '@/components/account/profile/WishlistTab';

type TabType = 'profile' | 'orders' | 'wishlist';

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [profile, setProfile] = useState<ProfileData>({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        auth_provider: '',
        createdAt: ''
    });
    const [passwords, setPasswords] = useState<PasswordForm>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

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

                <ProfileMessage message={message} />

                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <ProfileSidebar profile={profile} isGoogleUser={isGoogleUser} />

                        <div className="lg:col-span-2 space-y-6">
                            <PersonalInfoForm
                                profile={profile}
                                setProfile={setProfile}
                                loading={loading}
                                onSubmit={handleUpdateProfile}
                            />

                            {!isGoogleUser && (
                                <SecurityForm
                                    passwords={passwords}
                                    setPasswords={setPasswords}
                                    loading={loading}
                                    onSubmit={handleChangePassword}
                                />
                            )}

                            {isGoogleUser && <GoogleAccountNotice />}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && <OrdersTab orders={orders} />}

                {activeTab === 'wishlist' && <WishlistTab wishlist={wishlist} />}
            </div>
        </div>
    );
}
