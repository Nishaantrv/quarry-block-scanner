import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, FileDown, FileText, Printer, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AbstractViewPage() {
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
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="animate-pulse font-bold uppercase tracking-widest text-xs text-muted-foreground">Loading Abstract...</p>
                </div>
            </div>
        );
    }

    const { header, blocks } = activeInspection;

    const handleCellChange = (blockId: string, field: 'l1' | 'l2' | 'l3' | 'remarks' | 'allowance', value: string) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        let v1 = block.l1;
        let v2 = block.l2;
        let v3 = block.l3;
        let rem = block.remarks || '';
        let allw = block.allowance;

        if (field === 'l1') v1 = parseFloat(value) || 0;
        else if (field === 'l2') v2 = parseFloat(value) || 0;
        else if (field === 'l3') v3 = parseFloat(value) || 0;
        else if (field === 'remarks') rem = value;
        else if (field === 'allowance') allw = parseFloat(value) || 0;

        updateBlock(blockId, v1, v2, v3, rem, allw, block.type);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await finishInspection();
            toast({ title: 'Inspection Complete', description: 'Saved successfully.' });
            navigate(`/abstract-edit/${activeInspection.id}`);
        } catch (err: any) {
            toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen pb-32 pt-6 px-2 md:px-4 max-w-[1200px] mx-auto text-foreground font-sans">
            <header className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur-md z-30 p-4 border-b border-white/10 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/finish-details')}
                        className="rounded-full bg-card border border-white/10 shadow-sm h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg md:text-xl font-black tracking-tight uppercase leading-none">Abstract Preview</h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Review & Edit Data</p>
                    </div>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="rounded-full px-6 font-bold shadow-lg shadow-primary/20 gap-2"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                </Button>
            </header>

            <div className="space-y-6">
                <div className="bg-white text-black rounded-2xl shadow-2xl overflow-hidden border border-zinc-200">
                    <div className="text-center py-8 bg-zinc-50 border-b border-zinc-200">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#0369a1]">
                            M/S. - ({header.consignee || 'CUSTOMER'}) BLOCKS ABSTRACT
                        </h2>
                    </div>

                    <div className="overflow-x-auto overflow-y-hidden selection:bg-primary/20">
                        <table className="w-full border-collapse min-w-[1000px] text-[11px]">
                            <thead>
                                <tr className="bg-zinc-100 uppercase font-black tracking-wider text-zinc-500 border-b-2 border-zinc-300">
                                    <th className="p-3 border border-zinc-300 text-center w-12" rowSpan={2}>SL</th>
                                    <th className="p-3 border border-zinc-300 text-center w-24" rowSpan={2}>DATE</th>
                                    <th className="p-3 border border-zinc-300 text-center w-20" rowSpan={2}>BLOCK</th>
                                    <th className="p-3 border border-zinc-300 text-center w-12" rowSpan={2}>SZ</th>
                                    <th className="p-2 border border-zinc-300 text-center" colSpan={3}>BUYER NET</th>
                                    <th className="p-3 border border-zinc-300 text-center w-16" rowSpan={2}>M3</th>
                                    <th className="p-2 border border-zinc-300 text-center" colSpan={3}>OUR NET</th>
                                    <th className="p-3 border border-zinc-300 text-center w-20" rowSpan={2}>NET CBM</th>
                                    <th className="p-3 border border-zinc-300 text-center w-20" rowSpan={2}>DIFF</th>
                                    <th className="p-3 border border-zinc-300 text-center" rowSpan={2}>REMARK</th>
                                    <th className="p-3 border border-zinc-300 text-center w-28" rowSpan={2}>CLAIM</th>
                                </tr>
                                <tr className="bg-zinc-50 text-[9px] font-bold text-zinc-400 border-b border-zinc-300">
                                    <th className="p-2 border border-zinc-300 w-14">L</th>
                                    <th className="p-2 border border-zinc-300 w-14">W</th>
                                    <th className="p-2 border border-zinc-300 w-14">H</th>
                                    <th className="p-2 border border-zinc-300 w-14">L</th>
                                    <th className="p-2 border border-zinc-300 w-14">W</th>
                                    <th className="p-2 border border-zinc-300 w-14">H</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blocks.map((b, idx) => {
                                    const allowance = b.allowance !== undefined ? b.allowance : 
                                        ((b.type === 'large' ? header.allowanceLarge : b.type === 'other' ? header.allowanceOther : header.allowanceSmall) || 0);
                                    
                                    const buyerL = b.l1;
                                    const buyerW = Math.max(b.l2 - allowance, 0);
                                    const buyerH = b.l3;
                                    const buyerM3 = (buyerL * buyerW * buyerH) / 1000000;
                                    
                                    const ourL = b.l1;
                                    const ourW = b.l2;
                                    const ourH = b.l3;
                                    const ourNetCbm = b.grossCbm || (ourL * ourW * ourH) / 1000000;
                                    
                                    const diffCbm = ourNetCbm - buyerM3;

                                    return (
                                        <tr key={b.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="p-2 border border-zinc-200 text-center font-bold text-zinc-400 bg-zinc-50/50">{idx + 1}</td>
                                            <td className="p-2 border border-zinc-200 text-center text-[9px] text-zinc-500">{new Date(activeInspection.createdAt).toLocaleDateString('en-GB')}</td>
                                            <td className="p-2 border border-zinc-200 text-center font-black text-blue-700 bg-blue-50/20">{b.blockNo}</td>
                                            <td className="p-2 border border-zinc-200 text-center font-bold text-zinc-500">C</td>
                                            
                                            {/* BUYER NET - Formula based */}
                                            <td className="p-1 border border-zinc-200 text-center bg-zinc-50/30">{buyerL}</td>
                                            <td className="p-1 border border-zinc-200 text-center font-bold text-red-600 bg-red-50/20 tabular-nums">{buyerW}</td>
                                            <td className="p-1 border border-zinc-200 text-center bg-zinc-50/30">{buyerH}</td>
                                            <td className="p-1 border border-zinc-200 text-center font-bold text-black tabular-nums">{buyerM3.toFixed(3)}</td>
                                            
                                            {/* OUR NET - Editable */}
                                            <td className="p-0 border border-zinc-200">
                                                <input 
                                                    type="number" 
                                                    value={b.l1} 
                                                    onChange={(e) => handleCellChange(b.id, 'l1', e.target.value)}
                                                    className="w-full h-8 text-center bg-transparent border-none focus:ring-2 focus:ring-primary/20 font-medium tabular-nums"
                                                />
                                            </td>
                                            <td className="p-0 border border-zinc-200">
                                                <input 
                                                    type="number" 
                                                    value={b.l2} 
                                                    onChange={(e) => handleCellChange(b.id, 'l2', e.target.value)}
                                                    className="w-full h-8 text-center bg-transparent border-none focus:ring-2 focus:ring-red-100 font-black text-red-600 tabular-nums"
                                                />
                                            </td>
                                            <td className="p-0 border border-zinc-200">
                                                <input 
                                                    type="number" 
                                                    value={b.l3} 
                                                    onChange={(e) => handleCellChange(b.id, 'l3', e.target.value)}
                                                    className="w-full h-8 text-center bg-transparent border-none focus:ring-2 focus:ring-primary/20 font-medium tabular-nums"
                                                />
                                            </td>
                                            
                                            <td className="p-2 border border-zinc-200 text-center font-black text-zinc-900 tabular-nums">{ourNetCbm.toFixed(3)}</td>
                                            <td className="p-2 border border-zinc-200 text-center font-bold text-zinc-600 tabular-nums bg-zinc-50/50">{diffCbm.toFixed(3)}</td>
                                            
                                            {/* REMARK - Editable */}
                                            <td className="p-0 border border-zinc-200 min-w-[150px]">
                                                <textarea 
                                                    value={b.remarks || ''} 
                                                    onChange={(e) => handleCellChange(b.id, 'remarks', e.target.value)}
                                                    placeholder={`Allowance of ${allowance}cm applied...`}
                                                    className="w-full h-10 p-2 text-[9px] bg-transparent border-none focus:ring-2 focus:ring-primary/10 resize-none font-medium leading-tight text-red-700 italic"
                                                />
                                            </td>
                                            
                                            <td className="p-0 border border-zinc-200">
                                                <div className="flex flex-col items-stretch h-10">
                                                    <div className="bg-zinc-100 text-[8px] font-bold text-center py-0.5 border-b border-zinc-200">SHORT SIZE</div>
                                                    <input 
                                                        type="number"
                                                        value={allowance}
                                                        onChange={(e) => handleCellChange(b.id, 'allowance', e.target.value)}
                                                        className="flex-1 text-center bg-transparent border-none text-[9px] font-black tabular-nums focus:ring-0"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <Button
                        onClick={() => navigate('/export')}
                        size="lg"
                        className="flex-1 h-14 md:h-16 text-md md:text-lg font-black tracking-wider uppercase rounded-2xl shadow-xl shadow-primary/20 gap-3 bg-gradient-to-r from-success to-success/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <FileDown className="w-5 h-5" />
                        Next: Proceed to Export
                    </Button>
                </div>
                
                <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest px-4 pb-12 opacity-40">
                    Proprietary Abstract Format for M/S. {header.consignee || 'Customer'}.
                </p>
            </div>
        </div>
    );
}
