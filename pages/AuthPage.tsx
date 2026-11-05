import React, { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const buttonStyle = 'min-h-12 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green disabled:cursor-not-allowed disabled:opacity-50';
type PendingAction = 'email' | 'google' | 'guest';

const AuthPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [sentEmail, setSentEmail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const pendingRef = useRef(false);
    const emailInput = useRef<HTMLInputElement>(null);
    const { login, loginAsGuest, loginWithGoogle } = useAuth();

    const handleAction = async (action: PendingAction) => {
        if (pendingRef.current) return;
        pendingRef.current = true;
        setPending(action);
        setError(null);
        try {
            if (action === 'email') {
                const submittedEmail = email.trim();
                await login(submittedEmail);
                setSentEmail(submittedEmail);
                setPending(null);
                pendingRef.current = false;
            } else if (action === 'google') {
                await loginWithGoogle();
            } else {
                loginAsGuest();
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
            setPending(null);
            pendingRef.current = false;
        }
    };

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
            <header className="mb-8">
                <p className="font-serif text-xl font-semibold tracking-tight text-house-green">Zenith Budget</p>
                <p className="mt-1 text-sm text-black/60">A little clarity for your money.</p>
            </header>
            <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
                <section aria-labelledby="intro-title" className="md:py-6">
                    <h1 id="intro-title" className="max-w-sm font-serif text-3xl font-semibold leading-tight tracking-tight text-house-green sm:text-4xl">Make a plan.<br />Make room for life.</h1>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-black/70">Give your income a purpose, record everyday activity, and see where your month stands.</p>
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/10 pt-5">
                        <div><h2 className="text-sm font-semibold text-house-green">Plan your month</h2><p className="mt-1 text-sm leading-relaxed text-black/60">Set income and allocations across six categories.</p></div>
                        <div><h2 className="text-sm font-semibold text-house-green">Track as you go</h2><p className="mt-1 text-sm leading-relaxed text-black/60">Compare recorded activity with your plan.</p></div>
                    </div>
                </section>
                <section aria-labelledby="signin-title" className="min-w-0 rounded-2xl border border-black/10 bg-white p-5 sm:p-8">
                    <h2 id="signin-title" className="font-serif text-2xl font-semibold tracking-tight text-house-green">Welcome to Zenith</h2>
                    <p className="mt-2 text-sm leading-relaxed text-black/60">Sign in to your account, or try a budget on this device.</p>
                    <div role="status" aria-live="polite">
                        {sentEmail && <div className="mt-5 rounded-xl bg-green-mint/50 p-4 text-sm leading-relaxed text-house-green">
                            <h3 className="font-semibold">Check your inbox</h3>
                            <p className="mt-1">We sent a sign-in link to <strong className="break-words">{sentEmail}</strong>. Open it to continue.</p>
                            <button type="button" disabled={pending !== null} onClick={() => { setSentEmail(null); setError(null); requestAnimationFrame(() => emailInput.current?.focus()); }} className="mt-2 min-h-11 rounded-lg font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-house-green disabled:opacity-50">Use another email</button>
                        </div>}
                    </div>
                    <form onSubmit={event => { event.preventDefault(); void handleAction('email'); }} className={`mt-6 space-y-4 ${sentEmail ? 'hidden' : ''}`} aria-busy={pending === 'email'}>
                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label>
                            <input ref={emailInput} id="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} required disabled={pending !== null} placeholder="you@example.com" aria-describedby="email-help" className="min-h-12 w-full min-w-0 rounded-xl border border-black/50 bg-white px-3 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-house-green disabled:opacity-50" />
                            <p id="email-help" className="mt-2 text-xs leading-relaxed text-black/60">We'll email you a link. No password needed.</p>
                        </div>
                        <button type="submit" disabled={pending !== null} className={`${buttonStyle} bg-house-green text-white hover:bg-green-uplift`}>{pending === 'email' ? 'Sending link…' : 'Continue with email'}</button>
                    </form>
                    {error && <p role="alert" className="mt-4 break-words rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger">{error}</p>}
                    <div className="my-5 flex items-center gap-4" aria-hidden="true"><div className="h-px flex-1 bg-black/10" /><span className="text-xs text-black/60">or</span><div className="h-px flex-1 bg-black/10" /></div>
                    <button type="button" onClick={() => void handleAction('google')} disabled={pending !== null} className={`${buttonStyle} flex items-center justify-center gap-3 border border-black/50 bg-white text-black/80 hover:bg-cream`}>
                        <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                        {pending === 'google' ? 'Redirecting…' : 'Continue with Google'}
                    </button>
                    <div className="mt-6 border-t border-black/10 pt-5">
                        <button type="button" onClick={() => void handleAction('guest')} disabled={pending !== null} className={`${buttonStyle} border border-house-green text-house-green hover:bg-green-mint/30`}>{pending === 'guest' ? 'Opening budget…' : 'Try as a guest'}</button>
                        <p className="mt-3 text-xs leading-relaxed text-black/60">Guest budgets and recurring rules stay in this browser, separate from your account. Signing out of guest mode clears them.</p>
                    </div>
                    <p role="status" className="sr-only">{pending === 'email' ? 'Sending sign-in link.' : pending === 'google' ? 'Redirecting to Google.' : pending === 'guest' ? 'Opening guest budget.' : ''}</p>
                </section>
            </div>
        </main>
    );
};

export default AuthPage;
