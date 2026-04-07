import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, FileDown, FileText, Printer } from 'lucide-react';

export default function AbstractViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const activeInspection = useInspectionStore((s) => s.activeInspection);
    const fetchInspection = useInspectionStore((s) => s.fetchInspection);
    const companyProfile = useInspectionStore((s) => s.companyProfile);

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
                <p className="animate-pulse font-bold uppercase tracking-widest text-xs text-muted-foreground">Loading Abstract...</p>
            </div>
        );
    }

    const { header, blocks, totals } = activeInspection;

    const cellStyle = { border: '1px solid #000', padding: '4px', textAlign: 'center' as const, fontSize: '9px' };
    const headerStyle = { ...cellStyle, fontWeight: 'bold' as const, background: '#f8fafc', textTransform: 'uppercase' as const };
    const subHeaderStyle = { ...cellStyle, fontWeight: 'bold' as const, background: '#f1f5f9', fontSize: '8px' };

    return (
        <div className="min-h-screen pb-32 pt-6 px-4 max-w-[1000px] mx-auto text-foreground">
            <header className="flex items-center gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 p-2 border-b border-white/5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/abstract-edit/${id}`)}
                    className="rounded-full bg-card/50 border border-white/5 shadow-sm h-10 w-10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-black tracking-tight uppercase">Preview Abstract</h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Review before export</p>
                </div>
            </header>

            <div className="space-y-6">
                <div className="bg-white text-black p-8 rounded-lg shadow-2xl overflow-x-auto">
                    {/* Header from image */}
                    <div className="text-center py-6 mb-8 border-b border-zinc-200">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-[#0369a1] drop-shadow-sm">
                            M/S. - ({header.consignee || 'CUSTOMER'}) BLOCKS ABSTRACT
                        </h2>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '2px solid #000' }}>
                        <colgroup>
                            <col style={{ width: '4%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '10%' }} />
                            <col style={{ width: '5%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '8%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '12%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={headerStyle} rowSpan={2}>SL.NO</th>
                                <th style={headerStyle} rowSpan={2}>MARKING DATE</th>
                                <th style={headerStyle} rowSpan={2}>BLOCK NO</th>
                                <th style={headerStyle} rowSpan={2}>SIZE</th>
                                <th style={headerStyle} colSpan={3}>BUYER NET</th>
                                <th style={headerStyle} rowSpan={2}>M3</th>
                                <th style={headerStyle} colSpan={3}>OUR NET</th>
                                <th style={headerStyle} rowSpan={2}>NET CBM</th>
                                <th style={headerStyle} rowSpan={2}>DIFF CBM</th>
                                <th style={headerStyle} rowSpan={2}>REMARK</th>
                                <th style={headerStyle} rowSpan={2}>BUYER CLAIM</th>
                            </tr>
                            <tr>
                                <th style={subHeaderStyle}>L</th>
                                <th style={subHeaderStyle}>W</th>
                                <th style={subHeaderStyle}>H</th>
                                <th style={subHeaderStyle}>L</th>
                                <th style={subHeaderStyle}>W</th>
                                <th style={subHeaderStyle}>H</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blocks.map((b, idx) => {
                                const allowance = (b.type === 'large' ? header.allowanceLarge : b.type === 'other' ? header.allowanceOther : header.allowanceSmall) || 0;
                                
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
                                    <tr key={b.id}>
                                        <td style={cellStyle}>{idx + 1}</td>
                                        <td style={cellStyle}>{new Date(activeInspection.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td style={cellStyle}>{b.blockNo}</td>
                                        <td style={cellStyle}>C</td>
                                        <td style={cellStyle}>{buyerL}</td>
                                        <td style={{ ...cellStyle, color: '#dc2626', fontWeight: 'bold' }}>{buyerW}</td>
                                        <td style={cellStyle}>{buyerH}</td>
                                        <td style={cellStyle}>{buyerM3.toFixed(3)}</td>
                                        <td style={cellStyle}>{ourL}</td>
                                        <td style={{ ...cellStyle, color: '#dc2626', fontWeight: 'bold' }}>{ourW}</td>
                                        <td style={cellStyle}>{ourH}</td>
                                        <td style={cellStyle}>{ourNetCbm.toFixed(3)}</td>
                                        <td style={cellStyle}>{diffCbm.toFixed(3)}</td>
                                        <td style={{ ...cellStyle, textAlign: 'left', color: '#dc2626', fontSize: '8px' }}>
                                            {b.remarks || `We have given allowance of ${allowance}cm for this block.`}
                                        </td>
                                        <td style={{ ...cellStyle, fontSize: '8px', padding: '2px' }}>
                                            SHORT SIZE<br />H = {allowance} CM
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button
                        onClick={() => navigate('/export')}
                        size="lg"
                        className="flex-1 h-16 text-lg font-black tracking-wider uppercase rounded-xl shadow-xl shadow-primary/20 gap-3 bg-primary hover:scale-[1.02] transition-transform"
                    >
                        <FileDown className="w-5 h-5" />
                        Next: Proceed to Export
                    </Button>
                </div>
                
                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest px-4 opacity-50">
                    The above table is based on your specific format for M/S. {header.consignee || 'Customer'}.
                </p>
            </div>
        </div>
    );
}
