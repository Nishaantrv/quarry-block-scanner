import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { GlassContainer } from '@/components/ui/glass-container';
import { ArrowLeft, CheckCircle, FileDown, Printer, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AbstractViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const activeInspection = useInspectionStore((s) => s.activeInspection);
    const fetchInspection = useInspectionStore((s) => s.fetchInspection);

    React.useEffect(() => {
        if (!id) return;
        
        async function load() {
            if (!activeInspection || activeInspection.id !== id) {
                await fetchInspection(id!);
            }
        }
        load();
    }, [id, activeInspection, fetchInspection]);

    if (!activeInspection) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="animate-pulse font-bold uppercase tracking-widest text-xs">Loading Abstract...</p>
            </div>
        );
    }

    const { header, totals } = activeInspection;
    const abstractContent = header.abstractDetails || '';

    return (
        <div className="min-h-screen pb-32 pt-6 px-4 max-w-md mx-auto">
            <header className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/abstract-edit/${id}`)}
                    className="rounded-full bg-card/50 backdrop-blur-md border border-white/5 shadow-sm h-12 w-12"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Abstract Review</h1>
                    <p className="text-sm text-muted-foreground font-medium">Final preview of your inspection</p>
                </div>
            </header>

            <div className="space-y-6">
                <GlassContainer className="p-8 space-y-8 bg-card/40 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText className="w-24 h-24 rotate-12" />
                    </div>
                    
                    <div className="space-y-4">
                        <div className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-2 flex items-center gap-2">
                            <span className="h-[1px] w-4 bg-primary" /> Abstract Content
                        </div>
                        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground bg-white/5 p-4 rounded-lg border border-white/5">
                            {abstractContent}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Blocks</div>
                            <div className="text-xl font-black text-primary">{totals.totalBlocks}</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Net CBM</div>
                            <div className="text-xl font-black text-primary">{totals.totalNetCbm.toFixed(3)}</div>
                        </div>
                    </div>
                </GlassContainer>

                <Button
                    onClick={() => navigate('/export')}
                    size="lg"
                    className="w-full h-16 text-lg font-black tracking-wider uppercase rounded-xl shadow-xl shadow-primary/20 mt-4 gap-3 bg-primary hover:scale-[1.02] transition-transform"
                >
                    <FileDown className="w-5 h-5" />
                    Next: Proceed to Export
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest px-4 opacity-50">
                    Clicking Proceed will take you to the final Invoice and Packing List export page.
                </p>
            </div>
        </div>
    );
}
