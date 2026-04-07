import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassContainer } from '@/components/ui/glass-container';
import { ArrowLeft, CheckCircle, Table as TableIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AbstractEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const activeInspection = useInspectionStore((s) => s.activeInspection);
    const fetchInspection = useInspectionStore((s) => s.fetchInspection);
    const updateBlock = useInspectionStore((s) => s.updateBlock);
    const finishInspection = useInspectionStore((s) => s.finishInspection);

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

    if (!activeInspection) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="animate-pulse font-bold uppercase tracking-widest text-xs">Loading Abstract Data...</p>
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await finishInspection(); 
            toast({ title: 'Abstract Updated', description: 'Remarks saved successfully.' });
            navigate(`/abstract-view/${id}`);
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen pb-32 pt-6 px-4 max-w-2xl mx-auto">
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
                    <h1 className="text-2xl font-black tracking-tight uppercase">Edit Abstract Remarks</h1>
                    <p className="text-sm text-muted-foreground font-medium">Update remarks for M/S. {activeInspection.header.consignee || 'Customer'}</p>
                </div>
            </header>

            <div className="space-y-6">
                <GlassContainer className="p-0 overflow-hidden border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
                                    <th className="p-4 w-20">Block No</th>
                                    <th className="p-4">Remarks / Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activeInspection.blocks.map((block) => (
                                    <tr key={block.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-mono font-bold text-primary">
                                            {String(block.blockNo).padStart(3, '0')}
                                        </td>
                                        <td className="p-2">
                                            <Input 
                                                value={block.remarks || ''}
                                                onChange={(e) => updateBlock(block.id, block.l1, block.l2, block.l3, e.target.value)}
                                                placeholder="e.g. Minor crack, good color..."
                                                className="bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30 h-10 text-sm"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassContainer>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="lg"
                    className="w-full h-16 text-lg font-black tracking-wider uppercase rounded-xl shadow-xl shadow-primary/20 mt-4 gap-3"
                >
                    {isSaving ? 'Saving...' : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            OK & Proceed
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
