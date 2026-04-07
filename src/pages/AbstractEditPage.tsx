import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassContainer } from '@/components/ui/glass-container';
import { ArrowLeft, CheckCircle, Table as TableIcon, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AbstractEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const activeInspection = useInspectionStore((s) => s.activeInspection);
    const fetchInspection = useInspectionStore((s) => s.fetchInspection);
    const updateBlock = useInspectionStore((s) => s.updateBlock);
    const finishInspection = useInspectionStore((s) => s.finishInspection);
    const uploadPhoto = useInspectionStore((s) => s.uploadPhoto);

    const [isSaving, setIsSaving] = React.useState(false);
    const [uploadingBlockId, setUploadingBlockId] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const selectedBlockIdRef = React.useRef<string | null>(null);

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
            toast({ title: 'Abstract Updated', description: 'Changes saved successfully.' });
            navigate(`/abstract-view/${id}`);
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const blockId = selectedBlockIdRef.current;
        if (!file || !blockId) return;

        const block = activeInspection.blocks.find(b => b.id === blockId);
        if (!block) return;

        try {
            setUploadingBlockId(blockId);
            const url = await uploadPhoto(file);
            const newPhotoUrls = [...(block.photoUrls || []), url];
            updateBlock(block.id, block.l1, block.l2, block.l3, block.remarks, block.allowance, block.type, undefined, newPhotoUrls);
            toast({ title: 'Photo Uploaded', description: 'Block photo has been saved.' });
        } catch (error: any) {
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setUploadingBlockId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerPhotoUpload = (blockId: string) => {
        selectedBlockIdRef.current = blockId;
        fileInputRef.current?.click();
    };

    const removePhoto = (blockId: string, photoIdx: number) => {
        const block = activeInspection.blocks.find(b => b.id === blockId);
        if (!block || !block.photoUrls) return;
        const newPhotoUrls = block.photoUrls.filter((_, i) => i !== photoIdx);
        updateBlock(block.id, block.l1, block.l2, block.l3, block.remarks, block.allowance, block.type, undefined, newPhotoUrls);
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
                    <h1 className="text-2xl font-black tracking-tight uppercase text-foreground">Edit Abstract</h1>
                    <p className="text-sm text-muted-foreground font-medium">Update remarks, allowance and photos for M/S. {activeInspection.header.consignee || 'Customer'}</p>
                </div>
            </header>

            <div className="space-y-6">
                <GlassContainer className="p-0 overflow-hidden border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
                                    <th className="p-4 w-16">No</th>
                                    <th className="p-4 w-24">Allw. (cm)</th>
                                    <th className="p-4">Remarks / Notes</th>
                                    <th className="p-4 w-20 text-center">Photos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activeInspection.blocks.map((block) => (
                                    <React.Fragment key={block.id}>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono font-bold text-primary text-sm">
                                                {String(block.blockNo).padStart(3, '0')}
                                            </td>
                                            <td className="p-2">
                                                <Input 
                                                    type="number"
                                                    value={block.allowance ?? ''}
                                                    onChange={(e) => updateBlock(block.id, block.l1, block.l2, block.l3, block.remarks, parseFloat(e.target.value) || 0, block.type)}
                                                    className="bg-transparent border-white/10 focus-visible:ring-1 focus-visible:ring-primary/30 h-10 text-sm text-center tabular-nums"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input 
                                                    value={block.remarks || ''}
                                                    onChange={(e) => updateBlock(block.id, block.l1, block.l2, block.l3, e.target.value, block.allowance, block.type)}
                                                    placeholder="e.g. Minor crack..."
                                                    className="bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30 h-10 text-sm"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => triggerPhotoUpload(block.id)}
                                                    disabled={uploadingBlockId === block.id}
                                                    className={cn("rounded-full h-10 w-10 relative", (block.photoUrls?.length ?? 0) > 0 && "text-primary")}
                                                >
                                                    {uploadingBlockId === block.id ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Camera className="h-5 w-5" />
                                                            {(block.photoUrls?.length ?? 0) > 0 && (
                                                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                                                    {block.photoUrls?.length}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                        {block.photoUrls && block.photoUrls.length > 0 && (
                                            <tr className="bg-white/[0.02]">
                                                <td colSpan={4} className="p-3">
                                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                        {block.photoUrls.map((url, idx) => (
                                                            <div key={idx} className="relative group shrink-0">
                                                                <img 
                                                                    src={url} 
                                                                    alt="Block" 
                                                                    className="h-16 w-16 object-cover rounded-lg border border-white/10" 
                                                                />
                                                                <button 
                                                                    onClick={() => removePhoto(block.id, idx)}
                                                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-lg scale-0 group-hover:scale-100 transition-transform"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handlePhotoUpload} 
            />
        </div>
    );
}
