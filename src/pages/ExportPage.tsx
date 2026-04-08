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

type DocType = 'gross-packing' | 'net-packing' | 'gross-invoice' | 'net-invoice' | 'normal-report';

export default function ExportPage() {
  const navigate = useNavigate();
  const inspection = useInspectionStore((s) => s.activeInspection);
  const companyProfile = useInspectionStore((s) => s.companyProfile);
  const updateHeader = useInspectionStore((s) => s.updateHeader);
  const setCompanyProfile = useInspectionStore((s) => s.setCompanyProfile);
  const updateBlocks = useInspectionStore((s) => s.updateBlocks);
  const { toast } = useToast();

  const [activeDoc, setActiveDoc] = React.useState<DocType>('normal-report');
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
        margin: 0; 
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
        margin: 0 auto;
        background: white;
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
    { key: 'normal-report', label: 'Normal Report' },
    { key: 'gross-packing', label: 'G. Packing list' },
    { key: 'net-packing', label: 'N. Packing list' },
    { key: 'gross-invoice', label: 'G. Invoice' },
    { key: 'net-invoice', label: 'N. Invoice' },
  ];

  const h = isEditing && editedHeader ? editedHeader : inspection.header;
  const cp = isEditing && editedProfile ? editedProfile : companyProfile;
  const blocks = inspection.blocks;
  const totals = inspection.totals;
  const blockRange = blocks.length > 0
    ? `${String(blocks[0].blockNo).padStart(3, '0')} TO ${String(blocks[blocks.length - 1].blockNo).padStart(3, '0')}`
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
                      blocks={editedBlocks} 
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
                <div className={cn("border shadow-lg p-2 transition-colors bg-zinc-500/10 rounded-xl")}>
                  <div ref={printRef} className={cn(
                    "bg-white text-black p-[5mm] text-[8px] leading-tight mx-auto shadow-sm print:shadow-none",
                    "w-[210mm] min-h-[297mm]"
                  )}>
                      <PreviewContent 
                        activeDoc={activeDoc} 
                        cp={cp} 
                        h={h} 
                        blocks={blocks} 
                        totals={totals} 
                        blockRange={blockRange} 
                        isEditing={false}
                        inspectionPhotos={inspection?.header.inspectionPhotos}
                      />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* HIDDEN PRINTABLE CONTAINER - Always Paper Formatted */}
      <div className="fixed -left-[10000px] -top-[10000px] pointer-events-none" aria-hidden="true">
        <div ref={printHiddenRef} className={cn(
          "bg-white text-black p-[5mm] text-[8px] leading-tight",
          "w-[210mm]"
        )}>
          <PreviewContent 
            activeDoc={activeDoc} 
            cp={isEditing ? editedProfile : cp} 
            h={isEditing ? editedHeader : h} 
            blocks={isEditing ? editedBlocks : blocks} 
            totals={isEditing ? calcTotals(editedBlocks) : totals} 
            blockRange={blockRange} 
            isEditing={false}
            inspectionPhotos={inspection?.header.inspectionPhotos}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-component to switch between different document body types
function PreviewContent({ activeDoc, cp, h, blocks, totals, blockRange, isEditing, inspectionPhotos }: any) {
  return (
    <>
      {activeDoc !== 'normal-report' && (
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

      {activeDoc === 'normal-report' && (
        <NormalReportBody
          blocks={blocks}
          h={h}
          cp={cp}
          inspectionPhotos={inspectionPhotos}
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
          blockRange={blockRange}
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
                          newBlocks[idx] = buildBlock(block.id, block.blockNo, parseInt(e.target.value) || 0, block.l2, block.l3, h, block.remarks, undefined, block.type, block.pricePerCbm, block.photoUrl, block.photoUrls);
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
                          newBlocks[idx] = buildBlock(block.id, block.blockNo, block.l1, parseInt(e.target.value) || 0, block.l3, h, block.remarks, undefined, block.type, block.pricePerCbm, block.photoUrl, block.photoUrls);
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
                          newBlocks[idx] = buildBlock(block.id, block.blockNo, block.l1, block.l2, parseInt(e.target.value) || 0, h, block.remarks, undefined, block.type, block.pricePerCbm, block.photoUrl, block.photoUrls);
                          onBlocksChange(newBlocks);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold opacity-70">Remark</Label>
                    <Input 
                      value={block.remarks || ''} 
                      onChange={(e) => {
                        const newBlocks = [...blocks];
                        newBlocks[idx] = { ...block, remarks: e.target.value };
                        onBlocksChange(newBlocks);
                      }}
                      className="h-8 text-xs italic"
                      placeholder="Add remark..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t">
                    <div className="flex gap-2">
                      {(h.blockTypes || []).map((preset: any) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            const newBlocks = [...blocks];
                            newBlocks[idx] = buildBlock(block.id, block.blockNo, block.l1, block.l2, block.l3, h, block.remarks, undefined, preset.id, undefined, block.photoUrl, block.photoUrls);
                            onBlocksChange(newBlocks);
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all",
                            block.type === preset.id 
                              ? "bg-primary text-primary-foreground scale-110 shadow-sm" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          T{preset.id}
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
                      <Label className="text-[9px] uppercase font-bold opacity-70">Vessel</Label>
                      <Input value={h.vessel} onChange={(e) => updateH('vessel', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold opacity-70">Port of Discharge</Label>
                      <Input value={h.portOfDischarge} onChange={(e) => updateH('portOfDischarge', e.target.value)} className="h-8 text-xs" />
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
  // Helper for common cell styles
  const cellStyle = { border: '1px solid #000', padding: '4px', verticalAlign: 'top', fontSize: '10px' };
  const labelStyle = { fontWeight: 'bold' as const, fontSize: '10px', marginBottom: '2px' };
  const valueStyle = { fontSize: '10px' };
  // Force equal column widths

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
          {/* Row 0: Title inside box */}
          <tr>
            <td colSpan={4} style={{ ...cellStyle, textAlign: 'center', borderBottom: '1px solid #000', padding: '10px' }}>
              <div className="font-bold text-lg uppercase underline">{title.includes('INVOICE') ? 'INVOICE' : 'PACKING LIST'}</div>
            </td>
          </tr>
          {/* Row 1 */}
          <tr>
            <td style={{ ...cellStyle }} colSpan={2} rowSpan={3}>
              <div style={labelStyle}>Exporter</div>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{cp.companyName}</div>
              <div style={{ whiteSpace: 'pre-wrap', ...valueStyle }}>{cp.address}</div>
              <div style={valueStyle}>{cp.country}</div>
              <div style={{ ...valueStyle, marginTop: '8px', borderTop: '0.5px solid #eee', paddingTop: '4px' }}>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>BANK DETAILS:</div>
                <div>{cp.bankName} - {cp.bankBranch}</div>
                <div style={{ fontStyle: 'italic', fontSize: '9px' }}>{cp.bankAddress}</div>
                <div>A/C NO: {cp.accountNumber}</div>
                <div>SWIFT: {cp.swiftCode}</div>
              </div>
            </td>
            <td style={{ ...cellStyle }}>
              <div style={labelStyle}>Invoice no & Date</div>
              <div style={valueStyle}>{h.invoiceNumber ? `${h.invoiceNumber} / Dtd: ${new Date().toLocaleDateString('en-GB')}` : ''}</div>
            </td>
            <td style={{ ...cellStyle }}>
              <div style={labelStyle}>Exporter Ref No:</div>
              <div style={valueStyle}>{h.exporterRefNumber}</div>
            </td>
          </tr>
          {/* Row 2 - Buyer & LUT Split */}
          <tr>

            <td style={cellStyle} colSpan={2}>
              <div style={{ ...valueStyle, fontWeight: 'bold' }}>
                LUT NO &nbsp;
                <span style={{ fontWeight: 'normal' }}>{cp.lutNumber}</span>
              </div>
            </td>
          </tr>
          {/* Row 3 - Other ref and HS Code Split */}
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
              <div style={{ ...valueStyle, fontWeight: 'bold' }}>
                HS CODE: &nbsp;
                <span style={{ fontWeight: 'normal' }}>{h.hsCode}</span>
              </div>
            </td>
          </tr>

          {/* Dynamic Types Row */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>HS CODE</div>
              <div style={valueStyle}>{h.hsCode}</div>
            </td>
            {h.blockTypes?.slice(0, 3).map((t: any) => (
              <td key={t.id} style={cellStyle}>
                <div style={labelStyle}>Type T{t.id} Allw.</div>
                <div style={valueStyle}>{t.allowance} cm</div>
              </td>
            ))}
            {/* Fill missing columns if less than 3 types */}
            {Array.from({ length: Math.max(0, 3 - (h.blockTypes?.length || 0)) }).map((_, i) => (
              <td key={`empty-${i}`} style={cellStyle}></td>
            ))}
          </tr>
          {/* Row 4 - Consignee and Buyer if other */}
          <tr>
            <td style={{ ...cellStyle }} colSpan={2}>
              <div style={labelStyle}>Consignee</div>
              <div style={{ fontWeight: 'bold', ...valueStyle }}>{h.consignee}</div>
              <div style={{ whiteSpace: 'pre-wrap', ...valueStyle }}>{h.consigneeAddress}</div>
              {h.consigneePhone && <div style={valueStyle}>Tel: {h.consigneePhone}</div>}
            </td>
            <td style={{ ...cellStyle }} colSpan={2}>
              <div style={labelStyle}>{title.includes('PACKING') ? 'Buyer if other than consignee' : 'NOTIFY PARTY'}</div>
              <div style={{ minHeight: '40px', whiteSpace: 'pre-wrap', ...valueStyle }}>{h.notifyParty}</div>
            </td>
          </tr>


          {/* Row 5 */}
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

          {/* Row 6 */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Vessel/Flight No</div>
              <div style={valueStyle}>{h.vessel}</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Port of Loading</div>
              <div style={valueStyle}>{cp.defaultPortOfLoading}</div>
            </td>
            <td style={cellStyle} colSpan={2} rowSpan={2}>
              <div style={labelStyle}>Terms of Delivery and Payment</div>
              <div style={valueStyle}>{h.termsOfDelivery}</div>
              <div style={valueStyle}>{h.termsOfPayment}</div>
            </td>
          </tr>

          {/* Row 7 */}
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

function InvoiceBody({ blocks, type, h, cp, totals, blockRange }: { blocks: any[]; type: 'gross' | 'net'; h: any; cp: any; totals: any; blockRange: string }) {
  const totalCbm = type === 'gross' ? totals.totalGrossCbm : totals.totalNetCbm;
  const totalAmount = totalCbm * (h.pricePerCbm || 0);

  const cellStyle = { border: '1px solid #000', padding: '4px', verticalAlign: 'top', fontSize: '10px' };
  const headerStyle = { ...cellStyle, fontWeight: 'bold' as const, textAlign: 'center' as const };
  const noBorder = { border: 'none' };

  return (
    <div className='flex flex-col h-full'>
      <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none', flex: 1, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '12.5%' }} />
          <col style={{ width: '12.5%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...headerStyle }}>Description</th>
            <th style={{ ...headerStyle }}>Quantity<br />CBM</th>
            <th style={{ ...headerStyle }}>Rate<br />{h.currency}/CBM</th>
            <th style={{ ...headerStyle }}>Amount<br />{h.currency}</th>
          </tr>
        </thead>
        <tbody>
          {/* Row 1: Top Description - Border Bottom None */}
          <tr>
            <td style={{ ...cellStyle, borderBottom: 'none' }}>
              <div style={{ fontWeight: 'bold' }}>ROUGH GRANITE BLOCKS</div>
              <div style={{ fontWeight: 'bold' }}>{h.stoneDescription || h.stoneType}</div>
              <div style={{ fontWeight: 'bold' }}>{h.consigneeShort || h.consignee}</div>
            </td>
            <td style={{ ...cellStyle, borderBottom: 'none' }}></td>
            <td style={{ ...cellStyle, borderBottom: 'none' }}></td>
            <td style={{ ...cellStyle, borderBottom: 'none' }}></td>
          </tr>

          {/* Row 2: Aligned Data - Border Top None */}
          <tr style={{ height: '350px', verticalAlign: 'top' }}>
            <td style={{ ...cellStyle, borderTop: 'none', paddingTop: '20px' }}>
              <div>BLOCK NO : {blockRange}</div>
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', borderTop: 'none', paddingTop: '20px' }}>
              {totalCbm.toFixed(3)}
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', borderTop: 'none', paddingTop: '20px' }}>
              {h.pricePerCbm}
            </td>
            <td style={{ ...cellStyle, textAlign: 'center', borderTop: 'none', paddingTop: '20px' }}>
              {totalAmount.toFixed(2)}
            </td>
          </tr>

          <tr className="font-bold">
            <td style={{ ...cellStyle }}>
              TOTAL NO OF BLOCKS : {String(blocks.length).padStart(2, '0')}
            </td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>{totalCbm.toFixed(3)}</td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>Total</td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>{totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount and Declarations */}
      <div style={{ border: '1px solid black', borderTop: 'none', padding: '4px', fontSize: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Amount Chargeable (in Words)</div>
        <div style={{ fontWeight: 'bold' }}>{h.currency} {numberToWords(totalAmount).toUpperCase()} ONLY</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, width: '50%', borderRight: '1px solid black' }}>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Declaration</div>
              <div>We declare that this invoice shows the actual price of the goods.</div>
              <div>Described and that all particulars are true and correct.</div>
            </td>
            <td style={{ ...cellStyle, width: '50%' }}>
              <div style={{ fontWeight: 'bold' }}>Signature and Date</div>
              <div style={{ marginTop: '20px', color: '#1a365d', fontWeight: 'bold', fontSize: '14px' }}>{cp.companyName}</div>

              {/* Signature Image Placeholder - using a simple path specific to this demo or generic */}
              <div style={{ height: '40px', margin: '10px 0', position: 'relative' }}>
              </div>

              <div style={{ textAlign: 'right', paddingRight: '20px', fontWeight: 'bold' }}>Partner</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function NormalReportBody({ blocks, cp, h, inspectionPhotos }: any) {
  const cellStyle = { border: '1px solid #000', padding: '4px', verticalAlign: 'middle', textAlign: 'center' as const, fontSize: '10px' };
  const headerStyle = { ...cellStyle, fontWeight: 'bold' as const, background: '#f8fafc', textTransform: 'uppercase' as const };

  return (
    <div className="w-full space-y-8">
      {blocks.map((b: any, idx: number) => {
        const preset = h.blockTypes?.find((p: any) => p.id === b.type) || h.blockTypes?.[0];
        const allowance = b.allowance !== undefined ? b.allowance : (preset?.allowance || 0);
        const allowanceText = allowance > 0 ? `${allowance} cm applied effectively` : 'No allowance applied';

        return (
          <div key={b.id} className="border-[3px] border-black p-4 bg-white break-inside-avoid mb-8 page-break-after-always">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
               <div className="text-left">
                  <h2 className="text-2xl font-black text-[#1a365d] leading-none mb-1 uppercase italic tracking-tighter">{cp.companyName}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0369a1]">Inspection Report</p>
               </div>
               <div className="text-right">
                  <div className="bg-black text-white px-5 py-2 text-2xl font-black uppercase tracking-tighter rounded-sm shadow-lg">
                    BLOCK #{String(b.blockNo).padStart(3, '0')}
                  </div>
               </div>
            </div>

            {/* Measurement Table */}
            <div className="px-4 mb-8">
              <div className="bg-white border-2 border-black shadow-xl overflow-hidden rounded-sm">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...headerStyle, width: '25%', textAlign: 'left' }}>MEASUREMENT TYPE</th>
                      <th style={headerStyle}>LENGTH</th>
                      <th style={headerStyle}>HEIGHT</th>
                      <th style={headerStyle}>WIDTH</th>
                      <th style={{ ...headerStyle, background: '#fff1f2', color: '#be123c' }}>ALLOWANCE</th>
                      <th style={{ ...headerStyle, background: '#e0f2fe', color: '#0369a1' }}>CBM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'left' }}>GROSS ENTRY</td>
                      <td style={cellStyle}>{b.l1}</td>
                      <td style={cellStyle}>{b.l2}</td>
                      <td style={cellStyle}>{b.l3}</td>
                      <td rowSpan={2} style={{ ...cellStyle, fontWeight: 'bold', color: '#be123c' }}>{allowance} CM</td>
                      <td style={cellStyle}>{( (b.l1 * b.l2 * b.l3) / 1000000 ).toFixed(3)}</td>
                    </tr>
                    <tr style={{ background: '#fffcf0' }}>
                      <td style={{ ...cellStyle, fontWeight: 'bold', textAlign: 'left' }}>
                        FINAL NET (Deducted)
                      </td>
                      <td style={cellStyle}>{b.l1}</td>
                      <td style={{ ...cellStyle, color: '#dc2626', fontWeight: 'bold' }}>{Math.max(b.l2 - allowance, 0)}</td>
                      <td style={cellStyle}>{b.l3}</td>
                      <td style={{ ...cellStyle, fontWeight: '900', color: '#16a34a', fontSize: '14px', background: '#f0fdf4' }}>{Number(b.netCbm || 0).toFixed(3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Photo List - Single column, fully viewable */}
            <div className="grid grid-cols-1 gap-6 mb-8 px-4">
              {((b.photoUrls && b.photoUrls.length > 0) || b.photoUrl) ? (
                <>
                  {[...(b.photoUrl ? [b.photoUrl] : []), ...(b.photoUrls || [])].map((url, pIdx) => (
                    <div key={pIdx} className="border-2 border-black p-1 bg-zinc-50 shadow-sm">
                       <img src={url} alt={`Block ${b.blockNo} - ${pIdx + 1}`} className="w-full h-auto object-contain block mx-auto" style={{ maxHeight: '400px' }} />
                    </div>
                  ))}
                </>
              ) : (
                <div className="h-48 border-[3px] border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-300 font-bold uppercase text-xs italic gap-2">
                  <X className="h-8 w-8 opacity-20" />
                  No photos captured for Block {b.blockNo}
                </div>
              )}
            </div>

            {b.remarks && (
              <div className="mt-8 px-4">
                <div style={{ border: '2px solid #000', padding: '12px', backgroundColor: '#fafafa', position: 'relative' }}>
                  <div className="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">Inspector Remarks</div>
                  <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>
                    &ldquo; {b.remarks} &rdquo;
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* General Inspection Photos Appendix for Normal Report */}
      {inspectionPhotos && inspectionPhotos.length > 0 && (
        <div className="mt-12 pt-8 border-t-2 border-black page-break-before mb-8 font-serif">
          <h3 className="text-xl font-black uppercase tracking-widest text-center mb-8 underline">SITE EVIDENCE APPENDIX</h3>
          <div className="grid grid-cols-2 gap-6 px-4">
            {inspectionPhotos.map((url: string, idx: number) => (
              <div key={`gen-${idx}`} className="flex flex-col gap-2">
                <div className="border-2 border-black p-1 bg-white">
                  <img src={url} alt={`Site Evidence ${idx + 1}`} className="w-full h-64 object-cover" />
                </div>
                <div className="text-[10px] font-bold uppercase text-center bg-zinc-100 p-1 border border-black border-top-0">
                  GENERAL SITE PHOTO #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 pt-8 border-t-[3px] border-black" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex justify-between items-end px-4 font-serif">
          <div className="space-y-2">
             <div className="flex items-center gap-4">
                <div className="text-center bg-zinc-100 border border-black p-2 min-w-[100px]">
                   <p className="text-[8px] font-bold uppercase text-zinc-500">Total Blocks</p>
                   <p className="text-2xl font-black">{blocks.length}</p>
                </div>
                <div className="text-center bg-zinc-100 border border-black p-2 min-w-[150px]">
                   <p className="text-[8px] font-bold uppercase text-zinc-500">Total CBM</p>
                   <p className="text-2xl font-black text-green-700">{blocks.reduce((acc: any, b: any) => acc + (b.netCbm || 0), 0).toFixed(3)} m³</p>
                </div>
             </div>
             <p className="text-[9px] font-bold text-zinc-400 uppercase italic">* This report serves as an official inspection document generated via Dakshin Scanner App.</p>
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
    </div>
  );
}



