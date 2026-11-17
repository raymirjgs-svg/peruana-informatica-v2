import { FormEvent } from 'react';
import { Mail, Phone, User } from 'lucide-react';
import { ProfileData } from '@/app/account/profile/types';

interface PersonalInfoFormProps {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  loading: boolean;
  onSubmit: (event: FormEvent) => void;
}

export function PersonalInfoForm({ profile, setProfile, loading, onSubmit }: PersonalInfoFormProps) {
  return (
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

                                <form onSubmit={onSubmit} className="space-y-6">
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
  );
}
