import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FUTURISTIC_GLASS_STYLE } from '../constants';

const AuthPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { login, loginAsGuest } = useAuth();

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
                                    disabled={isFormLoading || isGuestLoading}
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
                                onClick={handleGuestLogin}
                                disabled={isFormLoading || isGuestLoading}
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
