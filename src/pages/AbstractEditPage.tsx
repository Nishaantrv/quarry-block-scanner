import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GlassContainer } from '@/components/ui/glass-container';
import { ArrowLeft, CheckCircle, FileEdit, LayoutDashboard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AbstractEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const activeInspection = useInspectionStore((s) => s.activeInspection);
    const fetchInspection = useInspectionStore((s) => s.fetchInspection);
    const updateHeader = useInspectionStore((s) => s.updateHeader);
    const saveInspection = useInspectionStore((s) => s.saveInspection);
    const finishInspection = useInspectionStore((s) => s.finishInspection);

    const [content, setContent] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!id) return;
        
        async function load() {
            if (!activeInspection || activeInspection.id !== id) {
                await fetchInspection(id!);
            }
        }
        load();
    }, [id, activeInspection, fetchInspection]);

    React.useEffect(() => {
        if (activeInspection && activeInspection.header.abstractDetails !== undefined) {
            // Default to existing if present, otherwise generate a default
            if (activeInspection.header.abstractDetails) {
                setContent(activeInspection.header.abstractDetails);
            } else {
                const totals = activeInspection.totals;
                const defaultText = `ABSTRACT OF INSPECTION\n----------------------\nTotal Blocks: ${totals.totalBlocks}\nTotal Gross CBM: ${totals.totalGrossCbm.toFixed(3)}\nTotal Net CBM: ${totals.totalNetCbm.toFixed(3)}\n\nStone Type: ${activeInspection.header.stoneType}\nQuarry Code: ${activeInspection.header.quarryCode}\n\nRemarks:\n- Inspection completed successfully.\n- Measurement taken at site.`;
                setContent(defaultText);
            }
        }
    }, [activeInspection]);

    if (!activeInspection) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="animate-pulse font-bold uppercase tracking-widest text-xs">Loading Abstract...</p>
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            updateHeader({ ...activeInspection.header, abstractDetails: content });
            await finishInspection(); // Use finishInspection to persist to DB
            toast({ title: 'Abstract Updated', description: 'Changes saved successfully.' });
            navigate(`/abstract-view/${id}`);
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen pb-32 pt-6 px-4 max-w-md mx-auto">
            <header className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/finish-details')}
                    className="rounded-full bg-card/50 backdrop-blur-md border border-white/5 shadow-sm h-12 w-12"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Edit Abstract</h1>
                    <p className="text-sm text-muted-foreground font-medium">Customize the inspection summary</p>
                </div>
            </header>

            <div className="space-y-6">
                <GlassContainer className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Abstract Content</Label>
                        <Textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter abstract details here..."
                            className="min-h-[400px] font-mono text-sm leading-relaxed bg-background/50 border-white/10 resize-none focus:ring-primary/20"
                        />
                    </div>
                </GlassContainer>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="lg"
                    className="w-full h-16 text-lg font-black tracking-wider uppercase rounded-xl shadow-xl shadow-primary/20 mt-4 gap-3 bg-primary hover:scale-[1.02] transition-transform"
                >
                    {isSaving ? 'Saving...' : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            OK & Proceed
                        </>
                    )}
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest px-4 opacity-50">
                    Clicking OK will save the content and show the preview page.
                </p>
            </div>
        </div>
    );
}
