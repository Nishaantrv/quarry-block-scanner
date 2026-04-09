import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { numberToWords, calcTotals, buildBlock } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { InspectionHeader, CompanyProfile, Customer, Block } from '@/types/inspection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, FileDown, Printer, Edit2, Save, X, 
  Search, User, Building, Truck, CreditCard, Settings2,
  Plus, Check, ChevronDown, Landmark
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  History, 
  MapPin, 
  Phone, 
  Calendar,
  Layers,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ObliqueBlockViews } from '@/components/ObliqueBlockViews';

type DocType = 'gross-packing' | 'net-packing' | 'gross-invoice' | 'net-invoice' | 'inspection-report';

export default function ExportPage() {
  const navigate = useNavigate();
  const inspection = useInspectionStore((s) => s.activeInspection);
  const companyProfile = useInspectionStore((s) => s.companyProfile);
  const updateHeader = useInspectionStore((s) => s.updateHeader);
  const setCompanyProfile = useInspectionStore((s) => s.setCompanyProfile);
  const updateBlocks = useInspectionStore((s) => s.updateBlocks);
  const { toast } = useToast();

  const [activeDoc, setActiveDoc] = React.useState<DocType>('inspection-report');
  const printRef = useRef<HTMLDivElement>(null);
  const printHiddenRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [zoom, setZoom] = React.useState(1);

  // Edit Mode State
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedHeader, setEditedHeader] = React.useState<InspectionHeader | null>(null);
  const [editedProfile, setEditedProfile] = React.useState<CompanyProfile | null>(null);
  const [editedBlocks, setEditedBlocks] = React.useState<Block[]>([]);

  useEffect(() => {
    if (isMobile) {
      // Calculate fit-to-width scale
      const screenWidth = window.innerWidth - 32; // padding
      const docWidth = 210 * 3.78; // mm to px approx
      setZoom(Math.min(screenWidth / docWidth, 1));
    } else {
      setZoom(1);
    }
  }, [isMobile, activeDoc]);

  useEffect(() => {
    if (inspection) {
      setEditedHeader(inspection.header);
    }
    if (companyProfile) {
      setEditedProfile(companyProfile);
    }
    if (inspection) {
      setEditedBlocks(inspection.blocks);
    }
  }, [inspection, companyProfile]);

  if (!inspection) {
    navigate('/');
    return null;
  }

  const handleStartEdit = () => {
    setEditedHeader({ ...inspection.header });
    setEditedProfile({ ...companyProfile });
    setEditedBlocks([...inspection.blocks]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedHeader(inspection.header);
    setEditedProfile(companyProfile);
    setEditedBlocks(inspection.blocks);
  };

  const handleSaveEdit = () => {
    if (editedHeader) updateHeader(editedHeader);
    if (editedProfile) setCompanyProfile(editedProfile);
    if (editedBlocks.length > 0) updateBlocks(editedBlocks);
    setIsEditing(false);
  };

  const handlePrint = () => {
    const content = printHiddenRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Pop-up Blocked", description: "Please allow pop-ups to share as PDF", variant: "destructive" });
      return;
    }

    const doc = printWindow.document;
    const clone = content.cloneNode(true) as HTMLDivElement;

    const printStyles = `
      @page { 
        size: A4 portrait; 
        margin: 15mm; 
      }
      body { 
        margin: 0; 
        padding: 0; 
        background: white; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
      }
      .print-wrapper {
        width: 210mm;
        margin: 0;
        background: white;
      }
      .page-break {
        break-after: page;
        page-break-after: always;
      }
      .break-inside-avoid {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      ${Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
          } catch (e) {
            return '';
          }
        })
        .join('\n')}
    `;

    const style = doc.createElement('style');
    style.textContent = printStyles;
    doc.head.appendChild(style);
    
    // Force some styles on the clone to ensure it fits the paper
    clone.style.width = '210mm';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';

    const wrapper = doc.createElement('div');
    wrapper.className = 'print-wrapper';
    wrapper.appendChild(doc.adoptNode(clone));
    doc.body.appendChild(wrapper);

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const docs: { key: DocType; label: string }[] = [
    { key: 'inspection-report', label: 'Inspection Report' },
    { key: 'gross-packing', label: 'G. Packing list' },
    { key: 'net-packing', label: 'N. Packing list' },
    { key: 'gross-invoice', label: 'G. Invoice' },
    { key: 'net-invoice', label: 'N. Invoice' },
  ];

  const h = isEditing && editedHeader ? editedHeader : inspection.header;
  const cp = isEditing && editedProfile ? editedProfile : companyProfile;
  
  // Create a sorted list of blocks specifically for reports (Type 1 first, then Type 2, etc.)
  const reportBlocks = React.useMemo(() => {
    const raw = isEditing ? editedBlocks : inspection.blocks;
    if (!raw || raw.length === 0) return [];
    
    return [...raw].sort((a, b) => {
      const typeA = a.type || '1';
      const typeB = b.type || '1';
      
      // Sort by type order as defined in blockTypes
      const orderA = h.blockTypes?.findIndex((t: any) => t.id === typeA) ?? 0;
      const orderB = h.blockTypes?.findIndex((t: any) => t.id === typeB) ?? 0;
      
      if (orderA !== orderB) return orderA - orderB;
      
      // Within same type, sort by block number
      return (Number(a.blockNo) || 0) - (Number(b.blockNo) || 0);
    });
  }, [isEditing, editedBlocks, inspection.blocks, h.blockTypes]);

  const blocks = inspection.blocks;
  const totals = isEditing ? calcTotals(editedBlocks) : inspection.totals;
  
  const minBlockNo = Math.min(...(isEditing ? editedBlocks : blocks).map(b => Number(b.blockNo) || 0));
  const maxBlockNo = Math.max(...(isEditing ? editedBlocks : blocks).map(b => Number(b.blockNo) || 0));
  const blockRange = (isEditing ? editedBlocks : blocks).length > 0
    ? `${String(minBlockNo).padStart(3, '0')} TO ${String(maxBlockNo).padStart(3, '0')}`
    : '';

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-card border-b p-2 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/inspection-list')} className="h-10 w-10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-sm font-bold uppercase tracking-wider">Export</h1>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleStartEdit} className="gap-2">
                  <Edit2 className="h-4 w-4" /> Edit
                </Button>
                <Button size="sm" onClick={handlePrint} className="bg-primary text-primary-foreground font-bold">
                  <Printer className="h-4 w-4 mr-1" /> Print / PDF
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-2 text-destructive border-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
          {docs.map((d) => (
            <button
              key={d.key}
              onClick={() => setActiveDoc(d.key)}
              className={cn(
                "flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider border rounded transition-colors whitespace-nowrap",
                activeDoc === d.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-2">
        {isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-180px)] overflow-hidden">
            {/* Split View on Desktop: Editor (Left), Preview (Right) */}
            <div className="flex flex-col gap-2 h-full overflow-hidden">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  <Edit2 className="h-3 w-3" /> Editing Mode
                </span>
                <span className="text-[10px] font-medium text-amber-600/70">
                  Document: {activeDoc.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              
              <DocumentEditor 
                h={editedHeader!} 
                cp={editedProfile!} 
                blocks={editedBlocks}
                onHeaderChange={setEditedHeader} 
                onProfileChange={setEditedProfile} 
                onBlocksChange={setEditedBlocks}
              />
            </div>

            {/* Preview on the right (hidden on mobile during edit if desired, or small) */}
            <div className="hidden lg:block border rounded-xl overflow-auto bg-zinc-900/50 p-4 shadow-inner">
               <div className="scale-[0.6] origin-top transform-gpu">
                  <div className={cn(
                    "bg-white text-black p-[5mm] text-[8px] leading-tight mx-auto shadow-2xl",
                    "w-[210mm] min-h-[297mm]"
                  )}>
                    <PreviewContent 
                      activeDoc={activeDoc} 
                      cp={editedProfile!} 
                      h={editedHeader!} 
                      blocks={reportBlocks} 
                      totals={calcTotals(editedBlocks)} 
                      blockRange={blockRange} 
                      isEditing={true}
                      inspectionPhotos={inspection?.header.inspectionPhotos}
                    />
                  </div>
               </div>
            </div>
          </div>
        ) : (
          /* Normal Preview Mode - RESTORED & OPTIMIZED */
          <div className="flex flex-col items-center gap-4">
            {/* Zoom Controls for Mobile optimization */}
            {isMobile && (
              <div className="flex items-center gap-2 bg-card border rounded-full px-4 py-2 shadow-sm sticky top-[100px] z-30">
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-[10px] font-bold w-12 text-center uppercase tabular-nums">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => {
                      const screenWidth = window.innerWidth - 32;
                      const docWidth = 210 * 3.78;
                      setZoom(Math.min(screenWidth / docWidth, 1));
                   }} 
                   className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="w-full overflow-auto flex justify-center pb-20">
              <div 
                className={cn(
                  "inline-block transition-transform origin-top transform-gpu",
                )}
                style={{ transform: `scale(${zoom})` }}
              >
                <div ref={printRef} className="space-y-8">
                  <PreviewContent 
                    activeDoc={activeDoc} 
                    cp={cp} 
                    h={h} 
                    blocks={reportBlocks} 
                    totals={totals} 
                    blockRange={blockRange} 
                    isEditing={false}
                    inspectionPhotos={inspection?.header.inspectionPhotos}
                    createdAt={inspection?.createdAt}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* HIDDEN PRINTABLE CONTAINER - Always Paper Formatted */}
      <div className="fixed -left-[10000px] -top-[10000px] pointer-events-none" aria-hidden="true">
        <div ref={printHiddenRef} className="space-y-0">
          <PreviewContent 
            activeDoc={activeDoc} 
            cp={isEditing ? editedProfile : cp} 
            h={isEditing ? editedHeader : h} 
            blocks={reportBlocks} 
            totals={isEditing ? calcTotals(editedBlocks) : totals} 
            blockRange={blockRange} 
            isEditing={false}
            inspectionPhotos={inspection?.header.inspectionPhotos}
            createdAt={inspection?.createdAt}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-component to switch between different document body types
function PreviewContent({ activeDoc, cp, h, blocks, totals, blockRange, isEditing, inspectionPhotos, createdAt }: any) {
  return (
    <>
      {activeDoc !== 'inspection-report' && (
        <InvoiceHeader
          cp={cp}
          h={h}
          title={
            activeDoc === 'gross-packing' ? 'GROSS PACKING LIST' :
              activeDoc === 'net-packing' ? 'NET PACKING LIST' :
                activeDoc === 'gross-invoice' ? 'GROSS PROFORMA INVOICE' :
                  'NET PROFORMA INVOICE'
          }
        />
      )}
 
      {activeDoc === 'inspection-report' && (
        <NormalReportBody
          blocks={blocks}
          h={h}
          cp={cp}
          inspectionPhotos={inspectionPhotos}
          createdAt={createdAt}
        />
      )}


      {(activeDoc === 'gross-packing' || activeDoc === 'net-packing') && (
        <PackingListBody
          blocks={blocks}
          type={activeDoc === 'gross-packing' ? 'gross' : 'net'}
          h={h}
          cp={cp}
          totals={totals}
        />
      )}

      {(activeDoc === 'gross-invoice' || activeDoc === 'net-invoice') && (
        <InvoiceBody
          blocks={blocks}
          type={activeDoc === 'gross-invoice' ? 'gross' : 'net'}
          h={h}
          cp={cp}
          totals={totals}
        />
      )}
    </>
  );
}

function DocumentEditor({ h, cp, blocks, onHeaderChange, onProfileChange, onBlocksChange }: { 
  h: InspectionHeader, 
  cp: CompanyProfile, 
  blocks: Block[],
  onHeaderChange: (h: any) => void, 
  onProfileChange: (p: any) => void,
  onBlocksChange: (blocks: Block[]) => void
}) {
  const customers = useInspectionStore((s) => s.customers);
  const fetchCustomers = useInspectionStore((s) => s.fetchCustomersFromDb);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const updateH = (key: keyof InspectionHeader, value: any) => {
    onHeaderChange({ ...h, [key]: value });
  };

  const updateCp = (key: keyof CompanyProfile, value: any) => {
    onProfileChange({ ...cp, [key]: value });
  };

  const loadFromCustomer = (customer: Customer) => {
    onHeaderChange({
      ...h,
      consignee: customer.name,
      consigneeAddress: customer.address,
      consigneePhone: customer.phone,
      hsCode: customer.defaultHsCode || h.hsCode,
      portOfDischarge: customer.defaultPortOfDischarge || h.portOfDischarge,
      finalDestination: customer.defaultFinalDestination || h.finalDestination,
      finalDestinationCountry: customer.defaultFinalDestinationCountry || h.finalDestinationCountry,
      termsOfDelivery: customer.defaultTermsOfDelivery || h.termsOfDelivery,
      termsOfPayment: customer.defaultTermsOfPayment || h.termsOfPayment,
      currency: customer.defaultCurrency || h.currency,
    });
  };

  return (
    <Card className="flex-1 overflow-hidden flex flex-col glass-panel border-none shadow-none rounded-xl">
      <Tabs defaultValue="blocks" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-border flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="blocks" className="text-[10px] px-3 py-1.5 h-auto uppercase font-bold tracking-wider">Blocks</TabsTrigger>
            <TabsTrigger value="header" className="text-[10px] px-3 py-1.5 h-auto uppercase font-bold tracking-wider">Header</TabsTrigger>
            <TabsTrigger value="exporter" className="text-[10px] px-3 py-1.5 h-auto uppercase font-bold tracking-wider">Exporter</TabsTrigger>
          </TabsList>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-2 uppercase font-bold tracking-wider border-primary/30 text-primary">
                <Search className="h-3 w-3" /> Load Customer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {customers.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => loadFromCustomer(c)} className="text-[10px] font-medium">
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="blocks" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3 pb-4">
              {blocks.map((block, idx) => (
                <div key={block.id} className="p-3 border rounded-lg bg-card/50 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Block #{block.blockNo}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Length (L1)</Label>
                      <Input 
                        type="number" 
                        value={block.l1} 
                        onChange={(e) => {
                          const newBlocks = [...blocks];
                          newBlocks[idx] = buildBlock(block.id, block.blockNo, parseInt(e.target.value) || 0, block.l2, block.l3, h, block.remarks, undefined, block.type, block.pricePerCbm, block.photoUrl, block.photoUrls, block.photoRotations, block.date);
                          onBlocksChange(newBlocks);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Height (L2)</Label>
                      <Input 
                        type="number" 
                        value={block.l2} 
                        onChange={(e) => {
                          const newBlocks = [...blocks];
                          newBlocks[idx] = buildBlock(block.id, block.blockNo, block.l1, parseInt(e.target.value) || 0, block.l3, h, block.remarks, undefined, block.type, block.pricePerCbm, block.photoUrl, block.photoUrls, block.photoRotations, block.date);
                          onBlocksChange(newBlocks);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Width (L3)</Label>
                      <Input 
                        type="number" 
                        value={block.l3} 
                        onChange={(e) => {
                          const newBlocks = [...blocks];
                          newBlocks[idx] = buildBlock(block.id, block.blockNo, block.l1, block.l2, parseInt(e.target.value) || 0, h, block.remarks, undefined, block.type, block.pricePerCbm, block.photoUrl, block.photoUrls, block.photoRotations, block.date);
                          onBlocksChange(newBlocks);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Remarks</Label>
                    <Input 
                      value={block.remarks || ''} 
                      onChange={(e) => {
                        const newBlocks = [...blocks];
                        newBlocks[idx] = { ...block, remarks: e.target.value };
                        onBlocksChange(newBlocks);
                      }}
                      className="h-8 text-xs italic"
                      placeholder="Add remarks..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t">
                    <div className="flex gap-2">
                      {(h.blockTypes || []).map((preset: any) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            const newBlocks = [...blocks];
                            newBlocks[idx] = buildBlock(block.id, block.blockNo, block.l1, block.l2, block.l3, h, block.remarks, undefined, preset.id, undefined, block.photoUrl, block.photoUrls, block.photoRotations, block.date);
                            onBlocksChange(newBlocks);
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all",
                            block.type === preset.id 
                              ? "bg-primary text-primary-foreground scale-110 shadow-sm" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {preset.name || `T${preset.id}`}
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-green-600">
                      {block.netCbm.toFixed(3)} CBM
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="header" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4 pb-6">
              <section className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-primary border-b pb-1">Customer & Destination</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Consignee Name (Full)</Label>
                      <Input value={h.consignee} onChange={(e) => updateH('consignee', e.target.value)} className="h-8 text-xs font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Consignee Mark / Short Name</Label>
                      <Input value={h.consigneeShort || ''} onChange={(e) => updateH('consigneeShort', e.target.value)} className="h-8 text-xs border-primary/40 bg-primary/5" placeholder="e.g. HL/HLN" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Address</Label>
                    <Textarea value={h.consigneeAddress} onChange={(e) => updateH('consigneeAddress', e.target.value)} className="min-h-[60px] text-xs resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Notify Party</Label>
                      <Input value={h.notifyParty} onChange={(e) => updateH('notifyParty', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Consignee Phone</Label>
                      <Input value={h.consigneePhone} onChange={(e) => updateH('consigneePhone', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Final Destination</Label>
                      <Input value={h.finalDestination} onChange={(e) => updateH('finalDestination', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Country</Label>
                      <Input value={h.finalDestinationCountry} onChange={(e) => updateH('finalDestinationCountry', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-primary border-b pb-1">Stone & Commercial</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Stone Name (Main)</Label>
                      <Input value={h.stoneType} onChange={(e) => updateH('stoneType', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Stone Name (Description)</Label>
                      <Input value={h.stoneDescription || ''} onChange={(e) => updateH('stoneDescription', e.target.value)} className="h-8 text-xs border-primary/40 bg-primary/5" placeholder="e.g. STEEL GREY" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Invoice No</Label>
                    <Input value={h.invoiceNumber} onChange={(e) => updateH('invoiceNumber', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Marks & Nos</Label>
                      <Input value={h.marksAndNos} onChange={(e) => updateH('marksAndNos', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">HS Code</Label>
                      <Input value={h.hsCode} onChange={(e) => updateH('hsCode', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Currency</Label>
                      <Input value={h.currency} onChange={(e) => updateH('currency', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Unit Price / CBM</Label>
                      <Input type="number" value={h.pricePerCbm} onChange={(e) => updateH('pricePerCbm', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Terms of Delivery</Label>
                      <Input value={h.termsOfDelivery} onChange={(e) => updateH('termsOfDelivery', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Terms of Payment</Label>
                      <Input value={h.termsOfPayment} onChange={(e) => updateH('termsOfPayment', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-primary border-b pb-1">Shipment & Details</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Invoice Date</Label>
                      <Input value={h.invoiceDate || ''} onChange={(e) => updateH('invoiceDate', e.target.value)} className="h-8 text-xs font-bold" placeholder="e.g. 20.03.2026" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Exporter Ref No</Label>
                      <Input value={h.exporterRefNumber || ''} onChange={(e) => updateH('exporterRefNumber', e.target.value)} className="h-8 text-xs font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Buyer's Order no & Date</Label>
                    <Input value={h.buyerOrderNoAndDate || ''} onChange={(e) => updateH('buyerOrderNoAndDate', e.target.value)} className="h-8 text-xs font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Vessel</Label>
                      <Input value={h.vessel} onChange={(e) => updateH('vessel', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Port of Loading</Label>
                      <Input value={h.portOfLoading || ''} onChange={(e) => updateH('portOfLoading', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Port of Discharge</Label>
                      <Input value={h.portOfDischarge} onChange={(e) => updateH('portOfDischarge', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Country of Origin</Label>
                      <Input value={h.countryOfOrigin || 'INDIA'} onChange={(e) => updateH('countryOfOrigin', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Pre-Carriage By</Label>
                      <Input value={h.preCarriageBy} onChange={(e) => updateH('preCarriageBy', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Place of Receipt</Label>
                      <Input value={h.placeOfReceipt} onChange={(e) => updateH('placeOfReceipt', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="exporter" className="flex-1 overflow-hidden m-0 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4 pb-6">
              <section className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-secondary border-b pb-1">Exporter Company</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Company Name</Label>
                    <Input value={cp.companyName} onChange={(e) => updateCp('companyName', e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Address</Label>
                    <Textarea value={cp.address} onChange={(e) => updateCp('address', e.target.value)} className="min-h-[60px] text-xs resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Country</Label>
                      <Input value={cp.country} onChange={(e) => updateCp('country', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">LUT Number</Label>
                      <Input value={cp.lutNumber} onChange={(e) => updateCp('lutNumber', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">RBI Code</Label>
                      <Input value={cp.rbiCode} onChange={(e) => updateCp('rbiCode', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">IE Code</Label>
                      <Input value={cp.ieCode} onChange={(e) => updateCp('ieCode', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">GST Number</Label>
                      <Input value={cp.gstNumber} onChange={(e) => updateCp('gstNumber', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-secondary border-b pb-1">Bank Details</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Bank Name</Label>
                      <Input value={cp.bankName} onChange={(e) => updateCp('bankName', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Branch</Label>
                      <Input value={cp.bankBranch} onChange={(e) => updateCp('bankBranch', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Bank Address</Label>
                    <Textarea value={cp.bankAddress} onChange={(e) => updateCp('bankAddress', e.target.value)} className="min-h-[40px] text-xs resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Account Number</Label>
                      <Input value={cp.accountNumber} onChange={(e) => updateCp('accountNumber', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">SWIFT Code</Label>
                      <Input value={cp.swiftCode} onChange={(e) => updateCp('swiftCode', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}


interface InvoiceHeaderProps {
  cp: CompanyProfile;
  h: InspectionHeader;
  title: string;
}

function InvoiceHeader({ cp, h, title }: InvoiceHeaderProps) {
  const cellStyle = { border: '1px solid #000', padding: '4px', verticalAlign: 'top', fontSize: '10px' };
  const labelStyle = { fontWeight: 'bold' as const, fontSize: '10px', marginBottom: '2px' };
  const valueStyle = { fontSize: '10px' };
  const valueValueStyle = { fontSize: '10px', fontWeight: 'bold' };

  return (
    <div className="mb-0">
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={4} style={{ ...cellStyle, textAlign: 'center', borderBottom: '1px solid #000', padding: '6px' }}>
              <div className="font-bold text-[12px] uppercase underline">{title.includes('INVOICE') ? 'PROFORMA INVOICE' : 'PACKING LIST'}</div>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle }} colSpan={2} rowSpan={3}>
              <div style={labelStyle}>Exporter</div>
              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{cp.companyName}</div>
              <div style={{ whiteSpace: 'pre-wrap', ...valueStyle }}>{cp.address}</div>
              <div style={valueStyle}>{cp.country}</div>
            </td>
            <td style={{ ...cellStyle }}>
              <div style={labelStyle}>Invoice no & Date</div>
              <div style={valueStyle}>{h.invoiceNumber ? `${h.invoiceNumber} / Dtd: ${h.invoiceDate || new Date().toLocaleDateString('en-GB')}` : ''}</div>
            </td>
            <td style={{ ...cellStyle }}>
              <div style={labelStyle}>Exporter Ref No:</div>
              <div style={valueStyle}>{h.exporterRefNumber}</div>
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              <div style={labelStyle}>Buyer's Order no & Date</div>
              <div style={valueStyle}>{h.buyerOrderNoAndDate}</div>
            </td>
          </tr>
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Other References</div>
              {cp.otherReferences && cp.otherReferences.length > 0 ? (
                cp.otherReferences.map((ref: string, idx: number) => (
                  <div key={idx} style={valueStyle}>{ref}</div>
                ))
              ) : (
                <>
                  {cp.rbiCode && <div style={valueStyle}>RBI CODE NO: {cp.rbiCode}</div>}
                  {cp.ieCode && <div style={valueStyle}>IE CODE NO : {cp.ieCode}</div>}
                  {cp.gstNumber && <div style={valueStyle}>GST NO: {cp.gstNumber}</div>}
                </>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>HS CODE:</div>
              <div style={valueStyle}>{h.hsCode}</div>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle }} colSpan={2}>
              <div style={labelStyle}>Consignee</div>
              <div style={{ fontWeight: 'bold', ...valueStyle }}>{h.consignee}</div>
              <div style={{ whiteSpace: 'pre-wrap', ...valueStyle }}>{h.consigneeAddress}</div>
              {h.consigneePhone && <div style={valueValueStyle}>TEL NO: {h.consigneePhone}</div>}
            </td>
            <td style={{ ...cellStyle }} colSpan={2}>
              <div style={labelStyle}>{title.includes('PACKING') ? 'Buyer if other than consignee' : 'NOTIFY PARTY'}</div>
              <div style={{ minHeight: '60px', whiteSpace: 'pre-wrap', ...valueStyle }}>{h.notifyParty}</div>
            </td>
          </tr>
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Pre-Carriage by</div>
              <div style={valueStyle}>{h.preCarriageBy}</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Place of Receipt by Pre-Carrier</div>
              <div style={valueStyle}>{h.placeOfReceipt}</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Country of origin of goods</div>
              <div style={valueStyle}>{h.countryOfOrigin || cp.country || 'INDIA'}</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Country of Final Destination</div>
              <div style={valueStyle}>{h.finalDestinationCountry}</div>
            </td>
          </tr>
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Vessel/Flight No</div>
              <div style={valueStyle}>{h.vessel}</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Port of Loading</div>
              <div style={valueStyle}>{h.portOfLoading || cp.defaultPortOfLoading}</div>
            </td>
            <td style={{ ...cellStyle, borderBottom: 'none' }} colSpan={2} rowSpan={2}>
              <div style={labelStyle}>Terms of Delivery and Payment</div>
              <div style={{ ...valueStyle, minHeight: '40px' }}>
                {h.termsOfDelivery} {h.portOfLoading || cp.defaultPortOfLoading} {h.finalDestinationCountry} <br />
                {h.termsOfPayment}
              </div>
            </td>
          </tr>
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Port of Discharge</div>
              <div style={valueStyle}>{h.portOfDischarge}</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Final destination</div>
              <div style={valueStyle}>{h.finalDestination}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PackingListBody({ blocks, type, h, cp, totals }: { blocks: any[]; type: 'gross' | 'net'; h: any; cp: any; totals: any }) {
  const cellStyle = { border: '1px solid #000', padding: '4px', verticalAlign: 'top', fontSize: '10px' };
  const headerStyle = { ...cellStyle, fontWeight: 'bold' as const, textAlign: 'center' as const };

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', borderTop: 'none', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...headerStyle }}>Marks & Nos/ No & Kind if Pkgs Description of Goods</th>
            <th style={{ ...headerStyle }}>Quantity<br />CBM</th>
            <th style={{ ...headerStyle }}>Weight in MT</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: '400px', verticalAlign: 'top' }}>
            <td style={{ ...cellStyle }}>
              <div style={{ fontWeight: 'bold' }}>ROUGH GRANITE BLOCKS</div>
              <div style={{ fontWeight: 'bold' }}>{h.stoneDescription || h.stoneType}</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{h.consigneeShort || h.consignee}</div>

              <div className='flex flex-col gap-1 mt-4'>
                {blocks.map((b) => (
                  <div key={b.id} className="flex flex-col mb-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Block No.{h.marksAndNos ? `${h.marksAndNos}-` : ''}{String(b.blockNo).padStart(3, '0') || b.blockNo}</span>
                      <span>-</span>
                      <div className="w-[140px] flex justify-between px-2">
                        <span>{b.l1}</span> x <span>{b.l2}</span> x <span>{b.l3}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>
              <div style={{ marginTop: '50px' }}></div>
              <div className='flex flex-col gap-1 mt-4'>
                {blocks.map((b) => (
                  <div key={b.id} className="font-mono text-[10px]">
                    {type === 'gross' ? b.grossCbm.toFixed(3) : b.netCbm.toFixed(3)}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>
              <div style={{ marginTop: '50px' }}></div>
              <div className='flex flex-col gap-1 mt-4'>
                {/* Empty weight column */}
              </div>
            </td>
          </tr>

          {/* Totals fixed at bottom */}
          <tr className="font-bold">
            <td style={{ ...cellStyle }}>
              TOTAL CBM: {type === 'gross' ? totals.totalGrossCbm.toFixed(3) : totals.totalNetCbm.toFixed(3)} <br />
              TOTAL NO OF BLOCKS : {blocks.length}
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'bottom' }}>
              {type === 'gross' ? totals.totalGrossCbm.toFixed(3) : totals.totalNetCbm.toFixed(3)}
            </td>
            <td style={{ ...cellStyle }}></td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, width: '50%', borderRight: '1px solid black' }}>
              {/* Empty left column to match invoice layout structure */}
            </td>
            <td style={{ ...cellStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Signature and Date</div>
              <div style={{ marginTop: '20px', color: '#1a365d', fontWeight: 'bold', fontSize: '14px' }}>{cp.companyName}</div>

              <div style={{ height: '40px', margin: '10px 0', position: 'relative' }}>
                {/* Signature Image Placeholder */}
              </div>

              <div style={{ textAlign: 'right', paddingRight: '20px', fontWeight: 'bold' }}>Partner</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function InvoiceBody({ blocks, type, h, cp, totals }: { blocks: any[]; type: 'gross' | 'net'; h: any; cp: any; totals: any }) {
  const groupedRows = React.useMemo(() => {
    const groups: any[] = [];
    let currentGroup: any = null;
    const isSameKind = (b1: any, b2: any) => 
      b1.pricePerCbm === b2.pricePerCbm && b1.type === b2.type;

    blocks.forEach((b) => {
      if (!currentGroup || !isSameKind(currentGroup.blocks[0], b)) {
        currentGroup = {
          price: b.pricePerCbm,
          type: b.type,
          blocks: [b]
        };
        groups.push(currentGroup);
      } else {
        const lastBlock = currentGroup.blocks[currentGroup.blocks.length - 1];
        if (Number(b.blockNo) === Number(lastBlock.blockNo) + 1) {
          currentGroup.blocks.push(b);
        } else {
          currentGroup = {
            price: b.pricePerCbm,
            type: b.type,
            blocks: [b]
          };
          groups.push(currentGroup);
        }
      }
    });

    return groups.map(g => {
      const range = groupBlocksToSummaries(g.blocks, h.marksAndNos);
      const qty = g.blocks.reduce((acc: any, b: any) => acc + (type === 'gross' ? b.grossCbm : b.netCbm), 0);
      const rate = g.price;
      const amount = qty * rate;
      return { range, qty, rate, amount };
    });
  }, [blocks, type, h.marksAndNos]);

  const cellStyle = { border: '1px solid #000', padding: '4px', verticalAlign: 'top', fontSize: '10px' };
  const headerStyle = { ...cellStyle, fontWeight: 'bold' as const, textAlign: 'center' as const };
  const labelStyle = { fontWeight: 'bold' as const, fontSize: '10px', marginBottom: '2px' };

  return (
    <div className='flex flex-col h-full'>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', flex: 1, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...headerStyle }}>Marks & Nos/ No & Kind if Pkgs Description of Goods</th>
            <th style={{ ...headerStyle }}>Quantity<br />CBM</th>
            <th style={{ ...headerStyle }}>Rate<br />{h.currency}/CBM</th>
            <th style={{ ...headerStyle }}>Amount<br />{h.currency}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderBottom: 'none', paddingBottom: '0px' }}>
              <div className="font-bold underline text-[11px] uppercase">ROUGH GRANITE BLOCKS</div>
              <div className="font-bold text-[10px] uppercase">{h.stoneDescription || h.stoneType}</div>
              <div className="font-bold text-[10px] uppercase">SHIPPING MARK: {h.marksAndNos}</div>
            </td>
            <td style={{ ...cellStyle, borderBottom: 'none' }}></td>
            <td style={{ ...cellStyle, borderBottom: 'none' }}></td>
            <td style={{ ...cellStyle, borderBottom: 'none' }}></td>
          </tr>

          <tr style={{ height: '350px', verticalAlign: 'top' }}>
            <td style={{ ...cellStyle, borderTop: 'none', position: 'relative' }}>
              <div className="space-y-3 mt-8">
                {groupedRows.map((row, idx) => (
                  <div key={idx} className="font-bold text-[10px] uppercase">
                    BLOCK NO: {row.range}
                  </div>
                ))}
              </div>

              <div className="absolute bottom-4 left-4" style={{ fontSize: '9px' }}>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>BANK DETAILS :</div>
                <div style={{ fontWeight: 'bold' }}>{cp.bankName}</div>
                <div style={{ fontWeight: 'bold' }}>{cp.bankBranch}</div>
                <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{cp.bankAddress}</div>
                <div style={{ fontWeight: 'bold' }}>ACCOUNT:{cp.companyName}</div>
                <div style={{ fontWeight: 'bold' }}>A/C.NO.{cp.accountNumber}</div>
                <div style={{ fontWeight: 'bold' }}>SWIFT: {cp.swiftCode}</div>
              </div>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', borderTop: 'none', paddingTop: '40px' }}>
               <div className="space-y-3">
                  {groupedRows.map((row, idx) => (
                    <div key={idx} className="font-bold">{row.qty.toFixed(3)}</div>
                  ))}
               </div>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', borderTop: 'none', paddingTop: '40px' }}>
               <div className="space-y-3">
                  {groupedRows.map((row, idx) => (
                    <div key={idx} className="font-bold">{row.rate.toFixed(2)}</div>
                  ))}
               </div>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', borderTop: 'none', paddingTop: '40px' }}>
               <div className="space-y-3">
                  {groupedRows.map((row, idx) => (
                    <div key={idx} className="font-bold">{(row.qty * row.rate).toFixed(2)}</div>
                  ))}
               </div>
            </td>
          </tr>

          <tr style={{ fontWeight: '900', fontSize: '11px' }}>
            <td style={{ ...cellStyle, textTransform: 'uppercase' }}>
              TOTAL NO OF BLOCKS: {blocks.length}
            </td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>
              {(type === 'gross' ? totals.totalGrossCbm : totals.totalNetCbm).toFixed(3)}
            </td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>Total</td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>
              {(type === 'gross' ? totals.totalGrossCbm * (h.pricePerCbm || 0) : totals.totalValue).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ border: '1px solid black', borderTop: 'none', padding: '4px', fontSize: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Amount Chargeable (in Words)</div>
        <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          {h.currency} {numberToWords(type === 'gross' ? totals.totalGrossCbm * (h.pricePerCbm || 0) : totals.totalValue).toUpperCase()}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, width: '50%', borderRight: '1px solid black' }}>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Declaration</div>
              <div style={{ fontSize: '9px' }}>We declare that this invoice shows the actual price of the goods.</div>
              <div style={{ fontSize: '9px' }}>Described and that all particulars are true and correct.</div>
            </td>
            <td style={{ ...cellStyle, width: '50%' }}>
              <div style={labelStyle}>Signature and Date</div>
              <div style={{ height: '70px' }}></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function groupBlocksToSummaries(blocks: any[], marks: string) {
  if (!blocks.length) return "";
  const sorted = [...blocks].sort((a, b) => Number(a.blockNo) - Number(b.blockNo));
  const ranges: string[] = [];
  let start = sorted[0].blockNo;
  let prev = sorted[0].blockNo;

  const fmt = (no: any) => marks ? `${marks}- ${no}` : no;

  for (let i = 1; i <= sorted.length; i++) {
    const curr = sorted[i]?.blockNo;
    if (curr !== prev + 1 || i === sorted.length) {
      if (start === prev) {
        ranges.push(fmt(start));
      } else {
        ranges.push(`${fmt(start)} to ${fmt(prev)}`);
      }
      start = curr;
    }
    prev = curr;
  }
  return ranges.join(", ");
}

function PaginatedAbstract({ h, cp, blocks, createdAt, compactCellStyle, compactHeaderStyle }: any) {
  const items: any[] = [];
  h.blockTypes?.forEach((typePreset: any) => {
    const typeBlocks = blocks.filter((b: any) => (b.type === typePreset.id || (!b.type && typePreset.id === '1')));
    if (typeBlocks.length > 0) {
      const typeTotalCbm = typeBlocks.reduce((acc: any, b: any) => acc + (b.netCbm || 0), 0);
      items.push({ kind: 'type-title', preset: typePreset });
      typeBlocks.forEach((b: any, bIdx: number) => {
        items.push({ kind: 'row', block: b, bIdx, preset: typePreset });
      });
      items.push({ kind: 'type-total', preset: typePreset, count: typeBlocks.length, total: typeTotalCbm });
    }
  });

  const grandTotalCbm = blocks.reduce((acc: any, b: any) => acc + (b.netCbm || 0), 0);
  items.push({ kind: 'grand-total', count: blocks.length, total: grandTotalCbm });

  if (h.enableEndToEnd) {
    items.push({ kind: 'e2e-title' });
    blocks.forEach((b: any, bIdx: number) => {
      items.push({ kind: 'e2e-row', block: b, bIdx });
    });
    const totalGrossCbm = blocks.reduce((acc: any, b: any) => acc + ((b.l1EndToEnd || b.l1) * (b.l2EndToEnd || b.l2) * (b.l3EndToEnd || b.l3)) / 1000000, 0);
    items.push({ kind: 'e2e-total', count: blocks.length, total: totalGrossCbm });
  }

  items.push({ kind: 'signature' });

  const pages: any[][] = [];
  let currentPage: any[] = [];
  let linesCount = 0;
  const FIRST_PAGE_MAX = 18;
  const OTHER_PAGE_MAX = 28;

  items.forEach((item) => {
    let cost = 1;
    if (item.kind === 'type-title' || item.kind === 'e2e-title') cost = 3; // Title + Table Header
    if (item.kind === 'type-total' || item.kind === 'e2e-total') cost = 2;
    if (item.kind === 'signature') cost = 6;

    const limit = pages.length === 0 ? FIRST_PAGE_MAX : OTHER_PAGE_MAX;

    // Force separate page for ETE if requested
    if (item.kind === 'e2e-title' && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      linesCount = 0;
    } else if (linesCount + cost > limit) {
      pages.push(currentPage);
      currentPage = [];
      linesCount = 0;
      // If we split a table, we should re-add the header on the next page
      if (item.kind === 'row') {
        currentPage.push({ kind: 'type-title-cont', preset: item.preset });
        linesCount += 2;
      }
      if (item.kind === 'e2e-row') {
        currentPage.push({ kind: 'e2e-title-cont' });
        linesCount += 2;
      }
    }
    
    currentPage.push(item);
    linesCount += cost;
  });
  if (currentPage.length > 0) pages.push(currentPage);

  return (
    <>
      {pages.map((pageItems, pIdx) => (
        <div key={pIdx} className="bg-white text-black p-[5mm] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[210mm] min-h-[297mm] relative border border-zinc-100 print:shadow-none print:m-0 page-break flex flex-col items-center justify-start pt-2">
          <div className="border-[3pt] border-black w-full flex-1 bg-white p-4 flex flex-col">
            {/* Header only on first page */}
            {pIdx === 0 && (
              <>
                <div className="flex justify-end mb-2">
                  <div className="text-[10pt] font-black uppercase tracking-widest text-[#1a365d]">
                    DATE: {createdAt ? new Date(createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>
                
                <div className="flex flex-col items-center border-b-[3pt] border-black pb-4 mb-6 text-center">
                  <h2 className="text-[20pt] font-[1000] uppercase tracking-[0.15em] text-[#1a365d] mb-1">DAKSHIN EXPORTS</h2>
                  <h3 className="text-[9pt] font-black uppercase tracking-[0.3em] text-zinc-400 mb-3">{cp.companyName}</h3>
                  <h1 className="text-2xl font-[1000] text-black leading-none uppercase tracking-tighter">
                    Inspection Report - Abstract
                  </h1>
                </div>

                <div className="px-4 mb-4 flex gap-6 justify-center flex-wrap">
                  {(h.blockTypes || []).map((type: any) => (
                    <div key={type.id} className="text-[10pt] font-black uppercase text-[#1a365d] flex items-center gap-2">
                      <span className="bg-[#1a365d] text-white px-2 py-0.5 rounded text-[7pt]">{type.name || `TYPE ${type.id}`}</span>
                      <span>=</span>
                      <span className="text-[#1a365d] font-bold italic">{type.allowance} CM</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {pIdx > 0 && (
               <div className="flex justify-between items-center border-b-2 border-zinc-100 pb-2 mb-4">
                  <span className="text-[10pt] font-black text-[#1a365d] uppercase tracking-widest">Inspection Report - Abstract (Cont.)</span>
                  <span className="text-[8pt] font-bold text-zinc-400">PAGE {pIdx + 1}</span>
               </div>
            )}

            <div className="px-4 flex-1 space-y-4">
              {renderPageTable(pageItems, compactCellStyle, compactHeaderStyle, cp)}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function renderPageTable(items: any[], compactCellStyle: any, compactHeaderStyle: any, cp: any) {
  const result: any[] = [];
  let currentTable: any[] = [];
  let currentPreset: any = null;

  items.forEach((item, idx) => {
    if (item.kind === 'type-title' || item.kind === 'type-title-cont') {
       if (currentTable.length > 0) {
          result.push(renderActualTable(currentTable, currentPreset, compactCellStyle, compactHeaderStyle));
          currentTable = [];
       }
       result.push(
          <div key={`title-${idx}`} className="flex items-center gap-4 mt-6 first:mt-0 mb-2">
            <div className="bg-[#1a365d] text-white px-4 py-1.5 font-black uppercase tracking-[0.2em] text-[10pt] border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              {(item.preset.name || `TYPE ${item.preset.id}`).toUpperCase()} BLOCKS {item.kind === 'type-title-cont' && '(CONT.)'}
            </div>
            <div className="h-[2pt] flex-1 bg-black"></div>
          </div>
       );
       currentPreset = item.preset;
    } else if (item.kind === 'row') {
       currentTable.push(item);
       currentPreset = item.preset;
    } else if (item.kind === 'type-total') {
       if (currentTable.length > 0) {
          result.push(renderActualTable(currentTable, currentPreset, compactCellStyle, compactHeaderStyle, item));
          currentTable = [];
       } else {
          // Total only
          result.push(renderActualTable([], currentPreset, compactCellStyle, compactHeaderStyle, item));
       }
    } else if (item.kind === 'grand-total') {
       result.push(
          <React.Fragment key={`grand-${idx}`}>
            <div className="mt-8 pt-4 border-t-2 border-black">
               <table style={{ width: '100%', borderCollapse: 'collapse', border: '3pt solid black' }}>
                  <tbody>
                     <tr style={{ background: '#1a365d', color: '#fff', fontSize: '14pt' }}>
                        <td style={{ padding: '12px', fontWeight: '900', textAlign: 'right', width: '70%', textTransform: 'uppercase' }}>GRAND TOTAL ({String(item.count).padStart(2, '0')} BLOCKS):</td>
                        <td style={{ padding: '12px', fontWeight: '900', textAlign: 'center', background: '#fff', color: '#1a365d', borderLeft: '3pt solid black' }}>{item.total.toFixed(3)} m³</td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </React.Fragment>
       );
    } else if (item.kind === 'signature') {
       result.push(
          <div key={`sig-${idx}`} className="mt-12 pt-8" style={{ pageBreakInside: 'avoid' }}>
            <div className="flex justify-between items-end px-4">
              <div className="space-y-4">
                 <p className="text-[10px] font-bold text-zinc-400 uppercase italic max-w-[400px]">
                    * This report serves as an official inspection document generated via Dakshin Scanner App. 
                    All measurements are net values after allowances.
                 </p>
              </div>
              <div className="text-right">
                <div style={{ color: '#1a365d' }} className="font-black uppercase text-xl border-b-2 border-black pb-1 mb-4 flex flex-col items-end">
                   <span className="text-[10px] text-zinc-400 font-bold mb-1">FOR</span>
                   {cp.companyName}
                </div>
                <p className="font-black italic text-[10px] uppercase tracking-widest">Authorized Inspection Signatory</p>
              </div>
            </div>
          </div>
       );
    } else if (item.kind === 'e2e-title' || item.kind === 'e2e-title-cont') {
       if (currentTable.length > 0) {
          if (currentPreset) {
            result.push(renderActualTable(currentTable, currentPreset, compactCellStyle, compactHeaderStyle));
          } else {
            result.push(renderActualEndToEndTable(currentTable.map(r => r.block), compactCellStyle, compactHeaderStyle));
          }
          currentTable = [];
       }
       result.push(
          <div key={`e2e-title-${idx}`} className="flex items-center gap-4 mt-8 first:mt-0 mb-3">
            <div className="bg-[#1a365d] text-white px-4 py-1.5 font-black uppercase tracking-[0.2em] text-[10pt] border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
              END TO END MEASUREMENT OF BLOCKS {item.kind === 'e2e-title-cont' && '(CONT.)'}
            </div>
            <div className="h-[2pt] flex-1 bg-black"></div>
          </div>
       );
       currentPreset = null;
    } else if (item.kind === 'e2e-row') {
       currentTable.push(item);
       currentPreset = null;
    } else if (item.kind === 'e2e-total') {
       if (currentTable.length > 0) {
          result.push(renderActualEndToEndTable(currentTable.map(r => r.block), compactCellStyle, compactHeaderStyle, item));
          currentTable = [];
       } else {
          result.push(renderActualEndToEndTable([], compactCellStyle, compactHeaderStyle, item));
       }
    } else if (item.kind === 'end-to-end-table') {
       result.push(renderActualEndToEndTable(item.blocks, compactCellStyle, compactHeaderStyle));
    }
  });

  if (currentTable.length > 0) {
     if (currentPreset) {
        result.push(renderActualTable(currentTable, currentPreset, compactCellStyle, compactHeaderStyle));
     } else {
        result.push(renderActualEndToEndTable(currentTable.map(r => r.block), compactCellStyle, compactHeaderStyle));
     }
  }

  return result;
}

function renderActualTable(rows: any[], preset: any, compactCellStyle: any, compactHeaderStyle: any, totalItem?: any) {
   return (
    <table key={preset?.id + (rows[0]?.kind || '')} style={{ width: '100%', borderCollapse: 'collapse', border: '2pt solid black' }} className="mb-4">
      <thead>
        <tr style={{ background: '#1a365d', color: '#fff' }}>
          <th style={{ ...compactHeaderStyle, width: '10%', color: '#fff', background: '#1a365d' }}>SR NO</th>
          <th style={{ ...compactHeaderStyle, width: '20%', color: '#fff', background: '#1a365d' }}>BLOCK NO</th>
          <th style={{ ...compactHeaderStyle, width: '30%', color: '#fff', background: '#1a365d' }}>NET MEASUREMENT (CM)</th>
          <th style={{ ...compactHeaderStyle, width: '20%', color: '#fff', background: '#1a365d' }}>ALLOWANCE</th>
          <th style={{ ...compactHeaderStyle, width: '20%', color: '#fff', background: '#1a365d' }}>NET CBM</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => {
          const allow = r.block.allowance !== undefined ? r.block.allowance : (r.preset?.allowance || 0);
          return (
            <tr key={r.block.id} style={{ background: r.bIdx % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ ...compactCellStyle }}>{r.bIdx + 1}</td>
              <td style={{ ...compactCellStyle, fontWeight: 'bold' }}>{String(r.block.blockNo).padStart(3, '0')}</td>
              <td style={{ ...compactCellStyle }}>{Math.max(r.block.l1 - allow, 0)} × {Math.max(r.block.l2 - allow, 0)} × {Math.max(r.block.l3 - allow, 0)}</td>
              <td style={{ ...compactCellStyle, color: '#1a365d', fontWeight: 'bold' }}>{allow} cm</td>
              <td style={{ ...compactCellStyle, fontWeight: '900' }}>{Number(r.block.netCbm || 0).toFixed(3)}</td>
            </tr>
          );
        })}
        {totalItem && (
          <tr style={{ background: '#f1f5f9', fontWeight: '900', borderTop: '2.5pt solid black' }}>
            <td colSpan={4} style={{ ...compactCellStyle, textAlign: 'right', paddingRight: '24px', color: '#1a365d', textTransform: 'uppercase' }}>
              {totalItem.preset.name || `TYPE ${totalItem.preset.id}`} TOTAL ({String(totalItem.count).padStart(2, '0')} BLOCKS):
            </td>
            <td style={{ ...compactCellStyle, fontSize: '11pt', color: '#1a365d', background: '#e2e8f0' }}>{totalItem.total.toFixed(3)}</td>
          </tr>
        )}
      </tbody>
    </table>
   );
}

function renderActualEndToEndTable(blocks: any[], compactCellStyle: any, compactHeaderStyle: any, totalItem?: any) {
  return (
    <table key="e2e-table-actual" style={{ width: '100%', borderCollapse: 'collapse', border: '2pt solid black' }} className="mb-4">
      <thead>
        <tr style={{ background: '#1a365d', color: '#fff' }}>
          <th style={{ ...compactHeaderStyle, width: '10%', color: '#fff', background: '#1a365d' }}>SR NO</th>
          <th style={{ ...compactHeaderStyle, width: '15%', color: '#fff', background: '#1a365d' }}>BLOCK NO</th>
          <th style={{ ...compactHeaderStyle, width: '25%', color: '#fff', background: '#1a365d' }}>PHYSICAL DIMS (CM)</th>
          <th style={{ ...compactHeaderStyle, width: '20%', color: '#fff', background: '#1a365d' }}>PHYSICAL CBM</th>
          <th style={{ ...compactHeaderStyle, width: '30%', color: '#fff', background: '#1a365d' }}>DEFECTS / REMARKS</th>
        </tr>
      </thead>
      <tbody>
        {blocks.map((b: any, idx: number) => {
          const l1 = b.l1EndToEnd || b.l1;
          const l2 = b.l2EndToEnd || b.l2;
          const l3 = b.l3EndToEnd || b.l3;
          const physicalCbm = (l1 * l2 * l3) / 1000000;
          
          return (
            <tr key={b.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ ...compactCellStyle }}>{idx + 1}</td>
              <td style={{ ...compactCellStyle, fontWeight: 'bold' }}>{String(b.blockNo).padStart(3, '0')}</td>
              <td style={{ ...compactCellStyle }}>
                {l1} × {l2} × {l3}
              </td>
              <td style={{ ...compactCellStyle, fontWeight: 'bold', color: '#1a365d' }}>
                {physicalCbm.toFixed(3)}
              </td>
              <td style={{ ...compactCellStyle, textAlign: 'left', fontStyle: 'italic' }}>
                {[b.defectDescription, b.remarks].filter(Boolean).filter(s => s !== '-').join(' / ') || '-'}
              </td>
            </tr>
          );
        })}
        {totalItem && (
          <tr style={{ background: '#f1f5f9', fontWeight: '900', borderTop: '2.5pt solid black' }}>
            <td colSpan={3} style={{ ...compactCellStyle, textAlign: 'right', paddingRight: '24px', color: '#1a365d', textTransform: 'uppercase' }}>
              PHYSICAL DIMENSIONS TOTAL ({String(totalItem.count).padStart(2, '0')} BLOCKS):
            </td>
            <td style={{ ...compactCellStyle, fontSize: '11pt', color: '#1a365d', background: '#e2e8f0' }}>{totalItem.total.toFixed(3)}</td>
            <td style={{ ...compactCellStyle, background: '#f1f5f9' }}></td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function NormalReportBody({ blocks, cp, h, inspectionPhotos, createdAt }: any) {
  const cellStyle = { 
    border: '1.5pt solid #333', 
    padding: '10px 8px', 
    verticalAlign: 'middle', 
    textAlign: 'center' as const, 
    fontSize: '11pt',
    color: '#000'
  };
  const compactCellStyle = {
    ...cellStyle,
    padding: '4px 6px',
    fontSize: '9.5pt'
  };
  const headerStyle = { 
    ...cellStyle, 
    fontWeight: '900' as const, 
    background: '#f0f9ff', 
    textTransform: 'uppercase' as const,
    fontSize: '9pt',
    letterSpacing: '0.1em',
    color: '#0369a1'
  };
  const compactHeaderStyle = {
    ...headerStyle,
    padding: '6px 4px',
    fontSize: '8pt'
  };

  const totalCbm = blocks.reduce((acc: any, b: any) => acc + (b.netCbm || 0), 0);

  return (
    <div className="flex flex-col items-center gap-12 py-12">
      {/* PAGES: SUMMARY ABSTRACT SHEETS (Paginated) */}
      <PaginatedAbstract 
        h={h} 
        cp={cp} 
        blocks={blocks} 
        createdAt={createdAt} 
        compactCellStyle={compactCellStyle} 
        compactHeaderStyle={compactHeaderStyle} 
      />
      {blocks.map((b: any, idx: number) => {
        const preset = h.blockTypes?.find((p: any) => p.id === b.type) || h.blockTypes?.[0];
        const allowance = b.allowance !== undefined ? b.allowance : (preset?.allowance || 0);
        const photos = [...(b.photoUrl ? [b.photoUrl] : []), ...(b.photoUrls || [])];

        return (
          <React.Fragment key={b.id}>
            {/* SHEET 1: HEADER (if first) + TABLE + REMARKS */}
            <div className="bg-white text-black p-[5mm] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[210mm] min-h-[297mm] relative overflow-hidden border border-zinc-100 print:shadow-none print:m-0 page-break flex flex-col items-center justify-center">
              <div className="border-[3pt] border-black w-full flex-1 bg-white p-4 flex flex-col">


                {/* Measurement Table */}
                <div className="px-4 mb-8">
                  <div className="bg-white border-2 border-black print:shadow-none shadow-xl overflow-hidden rounded-sm">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th colSpan={6} style={{ ...cellStyle, padding: '15px', fontSize: '20pt', fontWeight: '500', background: '#fff', borderBottom: '3pt solid #000' }}>
                            BLOCK NO : {String(b.blockNo).padStart(3, '0')}
                          </th>
                        </tr>
                        <tr>
                          <th style={{ ...headerStyle, width: '25%', textAlign: 'left' }}>MEASUREMENT</th>
                          <th style={headerStyle}>LENGTH (CM)</th>
                          <th style={headerStyle}>HEIGHT (CM)</th>
                          <th style={headerStyle}>WIDTH (CM)</th>
                          <th style={{ ...headerStyle, background: '#f0f9ff', color: '#1a365d' }}>ALLOWANCE</th>
                          <th style={{ ...headerStyle, background: '#1a365d', color: '#fff' }}>NET CBM</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'left', background: '#fafafa' }}>GROSS</td>
                          <td style={cellStyle}>{b.l1}</td>
                          <td style={cellStyle}>{b.l2}</td>
                          <td style={cellStyle}>{b.l3}</td>
                          <td rowSpan={2} style={{ ...cellStyle, fontWeight: '900', color: '#1a365d', background: '#f0f9ff', fontSize: '14pt' }}>{allowance} CM</td>
                          <td style={{ ...cellStyle, background: '#fafafa' }}>{((b.l1 * b.l2 * b.l3) / 1000000).toFixed(3)}</td>
                        </tr>
                        <tr style={{ background: '#f0fdf4' }}>
                          <td style={{ ...cellStyle, fontWeight: '900', textAlign: 'left', color: '#166534' }}>
                            NET
                          </td>
                          <td style={{ ...cellStyle, color: '#166534', fontWeight: '900' }}>{Math.max(b.l1 - allowance, 0)}</td>
                          <td style={{ ...cellStyle, color: '#166534', fontWeight: '900' }}>{Math.max(b.l2 - allowance, 0)}</td>
                          <td style={{ ...cellStyle, color: '#166534', fontWeight: '900' }}>{Math.max(b.l3 - allowance, 0)}</td>
                          <td style={{ ...cellStyle, color: '#166534', fontWeight: '900', fontSize: '16pt' }}>{Number(b.netCbm || 0).toFixed(3)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3D Visualizer Diagrams */}
                <div className="px-4 mb-4">
                  <ObliqueBlockViews length={b.l1} height={b.l2} width={b.l3} />
                </div>

                {/* Inspector Remarks - Always on the Table Sheet */}
                <div className="mt-8 px-4 pb-8">
                  <div style={{ border: '2px solid #000', padding: '12px', backgroundColor: '#fafafa', position: 'relative', minHeight: '60px' }}>
                    <div className="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">Remarks</div>
                    <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>
                      {b.remarks || '-'}
                    </div>
                  </div>
                </div>
            </div>
          </div>


            {/* SUBSEQUENT SHEETS: INDIVIDUAL PHOTOS */}
            {photos.map((url, pIdx) => (
              <div 
                key={`${b.id}-photo-${pIdx}`} 
                className="bg-white text-black p-[5mm] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[210mm] min-h-[297mm] relative overflow-hidden border border-zinc-100 print:shadow-none print:m-0 page-break flex flex-col items-center justify-center"
              >
                <div className="border-[3pt] border-black w-full flex-1 bg-white p-8 flex flex-col items-center">
                   <div className="text-xl font-black uppercase text-[#1a365d] tracking-[0.2em] border-b-2 border-slate-200 pb-2 mb-12 text-center w-full">
                     BLOCK NO : {b.blockNo}/{String.fromCharCode(65 + pIdx)} SIDE
                   </div>
                   
                   <div className="flex-1 flex items-center justify-center w-full">
                      <div 
                         className="border-[3pt] border-black print:shadow-none shadow-2xl bg-white p-[2mm]"
                         style={{ backgroundColor: '#ffffff' }}
                      >
                         <img 
                           src={url} 
                           alt={`Block ${b.blockNo} - Side ${String.fromCharCode(65 + pIdx)}`} 
                           className="block h-auto w-auto max-w-full" 
                           style={{ 
                             maxHeight: '750px', 
                             transform: `rotate(${h.photoRotations?.[url] || 0}deg)`,
                             backgroundColor: '#ffffff'
                           }} 
                         />
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}



