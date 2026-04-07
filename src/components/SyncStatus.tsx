import React, { useEffect, useState } from 'react';
import { useInspectionStore } from '@/store/inspectionStore';
import { Cloud, CloudOff, CloudUpload, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncStatus = () => {
    const syncStatus = useInspectionStore((s) => s.syncStatus);
    const isOnline = useInspectionStore((s) => s.isOnline);
    const setIsOnline = useInspectionStore((s) => s.setIsOnline);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [setIsOnline]);

    if (syncStatus === 'saved' && isOnline) {
        // Optionally hide after some time, or keep a subtle "cloud-check"
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-[100] pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={syncStatus + (isOnline ? 'online' : 'offline')}
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md text-[10px] font-black uppercase tracking-widest transition-colors",
                        !isOnline ? "bg-destructive/10 border-destructive/20 text-destructive" :
                        syncStatus === 'syncing' ? "bg-primary/10 border-primary/20 text-primary" :
                        syncStatus === 'error' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        "bg-success/10 border-success/20 text-success"
                    )}
                >
                    {!isOnline ? (
                        <>
                            <CloudOff className="w-3.5 h-3.5" />
                            <span>Offline (Buffered)</span>
                        </>
                    ) : syncStatus === 'syncing' ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Syncing...</span>
                        </>
                    ) : syncStatus === 'error' ? (
                        <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Sync Error</span>
                        </>
                    ) : (
                        <>
                            <Cloud className="w-3.5 h-3.5" />
                            <span>Saved to Cloud</span>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
