export function ProfileMessage({ message }: { message: string }) {
  return (
    <>
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
    </>
  );
}
