import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FUTURISTIC_GLASS_STYLE } from '../constants';

const AuthPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { login, loginAsGuest, loginWithGoogle } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsFormLoading(true);
        setEmailSent(false);
        try {
            await login(email);
            setEmailSent(true);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsFormLoading(false);
        }
    };

    const handleGuestLogin = () => {
        setError(null);
        setIsGuestLoading(true);
        try {
            loginAsGuest();
            // The component will unmount as the AuthProvider state changes,
            // so no need to set isGuestLoading back to false.
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setIsGuestLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsGoogleLoading(true);
        try {
            await loginWithGoogle();
            // User will be redirected to Google, so no need to set loading back to false
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-gray-200 font-sans">
            <div className="futuristic-bg"></div>
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wider uppercase font-display" style={{textShadow: '0 0 8px rgba(34, 211, 238, 0.7)'}}>Zenith Budget</h1>
                    <p className="text-cyan-400 mt-2 text-sm tracking-widest uppercase">Manage Your Assets</p>
                </header>
                <div className={`${FUTURISTIC_GLASS_STYLE} w-full max-w-sm p-8`}>
                    <h2 className="text-2xl font-bold text-center text-white mb-6">Welcome</h2>
                    {emailSent ? (
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-cyan-400">Check your inbox!</h3>
                            <p className="text-gray-300 mt-2">A magic link has been sent to <strong className="text-white">{email}</strong> to sign you in.</p>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        placeholder="your@email.com"
                                        className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={isFormLoading || isGuestLoading || isGoogleLoading}
                                    className="w-full bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isFormLoading ? 'Sending...' : 'Sign In with Email'}
                                </button>
                            </form>
                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-cyan-400/20"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or</span>
                                <div className="flex-grow border-t border-cyan-400/20"></div>
                            </div>
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isFormLoading || isGuestLoading || isGoogleLoading}
                                className="w-full bg-white text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
                            </button>
                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-cyan-400/20"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or</span>
                                <div className="flex-grow border-t border-cyan-400/20"></div>
                            </div>
                            <button
                                onClick={handleGuestLogin}
                                disabled={isFormLoading || isGuestLoading || isGoogleLoading}
                                className="w-full border border-cyan-500 text-cyan-400 font-semibold py-2 px-4 rounded-md hover:bg-cyan-500/10 transition-colors disabled:border-cyan-800 disabled:text-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGuestLoading ? 'Logging In...' : 'Continue as Guest'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
