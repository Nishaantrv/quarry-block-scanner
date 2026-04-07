import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { numberToWords } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { InspectionHeader, CompanyProfile, Customer } from '@/types/inspection';
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

type DocType = 'gross-packing' | 'net-packing' | 'gross-invoice' | 'net-invoice' | 'normal-report';

export default function ExportPage() {
  const navigate = useNavigate();
  const inspection = useInspectionStore((s) => s.activeInspection);
  const companyProfile = useInspectionStore((s) => s.companyProfile);
  const updateHeader = useInspectionStore((s) => s.updateHeader);
  const setCompanyProfile = useInspectionStore((s) => s.setCompanyProfile);

  const [activeDoc, setActiveDoc] = React.useState<DocType>('normal-report');
  const printRef = useRef<HTMLDivElement>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedHeader, setEditedHeader] = React.useState<InspectionHeader | null>(null);
  const [editedProfile, setEditedProfile] = React.useState<CompanyProfile | null>(null);

  useEffect(() => {
    if (inspection) {
      setEditedHeader(inspection.header);
    }
    if (companyProfile) {
      setEditedProfile(companyProfile);
    }
  }, [inspection, companyProfile]);

  if (!inspection) {
    navigate('/');
    return null;
  }

  const handleStartEdit = () => {
    setEditedHeader({ ...inspection.header });
    setEditedProfile({ ...companyProfile });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedHeader(inspection.header);
    setEditedProfile(companyProfile);
  };

  const handleSaveEdit = () => {
    if (editedHeader) updateHeader(editedHeader);
    if (editedProfile) setCompanyProfile(editedProfile);
    setIsEditing(false);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const wasEditing = isEditing;
    if (wasEditing) setIsEditing(false);

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow || !printRef.current) return;

      const clone = printRef.current.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script').forEach((s) => s.remove());
      clone.querySelectorAll('[onerror],[onload],[onclick],[onmouseover]').forEach((el) => {
        el.removeAttribute('onerror');
        el.removeAttribute('onload');
        el.removeAttribute('onclick');
        el.removeAttribute('onmouseover');
      });

      const printStyles = `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; font-size: 8px; background: white; color: black; padding: 5mm; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #000; padding: 2px 3px; text-align: left; vertical-align: middle; word-wrap: break-word; overflow: hidden; }
          th { background: #f0f0f0; font-weight: bold; text-transform: uppercase; text-align: center; font-size: 8px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-red { color: #dc2626; }
          .text-green { color: #16a34a; }
          .font-bold { font-weight: bold; }
          @media print {
              @page { margin: 0; size: A4 landscape; }
              body { margin: 5mm; -webkit-print-color-adjust: exact; }
          }`;

      const doc = printWindow.document;
      doc.open();
      doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
      doc.close();
      doc.title = `Print ${activeDoc}`;
      const style = doc.createElement('style');
      style.textContent = printStyles;
      doc.head.appendChild(style);
      doc.body.appendChild(doc.adoptNode(clone));

      if (wasEditing) setIsEditing(true);

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    }, 100);
  };

  const docs: { key: DocType; label: string }[] = [
    { key: 'normal-report', label: 'Inspection Report' },
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
                onHeaderChange={setEditedHeader} 
                onProfileChange={setEditedProfile} 
              />
            </div>

            {/* Preview on the right (hidden on mobile during edit if desired, or small) */}
            <div className="hidden lg:block border rounded-xl overflow-auto bg-zinc-900/50 p-4 shadow-inner">
               <div className="scale-[0.6] origin-top transform-gpu">
                  <div ref={printRef} className={cn(
                    "bg-white text-black p-[5mm] text-[8px] leading-tight mx-auto shadow-2xl",
                    activeDoc === 'normal-report' ? "w-[297mm] min-h-[210mm]" : "w-[210mm] min-h-[297mm]"
                  )}>
                    <PreviewContent 
                      activeDoc={activeDoc} 
                      cp={editedProfile!} 
                      h={editedHeader!} 
                      blocks={blocks} 
                      totals={totals} 
                      blockRange={blockRange} 
                      isEditing={true}
                      inspectionPhotos={inspection?.header.inspectionPhotos}
                    />
                  </div>
               </div>
            </div>
          </div>
        ) : (
          /* Normal Preview Mode */
          <div className="overflow-auto flex justify-center">
            <div className={cn("inline-block border shadow-lg p-2 transition-colors bg-zinc-500/10 rounded-xl")}>
              <div ref={printRef} className={cn(
                "bg-white text-black p-[5mm] text-[8px] leading-tight mx-auto shadow-sm print:shadow-none",
                activeDoc === 'normal-report' ? "w-[297mm] min-h-[210mm]" : "w-[210mm] min-h-[297mm]"
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
        )}
      </main>
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
        <InspectionReportBody
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

function DocumentEditor({ h, cp, onHeaderChange, onProfileChange }: { h: InspectionHeader, cp: CompanyProfile, onHeaderChange: (h: any) => void, onProfileChange: (p: any) => void }) {
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
    // Fill in consignee details
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
    
    // If the customer has bank details, maybe the user wants to update the exporter profile? 
    // Usually exporter bank details stay the same, but let's see. 
    // For now we just load the consignee-related fields.
  };

  return (
    <Card className="flex-1 overflow-hidden flex flex-col glass-panel border-none shadow-none rounded-xl">
      <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-4">
          <TabsList className="grid grid-cols-5 w-full bg-muted/50 p-1">
            <TabsTrigger value="general" className="text-[10px] uppercase font-bold px-1 py-2">
              <Settings2 className="h-3 w-3 mr-1" /> General
            </TabsTrigger>
            <TabsTrigger value="company" className="text-[10px] uppercase font-bold px-1 py-2">
              <Building className="h-3 w-3 mr-1" /> Exporter
            </TabsTrigger>
            <TabsTrigger value="consignee" className="text-[10px] uppercase font-bold px-1 py-2">
              <User className="h-3 w-3 mr-1" /> Consignee
            </TabsTrigger>
            <TabsTrigger value="shipping" className="text-[10px] uppercase font-bold px-1 py-2">
              <Truck className="h-3 w-3 mr-1" /> Shipping
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-[10px] uppercase font-bold px-1 py-2">
              <CreditCard className="h-3 w-3 mr-1" /> Terms
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <TabsContent value="general" className="mt-0 space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Invoice Number</Label>
                <Input value={h.invoiceNumber || ''} onChange={e => updateH('invoiceNumber', e.target.value)} placeholder="INV-2024-001" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Exporter Ref No</Label>
                <Input value={h.exporterRefNumber || ''} onChange={e => updateH('exporterRefNumber', e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">HS Code</Label>
                <Input value={h.hsCode || ''} onChange={e => updateH('hsCode', e.target.value)} className="h-10" />
              </div>
            </div>

            <div className="pt-2 border-t mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Allowances (Centimeters)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase">Small</Label>
                  <Input type="number" value={String(h.allowanceSmall)} onChange={e => updateH('allowanceSmall', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase">Large</Label>
                  <Input type="number" value={String(h.allowanceLarge)} onChange={e => updateH('allowanceLarge', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase">Other</Label>
                  <Input type="number" value={String(h.allowanceOther)} onChange={e => updateH('allowanceOther', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="company" className="mt-0 space-y-4 pb-4">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Company Name</Label>
                <Input value={cp.companyName} onChange={e => updateCp('companyName', e.target.value)} className="h-10 font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Address</Label>
                <Textarea value={cp.address} onChange={e => updateCp('address', e.target.value)} className="min-h-[80px]" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Country</Label>
                  <Input value={cp.country} onChange={e => updateCp('country', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">LUT Number</Label>
                  <Input value={cp.lutNumber || ''} onChange={e => updateCp('lutNumber', e.target.value)} />
                </div>
              </div>

              <div className="pt-2 border-t mt-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-3">
                  <Landmark className="h-3 w-3" /> Bank Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase">Bank Name</Label>
                    <Input value={cp.bankName || ''} onChange={e => updateCp('bankName', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase">Account No</Label>
                    <Input value={cp.accountNumber || ''} onChange={e => updateCp('accountNumber', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase">Bank Address</Label>
                    <Input value={cp.bankAddress || ''} onChange={e => updateCp('bankAddress', e.target.value)} />
                  </div>
                </div>
              </div>
          </TabsContent>

          <TabsContent value="consignee" className="mt-0 space-y-4 pb-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <User className="h-4 w-4" /> Consignee Selection
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                    <Search className="h-3.5 w-3.5" /> Quick Load
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto rounded-xl p-1" align="end">
                  <div className="p-2 border-b text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Select saved customer</div>
                  {customers.map((customer) => (
                    <DropdownMenuItem 
                      key={customer.id} 
                      className="py-2.5 px-3 rounded-lg flex flex-col items-start gap-0.5"
                      onSelect={() => loadFromCustomer(customer)}
                    >
                      <span className="font-black text-xs uppercase tracking-tight">{customer.name}</span>
                      <span className="text-[10px] opacity-70 italic">{customer.country}</span>
                    </DropdownMenuItem>
                  ))}
                  {customers.length === 0 && (
                    <div className="p-4 text-center text-[10px] text-muted-foreground font-bold uppercase italic">No customers found</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Consignee Name</Label>
                <Input value={h.consignee || ''} onChange={e => updateH('consignee', e.target.value)} className="h-10 font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Address</Label>
                <Textarea value={h.consigneeAddress || ''} onChange={e => updateH('consigneeAddress', e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Phone Number</Label>
                <Input value={h.consigneePhone || ''} onChange={e => updateH('consigneePhone', e.target.value)} />
              </div>
              
              <div className="pt-4 border-t">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Notify Party / Other Buyer</Label>
                <Textarea value={h.notifyParty || ''} onChange={e => updateH('notifyParty', e.target.value)} className="min-h-[80px] mt-1.5" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shipping" className="mt-0 space-y-4 pb-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Pre-Carriage By</Label>
                  <Input value={h.preCarriageBy || ''} onChange={e => updateH('preCarriageBy', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Vessel / Flight No</Label>
                  <Input value={h.vessel || ''} onChange={e => updateH('vessel', e.target.value)} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Port of Loading</Label>
                  <Input value={cp.defaultPortOfLoading || ''} onChange={e => updateCp('defaultPortOfLoading', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Port of Discharge</Label>
                  <Input value={h.portOfDischarge || ''} onChange={e => updateH('portOfDischarge', e.target.value)} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Place of Receipt</Label>
                  <Input value={h.placeOfReceipt || ''} onChange={e => updateH('placeOfReceipt', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Final Destination</Label>
                  <Input value={h.finalDestination || ''} onChange={e => updateH('finalDestination', e.target.value)} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Country of Origin</Label>
                  <Input value={h.countryOfOrigin || 'INDIA'} onChange={e => updateH('countryOfOrigin', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Final Dest. Country</Label>
                  <Input value={h.finalDestinationCountry || ''} onChange={e => updateH('finalDestinationCountry', e.target.value)} />
                </div>
             </div>
          </TabsContent>

          <TabsContent value="payment" className="mt-0 space-y-4 pb-4">
             <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Terms of Delivery</Label>
                  <Input value={h.termsOfDelivery || ''} onChange={e => updateH('termsOfDelivery', e.target.value)} placeholder="e.g. FOB CHENNAI PORT" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Terms of Payment</Label>
                  <Input value={h.termsOfPayment || ''} onChange={e => updateH('termsOfPayment', e.target.value)} placeholder="e.g. 100% ADVANCE" className="h-10" />
                </div>
                
                <div className="pt-4 border-t flex items-end gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Currency</Label>
                    <Input value={h.currency || 'USD'} onChange={e => updateH('currency', e.target.value)} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-1.5 flex-[2]">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Rate per CBM</Label>
                    <Input type="number" value={String(h.pricePerCbm || 0)} onChange={e => updateH('pricePerCbm', parseFloat(e.target.value) || 0)} className="h-10 font-mono" />
                  </div>
                </div>
             </div>
          </TabsContent>
        </ScrollArea>
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

          {/* New row for allowances */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>HS CODE</div>
              <div style={valueStyle}>{h.hsCode}</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Small Allw.</div>
              <div style={valueStyle}>{h.allowanceSmall} cm</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Large Allw.</div>
              <div style={valueStyle}>{h.allowanceLarge} cm</div>
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Other Allw.</div>
              <div style={valueStyle}>{h.allowanceOther} cm</div>
            </td>
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
              <div style={{ fontWeight: 'bold' }}>{h.stoneType}</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>SHIPPING MARK: {h.marksAndNos}</div>

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
                    {b.remarks && (
                      <div className="text-[8px] italic text-zinc-500 pl-4">
                        Rem: {b.remarks}
                      </div>
                    )}
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
              <div style={{ fontWeight: 'bold' }}>{h.stoneType}</div>
              <div style={{ fontWeight: 'bold' }}>SHIPPING MARK: {h.marksAndNos}</div>
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



function InspectionReportBody({ blocks, h, cp, inspectionPhotos }: { blocks: any[]; h: any; cp: any; inspectionPhotos?: string[] }) {
  const cellStyle = { border: '1px solid #000', padding: '3px 4px', fontSize: '9px', verticalAlign: 'middle', textAlign: 'center' as const };
  const headerStyle = { ...cellStyle, fontWeight: 'bold' as const, background: '#f8fafc', textTransform: 'uppercase' as const };
  const subHeaderStyle = { ...cellStyle, fontWeight: 'bold' as const, background: '#f1f5f9', fontSize: '8px' };

  return (
    <div className="w-full font-serif">
      <div className="text-center py-6 mb-4 border-b-2 border-black">
        <h2 className="text-xl font-black uppercase tracking-tight text-[#0369a1]">
          M/s. {cp.companyName} - {h.stoneType || 'XOW / XMN'}
        </h2>
        <h3 className="text-2xl font-black uppercase tracking-widest mt-1">INSPECTION REPORT</h3>
      </div>

      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: '30px' }}>SL</th>
              <th style={{ ...headerStyle, width: '70px' }}>DATE</th>
              <th style={{ ...headerStyle, width: '60px' }}>BLOCK NO</th>
              <th style={{ ...headerStyle, width: '50px' }}>LENGTH</th>
              <th style={{ ...headerStyle, width: '50px' }}>HEIGHT</th>
              <th style={{ ...headerStyle, width: '50px' }}>WIDTH</th>
              <th style={{ ...headerStyle, width: '60px' }}>TYPE</th>
              <th style={{ ...headerStyle, width: '50px' }}>ALLOW.</th>
              <th style={{ ...headerStyle, width: '70px' }}>NET VOLUME</th>
              <th style={{ ...headerStyle }}>REMARK</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b, idx) => {
              const allowance = b.allowance !== undefined ? b.allowance : 
                  ((b.type === 'large' ? h.allowanceLarge : b.type === 'other' ? h.allowanceOther : h.allowanceSmall) || 0);

              return (
                <tr key={b.id}>
                  <td style={cellStyle}>{idx + 1}</td>
                  <td style={cellStyle}>{new Date(b.createdAt || Date.now()).toLocaleDateString('en-GB')}</td>
                  <td style={{ ...cellStyle, fontWeight: '900', color: '#1d4ed8' }}>{b.blockNo}</td>
                  <td style={cellStyle}>{b.l1}</td>
                  <td style={cellStyle}>{b.l2}</td>
                  <td style={cellStyle}>{b.l3}</td>
                  <td style={{ ...cellStyle, textTransform: 'uppercase', fontSize: '8px', fontWeight: 'bold' }}>{b.type || 'SMALL'}</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold', color: '#dc2626' }}>{allowance}</td>
                  <td style={{ ...cellStyle, fontWeight: '900' }}>{Number(b.netCbm || 0).toFixed(3)}</td>
                  <td style={{ ...cellStyle, textAlign: 'left', fontSize: '8px', fontStyle: 'italic' }}>
                    {b.remarks}
                  </td>
                </tr>
              );
            })}
            {/* Totals Row */}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td style={{ ...cellStyle, textAlign: 'right' }} colSpan={8}>TOTALS</td>
              <td style={cellStyle}>{blocks.reduce((acc, b) => acc + (b.netCbm || 0), 0).toFixed(3)}</td>
              <td style={cellStyle}></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* PHOTO APPENDIX */}
      {(inspectionPhotos?.length ?? 0) > 0 || blocks.some(b => b.photoUrl || (b.photoUrls?.length ?? 0) > 0) ? (
        <div className="mt-12 pt-8 border-t-2 border-black page-break-before">
          <h3 className="text-xl font-black uppercase tracking-widest text-center mb-8 underline">PHOTO APPENDIX</h3>
          
          <div className="grid grid-cols-2 gap-6">
            {/* General Photos First */}
            {inspectionPhotos?.map((url, idx) => (
              <div key={`gen-${idx}`} className="flex flex-col gap-2">
                <div className="border-2 border-black p-1 bg-white">
                  <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-64 object-cover" />
                </div>
                <div className="text-[10px] font-bold uppercase text-center bg-zinc-100 p-1 border border-black border-top-0">
                  SITE EVIDENCE #{idx + 1}
                </div>
              </div>
            ))}

            {/* Then Block Photos */}
            {blocks.filter(b => b.photoUrl || b.photoUrls?.length).map((b, bIdx) => {
              const allPhotos = [...(b.photoUrl ? [b.photoUrl] : []), ...(b.photoUrls || [])];
              return allPhotos.map((url, pIdx) => (
                <div key={`blk-${bIdx}-${pIdx}`} className="flex flex-col gap-2">
                  <div className="border-2 border-black p-1 bg-white">
                    <img src={url} alt={`Block ${b.blockNo}`} className="w-full h-64 object-cover" />
                  </div>
                  <div className="text-[10px] font-bold uppercase text-center bg-zinc-100 p-1 border border-black border-top-0">
                    BLOCK #{String(b.blockNo).padStart(3, '0')} - VIEW {pIdx + 1}
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-8 pt-6 border-t-2 border-black flex justify-between items-end px-4">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase text-zinc-500">Report Information</p>
          <div className="flex gap-4">
            <div>
              <span className="text-[8px] font-bold text-zinc-400">TOTAL BLOCKS:</span>
              <span className="ml-1 font-black text-sm">{blocks.length}</span>
            </div>
            <div>
              <span className="text-[8px] font-bold text-zinc-400">TOTAL NET CBM:</span>
              <span className="ml-1 font-black text-sm">{blocks.reduce((acc, b) => acc + (b.grossCbm || (b.l1*b.l2*b.l3)/1000000), 0).toFixed(3)}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase mb-1">{cp.companyName}</div>
          <div className="h-12 w-32 border-b border-zinc-400 mb-1 ml-auto"></div>
          <p className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest">Authorized Inspection Signatory</p>
        </div>
      </div>
    </div>
  );
}


