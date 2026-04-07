import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassContainer } from '@/components/ui/glass-container';
import { ArrowLeft, Edit2, Check, X, Trash2, FileText, ChevronRight, Camera, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SummaryBar } from '@/components/SummaryBar';

export default function InspectionListPage() {
    const navigate = useNavigate();
    const inspection = useInspectionStore((s) => s.activeInspection);
    const updateBlock = useInspectionStore((s) => s.updateBlock);
    const deleteBlock = useInspectionStore((s) => s.deleteBlock);
    const uploadPhoto = useInspectionStore((s) => s.uploadPhoto);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({ l1: '', l2: '', l3: '', allowance: '', type: 'small' as 'small' | 'large' | 'other' });
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const fileInputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});

    React.useEffect(() => {
        if (!inspection) navigate('/');
    }, [inspection, navigate]);

    if (!inspection) return null;

    const handleStartEdit = (block: any) => {
        setEditingId(block.id);
        setEditValues({
            l1: String(block.l1),
            l2: String(block.l2),
            l3: String(block.l3),
            allowance: block.allowance !== undefined ? String(block.allowance) : String(inspection.header.allowance),
            type: block.type || 'small'
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = (blockId: string) => {
        const v1 = parseFloat(editValues.l1);
        const v2 = parseFloat(editValues.l2);
        const v3 = parseFloat(editValues.l3);
        const vAllowance = parseFloat(editValues.allowance);

        if (isNaN(v1) || isNaN(v2) || isNaN(v3) || isNaN(vAllowance) || v1 <= 0 || v2 <= 0 || v3 <= 0 || vAllowance < 0) {
            toast({ title: 'Invalid Values', description: 'Please enter valid numbers.', variant: 'destructive' });
            return;
        }

        updateBlock(blockId, v1, v2, v3, undefined, vAllowance, editValues.type);
        setEditingId(null);
        toast({ title: 'Block Updated', description: 'Dimensions have been saved.' });
    };

    const handleDelete = (blockId: string) => {
        if (confirm('Are you sure you want to delete this block?')) {
            deleteBlock(blockId);
            toast({ title: 'Block Deleted', description: 'The block has been removed.' });
        }
    };

    const handlePhotoUpload = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(blockId);
            const url = await uploadPhoto(file);
            const block = inspection.blocks.find(b => b.id === blockId);
            if (block) {
                const currentPhotos = block.photoUrls || (block.photoUrl ? [block.photoUrl] : []);
                updateBlock(blockId, block.l1, block.l2, block.l3, block.remarks, block.allowance, block.type as any, undefined, [...currentPhotos, url]);
                toast({ title: 'Photo Added', description: 'New block photo has been saved.' });
            }
        } catch (error: any) {
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background pb-32">
            {/* Header */}
            <header className="p-4 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/finish-details')}
                    className="rounded-full bg-card/50 border border-border"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tight">Inspection List</h1>
                    <p className="text-xs text-muted-foreground font-medium">Review and edit blocks before invoice</p>
                </div>
            </header>

            <div className="flex-1 px-4 max-w-2xl mx-auto w-full space-y-4">
                {inspection.blocks.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground">No blocks added yet.</p>
                        <Button onClick={() => navigate('/marking')} className="mt-4">Go to Marking</Button>
                    </div>
                ) : (
                    inspection.blocks.map((block) => (
                        <GlassContainer key={block.id} className="p-4 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary font-black px-3 py-1 rounded-lg border border-primary/20">
                                        #{String(block.blockNo).padStart(3, '0')}
                                    </div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Block Details
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        ref={el => fileInputRefs.current[block.id] = el}
                                        onChange={(e) => handlePhotoUpload(block.id, e)}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "h-8 w-8 rounded-full",
                                            (block.photoUrls && block.photoUrls.length > 0) || block.photoUrl ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted/50"
                                        )}
                                        onClick={() => fileInputRefs.current[block.id]?.click()}
                                        disabled={isUploading === block.id}
                                    >
                                        {isUploading === block.id ? (
                                            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
                                        ) : (block.photoUrls && block.photoUrls.length > 0) || block.photoUrl ? (
                                            <div className="relative">
                                                <Image className="h-4 w-4" />
                                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] rounded-full h-3 w-3 flex items-center justify-center font-bold">
                                                    {(block.photoUrls?.length || 0) + (block.photoUrl ? 1 : 0)}
                                                </div>
                                            </div>
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                    </Button>

                                    <div className="h-4 w-[1px] bg-border mx-1" />

                                    {editingId === block.id ? (
                                        <>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleSaveEdit(block.id)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={handleCancelEdit}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleStartEdit(block)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(block.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {((block.photoUrls && block.photoUrls.length > 0) || block.photoUrl) && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-[120px]">
                                        {block.photoUrl && (
                                            <div className="relative h-16 w-16 flex-shrink-0">
                                                <img
                                                    src={block.photoUrl}
                                                    alt={`Block ${block.blockNo}`}
                                                    className="h-full w-full object-cover rounded-lg border border-border"
                                                />
                                            </div>
                                        )}
                                        {block.photoUrls?.map((url: string, idx: number) => (
                                            <div key={idx} className="relative h-16 w-16 flex-shrink-0">
                                                <img
                                                    src={url}
                                                    alt={`Block ${block.blockNo} - ${idx + 1}`}
                                                    className="h-full w-full object-cover rounded-lg border border-border"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex-1">
                                    {editingId === block.id ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Length</Label>
                                                <Input
                                                    type="number"
                                                    value={editValues.l1}
                                                    onChange={(e) => setEditValues({ ...editValues, l1: e.target.value })}
                                                    className="h-10 font-bold text-lg"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Height</Label>
                                                <Input
                                                    type="number"
                                                    value={editValues.l2}
                                                    onChange={(e) => setEditValues({ ...editValues, l2: e.target.value })}
                                                    className="h-10 font-bold text-lg"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Width</Label>
                                                <Input
                                                    type="number"
                                                    value={editValues.l3}
                                                    onChange={(e) => setEditValues({ ...editValues, l3: e.target.value })}
                                                    className="h-10 font-bold text-lg"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Allowance (cm)</Label>
                                                <Input
                                                    type="number"
                                                    value={editValues.allowance}
                                                    onChange={(e) => setEditValues({ ...editValues, allowance: e.target.value })}
                                                    className="h-10 font-bold text-lg"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Type</Label>
                                                <select
                                                    value={editValues.type}
                                                    onChange={(e) => setEditValues({ ...editValues, type: e.target.value as any })}
                                                    className="w-full h-10 px-3 rounded-md bg-background border-input font-bold text-sm uppercase"
                                                >
                                                    <option value="small">Small</option>
                                                    <option value="large">Large</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-end justify-between">
                                            <div className="grid grid-cols-3 gap-y-2 gap-x-6 flex-1">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Length</div>
                                                    <div className="text-lg font-black">{block.l1}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Height</div>
                                                    <div className="text-lg font-black">{block.l2}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Width</div>
                                                    <div className="text-lg font-black">{block.l3}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Type</div>
                                                    <div className="text-sm font-black uppercase text-primary/80">
                                                        {block.type === 'small' ? 'Small' : block.type === 'large' ? 'Large' : 'Other'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Allow.</div>
                                                    <div className="text-lg font-black">
                                                        {block.allowance ?? 0}
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="text-[10px] font-bold uppercase text-primary/60 mb-0.5">Net Volume</div>
                                                    <div className="text-lg font-black text-primary">
                                                        {(block.netCbm ?? 0).toFixed(3)} m³
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassContainer>
                    ))
                )}
            </div>

            {/* Fixed Bottom Action */}
            <div className="fixed bottom-24 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border z-30">
                <div className="max-w-2xl mx-auto flex gap-4">
                    <Button
                        variant="outline"
                        className="flex-1 h-14 font-bold border-2"
                        onClick={() => navigate('/marking')}
                    >
                        Add More Blocks
                    </Button>
                    <Button
                        className="flex-[1.5] h-14 text-lg font-black tracking-wider uppercase shadow-xl shadow-primary/20 gap-2"
                        onClick={() => navigate('/export')}
                        disabled={inspection.blocks.length === 0}
                    >
                        <FileText className="w-5 h-5" />
                        Generate Report
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <SummaryBar totals={inspection.totals} />
        </div>
    );
}
