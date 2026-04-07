import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { numberToWords } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileDown, Printer, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InspectionHeader, CompanyProfile } from '@/types/inspection';

type DocType = 'gross-packing' | 'net-packing' | 'gross-invoice' | 'net-invoice' | 'normal-report' | 'block-abstract';

export default function ExportPage() {
  const navigate = useNavigate();
  const inspection = useInspectionStore((s) => s.activeInspection);
  const companyProfile = useInspectionStore((s) => s.companyProfile);
  const updateHeader = useInspectionStore((s) => s.updateHeader);
  const setCompanyProfile = useInspectionStore((s) => s.setCompanyProfile);

  const [activeDoc, setActiveDoc] = React.useState<DocType>('block-abstract');
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

      <div className="max-w-6xl mx-auto p-2 overflow-auto">
        <div className={cn("inline-block border shadow-lg p-2 transition-colors min-w-full", isEditing ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-500/10")}>
          <div ref={printRef} className={cn(
            "bg-white text-black p-[5mm] text-[8px] leading-tight mx-auto shadow-sm print:shadow-none",
            activeDoc === 'block-abstract' ? "w-[297mm] min-h-[210mm]" : "w-[210mm] min-h-[297mm]"
          )}>
            {activeDoc !== 'normal-report' && activeDoc !== 'block-abstract' && (
              <InvoiceHeader
                cp={cp}
                h={h}
                isEditing={isEditing}
                onHeaderChange={setEditedHeader}
                onProfileChange={setEditedProfile}
                title={
                  activeDoc === 'gross-packing' ? 'GROSS PACKING LIST' :
                    activeDoc === 'net-packing' ? 'NET PACKING LIST' :
                      activeDoc === 'gross-invoice' ? 'GROSS PROFORMA INVOICE' :
                        'NET PROFORMA INVOICE'
                }
              />
            )}

            {activeDoc === 'normal-report' && (
              <BlockAbstractBody
                blocks={blocks}
                h={h}
                cp={cp}
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
          </div>
        </div>
      </div>
    </div>
  );
}

interface InvoiceHeaderProps {
  cp: CompanyProfile;
  h: InspectionHeader;
  title: string;
  isEditing?: boolean;
  onHeaderChange?: (h: InspectionHeader) => void;
  onProfileChange?: (p: CompanyProfile) => void;
}

function InvoiceHeader({ cp, h, title, isEditing, onHeaderChange, onProfileChange }: InvoiceHeaderProps) {
  // Helper for common cell styles
  const cellStyle = { border: '1px solid #000', padding: '4px', verticalAlign: 'top', fontSize: '10px' };
  const labelStyle = { fontWeight: 'bold' as const, fontSize: '10px', marginBottom: '2px' };
  const valueStyle = { fontSize: '10px' };
  // Force equal column widths

  const updateH = (key: keyof InspectionHeader, value: any) => {
    if (onHeaderChange) onHeaderChange({ ...h, [key]: value });
  };

  const updateCp = (key: keyof CompanyProfile, value: any) => {
    if (onProfileChange) onProfileChange({ ...cp, [key]: value });
  };

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
              {isEditing ? (
                <div className="space-y-1">
                  <Input className="h-6 text-[10px]" value={cp.companyName} onChange={e => updateCp('companyName', e.target.value)} placeholder="Company Name" />
                  <Textarea className="min-h-[60px] text-[10px]" value={cp.address} onChange={e => updateCp('address', e.target.value)} placeholder="Address" />
                  <Input className="h-6 text-[10px]" value={cp.country} onChange={e => updateCp('country', e.target.value)} placeholder="Country" />
                  <Input className="h-6 text-[10px]" value={cp.bankAddress} onChange={e => updateCp('bankAddress', e.target.value)} placeholder="Bank Address" />
                </div>
              ) : (
                <>
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
                </>
              )}
            </td>
            <td style={{ ...cellStyle }}>
              <div style={labelStyle}>Invoice no & Date</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.invoiceNumber || ''} onChange={e => updateH('invoiceNumber', e.target.value)} placeholder="Invoice No" />
              ) : (
                <div style={valueStyle}>{h.invoiceNumber ? `${h.invoiceNumber} / Dtd: ${new Date().toLocaleDateString('en-GB')}` : ''}</div>
              )}
            </td>
            <td style={{ ...cellStyle }}>
              <div style={labelStyle}>Exporter Ref No:</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.exporterRefNumber || ''} onChange={e => updateH('exporterRefNumber', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.exporterRefNumber}</div>
              )}
            </td>
          </tr>
          {/* Row 2 - Buyer & LUT Split */}
          <tr>

            <td style={cellStyle} colSpan={2}>
              <div style={{ ...valueStyle, fontWeight: 'bold' }}>
                LUT NO &nbsp;
                {isEditing ? (
                  <Input className="h-6 text-[10px] inline-block w-24" value={cp.lutNumber || ''} onChange={e => updateCp('lutNumber', e.target.value)} />
                ) : (
                  <span style={{ fontWeight: 'normal' }}>{cp.lutNumber}</span>
                )}
              </div>
            </td>
          </tr>
          {/* Row 3 - Other ref and HS Code Split */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Other References</div>
              {/* Dynamic Other References */}
              {isEditing ? (
                <div className="space-y-1">
                  {(cp.otherReferences || []).map((ref: string, idx: number) => (
                    <div key={idx} className="flex gap-1">
                      <Input
                        className="h-6 text-[10px]"
                        value={ref}
                        onChange={e => {
                          const newRefs = [...(cp.otherReferences || [])];
                          newRefs[idx] = e.target.value;
                          updateCp('otherReferences', newRefs);
                        }}
                      />
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => {
                          const newRefs = [...(cp.otherReferences || [])];
                          newRefs.splice(idx, 1);
                          updateCp('otherReferences', newRefs);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline" size="sm" className="h-6 text-[9px] w-full"
                    onClick={() => updateCp('otherReferences', [...(cp.otherReferences || []), ''])}
                  >
                    + Add Reference
                  </Button>
                </div>
              ) : (
                cp.otherReferences && cp.otherReferences.length > 0 ? (
                  cp.otherReferences.map((ref: string, idx: number) => (
                    <div key={idx} style={valueStyle}>{ref}</div>
                  ))
                ) : (
                  // Fallback for backward compatibility if needed, or just empty
                  <>
                    {cp.rbiCode && <div style={valueStyle}>RBI CODE NO: {cp.rbiCode}</div>}
                    {cp.ieCode && <div style={valueStyle}>IE CODE NO : {cp.ieCode}</div>}
                    {cp.gstNumber && <div style={valueStyle}>GST NO: {cp.gstNumber}</div>}
                  </>
                )
              )}
            </td>
            <td style={cellStyle}>
              <div style={{ ...valueStyle, fontWeight: 'bold' }}>
                HS CODE: &nbsp;
                {isEditing ? (
                  <Input className="h-6 text-[10px] inline-block w-24" value={h.hsCode || ''} onChange={e => updateH('hsCode', e.target.value)} />
                ) : (
                  <span style={{ fontWeight: 'normal' }}>{h.hsCode}</span>
                )}
              </div>
            </td>
          </tr>

          {/* New row for allowances */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>HS CODE</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.hsCode || ''} onChange={e => updateH('hsCode', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.hsCode}</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Small Allw.</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={String(h.allowanceSmall)} onChange={e => updateH('allowanceSmall', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.allowanceSmall} cm</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Large Allw.</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={String(h.allowanceLarge)} onChange={e => updateH('allowanceLarge', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.allowanceLarge} cm</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Other Allw.</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={String(h.allowanceOther)} onChange={e => updateH('allowanceOther', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.allowanceOther} cm</div>
              )}
            </td>
          </tr>
          {/* Row 4 - Consignee and Buyer if other */}
          <tr>
            <td style={{ ...cellStyle }} colSpan={2}>
              <div style={labelStyle}>Consignee</div>
              {isEditing ? (
                <div className="space-y-1">
                  <Input className="h-6 text-[10px]" value={h.consignee || ''} onChange={e => updateH('consignee', e.target.value)} placeholder="Consignee Name" />
                  <Textarea className="min-h-[60px] text-[10px]" value={h.consigneeAddress || ''} onChange={e => updateH('consigneeAddress', e.target.value)} placeholder="Address" />
                  <Input className="h-6 text-[10px]" value={h.consigneePhone || ''} onChange={e => updateH('consigneePhone', e.target.value)} placeholder="Phone Number" />
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 'bold', ...valueStyle }}>{h.consignee}</div>
                  <div style={{ whiteSpace: 'pre-wrap', ...valueStyle }}>{h.consigneeAddress}</div>
                  {h.consigneePhone && <div style={valueStyle}>Tel: {h.consigneePhone}</div>}
                </>
              )}
            </td>
            <td style={{ ...cellStyle }} colSpan={2}>
              <div style={labelStyle}>{title.includes('PACKING') ? 'Buyer if other than consignee' : 'NOTIFY PARTY'}</div>
              {isEditing ? (
                <Textarea className="min-h-[80px] text-[10px]" value={h.notifyParty || ''} onChange={e => updateH('notifyParty', e.target.value)} />
              ) : (
                <div style={{ minHeight: '40px', whiteSpace: 'pre-wrap', ...valueStyle }}>{h.notifyParty}</div>
              )}
            </td>
          </tr>


          {/* Row 5 */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Pre-Carriage by</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.preCarriageBy || ''} onChange={e => updateH('preCarriageBy', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.preCarriageBy}</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Place of Receipt by Pre-Carrier</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.placeOfReceipt || ''} onChange={e => updateH('placeOfReceipt', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.placeOfReceipt}</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Country of origin of goods</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.countryOfOrigin || cp.country || 'INDIA'} onChange={e => updateH('countryOfOrigin', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.countryOfOrigin || cp.country || 'INDIA'}</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Country of Final Destination</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.finalDestinationCountry || ''} onChange={e => updateH('finalDestinationCountry', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.finalDestinationCountry}</div>
              )}
            </td>
          </tr>

          {/* Row 6 */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Vessel/Flight No</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.vessel || ''} onChange={e => updateH('vessel', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.vessel}</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Port of Loading</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={cp.defaultPortOfLoading || ''} onChange={e => updateCp('defaultPortOfLoading', e.target.value)} />
              ) : (
                <div style={valueStyle}>{cp.defaultPortOfLoading}</div>
              )}
            </td>
            <td style={cellStyle} colSpan={2} rowSpan={2}>
              <div style={labelStyle}>Terms of Delivery and Payment</div>
              {isEditing ? (
                <div className="space-y-1">
                  <Input className="h-6 text-[10px]" value={h.termsOfDelivery || ''} onChange={e => updateH('termsOfDelivery', e.target.value)} placeholder="Delivery Terms" />
                  <Input className="h-6 text-[10px]" value={h.termsOfPayment || ''} onChange={e => updateH('termsOfPayment', e.target.value)} placeholder="Payment Terms" />
                </div>
              ) : (
                <>
                  <div style={valueStyle}>{h.termsOfDelivery}</div>
                  <div style={valueStyle}>{h.termsOfPayment}</div>
                </>
              )}
            </td>
          </tr>

          {/* Row 7 */}
          <tr>
            <td style={cellStyle}>
              <div style={labelStyle}>Port of Discharge</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.portOfDischarge || ''} onChange={e => updateH('portOfDischarge', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.portOfDischarge}</div>
              )}
            </td>
            <td style={cellStyle}>
              <div style={labelStyle}>Final destination</div>
              {isEditing ? (
                <Input className="h-6 text-[10px]" value={h.finalDestination || ''} onChange={e => updateH('finalDestination', e.target.value)} />
              ) : (
                <div style={valueStyle}>{h.finalDestination}</div>
              )}
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



function BlockAbstractBody({ blocks, h, cp }: { blocks: any[]; h: any; cp: any }) {
  const cellStyle = { border: '1px solid #000', padding: '3px 4px', fontSize: '9px', verticalAlign: 'middle', textAlign: 'center' as const };
  const headerStyle = { ...cellStyle, fontWeight: 'bold' as const, background: '#f8fafc', textTransform: 'uppercase' as const };
  const subHeaderStyle = { ...cellStyle, fontWeight: 'bold' as const, background: '#f1f5f9', fontSize: '8px' };

  return (
    <div className="w-full font-serif">
      <div className="text-center py-6 mb-4 border-b-2 border-black">
        <h2 className="text-xl font-black uppercase tracking-tight text-[#0369a1]">
          M/s. {cp.companyName} - ({h.stoneType || 'XOW / XMN'}) BLOCKS ABSTRACT
        </h2>
        <p className="text-[10px] font-bold mt-1 text-zinc-500 uppercase tracking-widest leading-none">Detailed Inspection Summary Report</p>
      </div>

      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: '30px' }} rowSpan={2}>SL</th>
              <th style={{ ...headerStyle, width: '70px' }} rowSpan={2}>DATE</th>
              <th style={{ ...headerStyle, width: '60px' }} rowSpan={2}>BLOCK NO</th>
              <th style={{ ...headerStyle, width: '30px' }} rowSpan={2}>SZ</th>
              <th style={{ ...headerStyle }} colSpan={3}>BUYER NET</th>
              <th style={{ ...headerStyle, width: '50px' }} rowSpan={2}>M3</th>
              <th style={{ ...headerStyle }} colSpan={3}>OUR NET</th>
              <th style={{ ...headerStyle, width: '50px' }} rowSpan={2}>NET CBM</th>
              <th style={{ ...headerStyle, width: '50px' }} rowSpan={2}>DIFF</th>
              <th style={{ ...headerStyle, width: '140px' }} rowSpan={2}>REMARK</th>
              <th style={{ ...headerStyle, width: '70px' }} rowSpan={2}>CLAIM</th>
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
              const allowance = b.allowance !== undefined ? b.allowance : 
                  ((b.type === 'large' ? h.allowanceLarge : b.type === 'other' ? h.allowanceOther : h.allowanceSmall) || 0);
              
              const ourL = b.l1;
              const ourW = b.l2;
              const ourH = b.l3;
              
              const buyerL = ourL; 
              const buyerW = Math.max(ourW - allowance, 0); 
              const buyerH = ourH; 

              const buyerM3 = (buyerL * buyerW * buyerH) / 1000000;
              const ourNetCbm = b.grossCbm || (ourL * ourW * ourH) / 1000000;
              const diffCbm = ourNetCbm - buyerM3;

              return (
                <tr key={b.id}>
                  <td style={cellStyle}>{idx + 1}</td>
                  <td style={cellStyle}>{new Date(b.createdAt || Date.now()).toLocaleDateString('en-GB')}</td>
                  <td style={{ ...cellStyle, fontWeight: '900', color: '#1d4ed8' }}>{b.blockNo}</td>
                  <td style={cellStyle}>C</td>
                  <td style={cellStyle}>{buyerL}</td>
                  <td style={{ ...cellStyle, color: '#dc2626', fontWeight: 'bold' }}>{buyerW}</td>
                  <td style={cellStyle}>{buyerH}</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>{buyerM3.toFixed(3)}</td>
                  <td style={cellStyle}>{ourL}</td>
                  <td style={{ ...cellStyle, color: '#dc2626', fontWeight: 'bold' }}>{ourW}</td>
                  <td style={cellStyle}>{ourH}</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>{ourNetCbm.toFixed(3)}</td>
                  <td style={{ ...cellStyle, fontWeight: 'bold', color: '#4b5563' }}>{diffCbm.toFixed(3)}</td>
                  <td style={{ ...cellStyle, color: '#b91c1c', fontSize: '8px', textAlign: 'left', fontStyle: 'italic', lineHeight: '1.1' }}>
                    {b.remarks || `Allowance of ${allowance}cm applied effectively for net calculation.`}
                  </td>
                  <td style={{ ...cellStyle, padding: '0', fontSize: '7px', fontWeight: 'bold' }}>
                    <div style={{ background: '#f4f4f5', borderBottom: '1px solid black', padding: '1px' }}>SHORT SIZE</div>
                    <div style={{ color: '#000' }}>{allowance} CM</div>
                  </td>
                </tr>
              );
            })}
            {/* Totals Row */}
            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
              <td style={{ ...cellStyle, textAlign: 'right' }} colSpan={7}>TOTALS</td>
              <td style={cellStyle}>
                {blocks.reduce((acc, b) => {
                  const allowance = b.allowance !== undefined ? b.allowance : 
                    ((b.type === 'large' ? h.allowanceLarge : b.type === 'other' ? h.allowanceOther : h.allowanceSmall) || 0);
                  return acc + (b.l1 * Math.max(b.l2 - allowance, 0) * b.l3) / 1000000;
                }, 0).toFixed(3)}
              </td>
              <td style={{ ...cellStyle }} colSpan={3}></td>
              <td style={cellStyle}>{blocks.reduce((acc, b) => acc + (b.grossCbm || (b.l1*b.l2*b.l3)/1000000), 0).toFixed(3)}</td>
              <td style={cellStyle}>
                {(blocks.reduce((acc, b) => acc + (b.grossCbm || (b.l1*b.l2*b.l3)/1000000), 0) - 
                blocks.reduce((acc, b) => {
                  const allowance = b.allowance !== undefined ? b.allowance : 
                    ((b.type === 'large' ? h.allowanceLarge : b.type === 'other' ? h.allowanceOther : h.allowanceSmall) || 0);
                  return acc + (b.l1 * Math.max(b.l2 - allowance, 0) * b.l3) / 1000000;
                }, 0)).toFixed(3)}
              </td>
              <td style={cellStyle} colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 pt-6 border-t-2 border-black flex justify-between items-end px-4">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase text-zinc-500">Summary Information</p>
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


