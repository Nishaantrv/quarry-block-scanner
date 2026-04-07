import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInspectionStore } from '@/store/inspectionStore';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isOffline: boolean;
    error: Error | null;
    signOut: () => Promise<void>;
    clearError: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isOffline: false,
    error: null,
    signOut: async () => { },
    clearError: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [error, setError] = useState<Error | null>(null);
    const intentionalSignOut = useRef(false);
    const setUserId = useInspectionStore((s) => s.setUserId);
    const resetStore = useInspectionStore((s) => s.resetStore);
    const fetchInspectionsFromDb = useInspectionStore((s) => s.fetchInspectionsFromDb);

    useEffect(() => {
        const goOnline = () => setIsOffline(false);
        const goOffline = () => setIsOffline(true);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        // Initial check for code flow
        const params = new URLSearchParams(window.location.search);
        const errorDesc = params.get('error_description');
        const errorMsg = params.get('error');

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const hashErrorDesc = hashParams.get('error_description');
        const hashErrorMsg = hashParams.get('error');

        const isCallback = !!(window.location.search.includes('code=') || accessToken || errorMsg || errorDesc || hashErrorMsg || hashErrorDesc);
        let mounted = true;

        // Reset error on mount unless we have a specific error in URL
        if (!(errorMsg || errorDesc || hashErrorMsg || hashErrorDesc)) {
            setError(null);
        }

        if (errorMsg || errorDesc || hashErrorMsg || hashErrorDesc) {
            console.error('[Auth] Detected error in URL params:', { errorMsg, errorDesc, hashErrorMsg, hashErrorDesc });
            if (mounted) {
                setError(new Error(errorDesc || errorMsg || hashErrorDesc || hashErrorMsg || 'Authentication failed during callback'));
                setLoading(false);
            }
        }

        async function handleAuth() {
            // Safety timeout to prevent permanent loading state
            const authTimeout = setTimeout(() => {
                if (mounted && loading) {
                    console.warn("Auth check timed out, forcing loading to false");
                    setLoading(false);
                }
            }, 8000);

            try {
                // If we're not waiting for a code exchange, check for a session
                if (!isCallback) {
                    const { data: { session: cached }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) {
                        console.warn('[Auth] getSession error:', sessionError);
                    }
                    if (!mounted) return;

                    if (cached) {
                        setSession(cached);
                        setUser(cached.user);
                        setUserId(cached.user.id);
                        fetchInspectionsFromDb();
                    }
                }
            } catch (e) {
                console.error("Unexpected error in handleAuth:", e);
                // Don't set error here, let onAuthStateChange handle it or just load Auth page
            } finally {
                clearTimeout(authTimeout);
                // IF we're in a callback, DO NOT set loading false here. 
                // Wait for onAuthStateChange to fire 'SIGNED_IN'.
                if (mounted && !isCallback) {
                    setLoading(false);
                }
            }
        }

        handleAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            console.log("Auth event:", event, "session:", !!newSession);
            if (!mounted) return;

            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setUserId(null);
                resetStore();
                intentionalSignOut.current = false;
                setLoading(false);
            } else if (newSession) {
                setSession(newSession);
                setUser(newSession.user);
                setUserId(newSession.user.id);
                setError(null);
                setLoading(false);
                fetchInspectionsFromDb();
            } else if (event === 'INITIAL_SESSION' && !isCallback) {
                setLoading(false);
            } else if (event === 'TOKEN_REFRESHED') {
                setSession(newSession);
                setUser(newSession?.user || null);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    const clearError = () => setError(null);

    const signOut = async () => {
        intentionalSignOut.current = true;
        resetStore();  // wipe memory + localStorage BEFORE signOut
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isOffline, error, signOut, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
