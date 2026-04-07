import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Trash2, X, Check, FileText, Search, Settings2, Download, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { InspectionHeader } from '@/types/inspection';
import { cn } from '@/lib/utils';
import { MobileCard } from '@/components/ui/mobile-card';
import { GlassContainer } from '@/components/ui/glass-container';
import { ObliqueBlockViews } from '@/components/ObliqueBlockViews';

export default function EditPage() {
  const navigate = useNavigate();
  const inspection = useInspectionStore((s) => s.activeInspection);
  const updateBlock = useInspectionStore((s) => s.updateBlock);
  const deleteBlock = useInspectionStore((s) => s.deleteBlock);
  const updateHeader = useInspectionStore((s) => s.updateHeader);
  const saveInspection = useInspectionStore((s) => s.saveInspection);
  const uploadPhoto = useInspectionStore((s) => s.uploadPhoto);

  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editL1, setEditL1] = useState('');
  const [editL2, setEditL2] = useState('');
  const [editL3, setEditL3] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editAllowance, setEditAllowance] = useState('');
  const [editType, setEditType] = useState<string>('1');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!inspection) {
    navigate('/');
    return null;
  }

  // Filter blocks based on search
  const filteredBlocks = useMemo(() => {
    if (!searchQuery) return inspection.blocks;
    return inspection.blocks.filter(b => b.blockNo.toString().includes(searchQuery));
  }, [inspection.blocks, searchQuery]);

  const startEdit = (blockId: string) => {
    const block = inspection.blocks.find((b) => b.id === blockId);
    if (!block) return;
    setEditingBlock(blockId);
    setEditL1(block.l1.toString());
    setEditL2(block.l2.toString());
    setEditL3(block.l3.toString());
    setEditRemarks(block.remarks || '');
    setEditAllowance(block.allowance !== undefined ? block.allowance.toString() : '');
    setEditType(block.type || '1');
  };

  const confirmEdit = () => {
    if (!editingBlock) return;
    const v1 = parseFloat(editL1);
    const v2 = parseFloat(editL2);
    const v3 = parseFloat(editL3);
    const vAllowance = editAllowance === '' ? undefined : parseFloat(editAllowance);
    if (isNaN(v1) || isNaN(v2) || isNaN(v3)) return;
    updateBlock(editingBlock, v1, v2, v3, editRemarks, vAllowance, editType);
    setEditingBlock(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const block = inspection.blocks.find(b => b.id === blockId);
    if (!block) return;

    try {
      setIsUploading(blockId);
      const uploadPromises = Array.from(files).map(file => uploadPhoto(file));
      const urls = await Promise.all(uploadPromises);
      const newPhotoUrls = [...(block.photoUrls || []), ...urls];
      updateBlock(block.id, block.l1, block.l2, block.l3, block.remarks, block.allowance, block.type, undefined, undefined, newPhotoUrls);
    } catch (error: any) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background px-4 pt-4">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/marking')} className="rounded-full bg-card/50 border border-border">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" className="rounded-full bg-card/50" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="outline" className="rounded-full bg-card/50" onClick={() => navigate('/export')}>
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* HEADER EDITOR OVERLAY */}
      {showSettings && (
        <div className="mb-6 animate-in slide-in-from-top-2 fade-in">
          <GlassContainer className="p-4 border-primary/20 bg-primary/5">
            <HeaderEditor header={inspection.header} onSave={(h) => { updateHeader(h); setShowSettings(false); }} onCancel={() => setShowSettings(false)} />
          </GlassContainer>
        </div>
      )}

      {/* SUMMARY STATS BAR */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatBox label="Count" value={inspection.totals.totalBlocks.toString()} />
        <StatBox label="Gross" value={inspection.totals.totalGrossCbm.toFixed(2)} />
        <StatBox label="Net" value={inspection.totals.totalNetCbm.toFixed(2)} highlighted />
        <StatBox label="Value" value={
          new Intl.NumberFormat('en-US', { style: 'currency', currency: inspection.header.currency || 'USD', notation: 'compact' }).format(inspection.totals.totalValue)
        } />
      </div>

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="h-12 pl-10 bg-card/50 backdrop-blur-sm border-border/50 rounded-xl"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* CONTENT LIST */}
      <div className="space-y-3">
        {filteredBlocks.map((block) => (
          <React.Fragment key={block.id}>
            {editingBlock === block.id ? (
              <GlassContainer className="p-4 border-primary ring-2 ring-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-black text-2xl text-primary">#{String(block.blockNo).padStart(3, '0')}</span>
                  <div className="flex gap-2">
                    <Button size="icon" className="rounded-full h-8 w-8 bg-success hover:bg-success/90 text-success-foreground" onClick={confirmEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="rounded-full h-8 w-8" onClick={() => setEditingBlock(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <EditInput label="Length" value={editL1} onChange={setEditL1} autoFocus />
                  <EditInput label="Height" value={editL2} onChange={setEditL2} />
                  <EditInput label="Width" value={editL3} onChange={setEditL3} />
                  <EditInput label="Allowance" value={editAllowance} onChange={setEditAllowance} />
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground pl-1">Type</Label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full h-10 px-2 rounded-md bg-background border border-input font-bold text-[10px] uppercase"
                    >
                      {inspection.header.blockTypes.map(t => (
                        <option key={t.id} value={t.id}>T{t.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground pl-1">Remarks</Label>
                  <Input
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Optional remarks..."
                    className="h-10 bg-background/50 text-sm font-semibold mt-1"
                  />
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handlePhotoUpload(e, block.id)}
                    accept="image/*"
                    multiple
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-16 w-16 shrink-0 rounded-xl border-dashed flex flex-col gap-1 text-[10px] uppercase font-bold"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading === block.id}
                  >
                    {isUploading === block.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                  {(block.photoUrls || []).map((url, idx) => (
                    <div key={idx} className="relative group shrink-0">
                      <img src={url} alt="" className="h-16 w-16 object-cover rounded-xl border border-border" />
                      <button
                        onClick={() => {
                          const newUrls = block.photoUrls!.filter((_, i) => i !== idx);
                          updateBlock(block.id, block.l1, block.l2, block.l3, block.remarks, block.allowance, block.type, undefined, undefined, newUrls);
                        }}
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 shadow-lg"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassContainer>
            ) : (
              <MobileCard
                title={`Block #${String(block.blockNo).padStart(3, '0')}`}
                subtitle={`${block.l1} × ${block.l2} × ${block.l3}`}
                onClick={() => startEdit(block.id)}
                thumbnail={
                  <div className="w-full h-full flex items-center justify-center bg-muted/20 scale-150 opacity-50">
                    <ObliqueBlockViews length={block.l1} height={block.l2} width={block.l3} />
                  </div>
                }
                action={
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Block #{String(block.blockNo).padStart(3, '0')}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This block will be permanently removed from the inspection.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                }
              >
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-right">
                  <div className="font-black text-lg tabular-nums">{block.netCbm.toFixed(3)}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">NET CBM</div>
                  <div className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                    {(() => {
                        const preset = inspection.header.blockTypes.find(p => p.id === block.type) || inspection.header.blockTypes[0];
                        return `T${block.type || '1'}: ${block.allowance !== undefined ? block.allowance : preset.allowance}`;
                    })()}
                  </div>
                </div>
                {block.remarks && (
                  <div className="mt-2 text-[10px] text-muted-foreground border-t border-border/50 pt-1 italic">
                    {block.remarks}
                  </div>
                )}
              </MobileCard>
            )}
          </React.Fragment>
        ))}

        {filteredBlocks.length === 0 && (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2 opacity-50">
            <Search className="h-12 w-12" />
            <p>No blocks found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, highlighted }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-2 rounded-xl border bg-card/50 backdrop-blur-sm",
      highlighted ? "border-primary/30 bg-primary/5 shadow-sm" : "border-border/50"
    )}>
      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">{label}</span>
      <span className={cn("text-xs font-black tabular-nums truncate w-full text-center", highlighted && "text-primary scale-105")}>{value}</span>
    </div>
  )
}

function EditInput({ label, value, onChange, autoFocus }: { label: string, value: string, onChange: (v: string) => void, autoFocus?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase font-bold text-muted-foreground pl-1">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-bold text-center h-10 bg-background/50"
        autoFocus={autoFocus}
        onFocus={(e) => e.target.select()}
      />
    </div>
  )
}

function HeaderEditor({ header, onSave, onCancel }: { header: InspectionHeader; onSave: (h: InspectionHeader) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ ...header });
  const set = (key: keyof InspectionHeader, val: string) => setForm({ ...form, [key]: val } as any);

  const handleSave = () => {
    onSave({
      ...form,
      pricePerCbm: Number(form.pricePerCbm),
      startingBlockNumber: Number(form.startingBlockNumber),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Session Details</h2>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs uppercase font-bold text-muted-foreground">Consignee</Label>
          <Input value={form.consignee} onChange={(e) => set('consignee', e.target.value)} className="bg-background/50 font-bold" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs uppercase font-bold text-muted-foreground">Customer Phone</Label>
          <Input value={form.consigneePhone || ''} onChange={(e) => set('consigneePhone', e.target.value)} className="bg-background/50 font-bold" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Price</Label>
            <Input type="number" value={String(form.pricePerCbm)} onChange={(e) => set('pricePerCbm', e.target.value)} className="bg-background/50 font-bold" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button className="flex-1 font-bold" onClick={handleSave}>Save Changes</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
