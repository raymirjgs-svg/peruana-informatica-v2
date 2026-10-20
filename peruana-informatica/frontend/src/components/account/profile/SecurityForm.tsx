import { FormEvent } from 'react';
import { Lock, Shield } from 'lucide-react';
import { PasswordForm } from '@/app/account/profile/types';

interface SecurityFormProps {
  passwords: PasswordForm;
  setPasswords: (passwords: PasswordForm) => void;
  loading: boolean;
  onSubmit: (event: FormEvent) => void;
}

export function SecurityForm({ passwords, setPasswords, loading, onSubmit }: SecurityFormProps) {
  return (
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

                                    <form onSubmit={onSubmit} className="space-y-6">
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
  );
}
