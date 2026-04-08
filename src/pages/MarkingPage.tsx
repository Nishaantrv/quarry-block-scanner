import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/inspectionStore';
import { SummaryBar } from '@/components/SummaryBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, RotateCcw, ChevronLeft, ChevronRight, Camera, X, Settings, Edit3, Trash2, Maximize2, Move, Ruler, Info, AlertTriangle, Check, CheckCircle2, Circle, Plus, User, Ship, Wallet, Box } from 'lucide-react';
import { ObliqueBlockViews } from '@/components/ObliqueBlockViews';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GlassContainer } from '@/components/ui/glass-container';
import { useForm } from 'react-hook-form';
import type { InspectionHeader } from '@/types/inspection';

export default function MarkingPage() {
  const navigate = useNavigate();
  const inspection = useInspectionStore((s) => s.activeInspection);
  const addBlock = useInspectionStore((s) => s.addBlock);
  const updateBlock = useInspectionStore((s) => s.updateBlock);
  const saveInspection = useInspectionStore((s) => s.saveInspection);
  // finishInspection is handled on FinishDetailsPage
  const updateHeader = useInspectionStore((s) => s.updateHeader);
  const addBlockType = useInspectionStore((s) => s.addBlockType);
  const updateBlockType = useInspectionStore((s) => s.updateBlockType);
  const updateDraftBlock = useInspectionStore((s) => s.updateDraftBlock);

  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');
  const [remarks, setRemarks] = useState('');
  const [blockType, setBlockType] = useState<string>('1');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ blockNo: number; dims: string; netCbm: string } | null>(null);

  // Navigation: -1 means "new block mode", 0..n means viewing block at that index
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Edit start info panel
  const [showEditHeader, setShowEditHeader] = useState(false);
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);
  const [activeType, setActiveType] = useState<string>('1');

  const l1Ref = useRef<HTMLInputElement>(null);
  const l2Ref = useRef<HTMLInputElement>(null);
  const l3Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inspection) navigate('/');
    
    // Load draft if we are in "new block" mode and it exists
    if (inspection?.draftBlock && currentIndex === -1 && !l1 && !l2 && !l3) {
      setL1(inspection.draftBlock.l1);
      setL2(inspection.draftBlock.l2);
      setL3(inspection.draftBlock.l3);
      setRemarks(inspection.draftBlock.remarks);
      setBlockType(inspection.draftBlock.type);
    }
  }, [inspection, navigate, currentIndex]);

  // Sync back to store draft
  useEffect(() => {
    if (currentIndex === -1 && inspection) {
        const timer = setTimeout(() => {
            updateDraftBlock({
                l1, l2, l3, remarks, type: blockType, manualAllowance: ''
            });
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [l1, l2, l3, remarks, blockType, currentIndex, inspection?.id]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useInspectionStore((s) => s.uploadPhoto);

  if (!inspection) return null;

  const blocks = inspection.blocks;
  const isEditing = currentIndex >= 0 && currentIndex < blocks.length;
  const currentBlock = isEditing ? blocks[currentIndex] : null;

  const nextBlockNo = blocks.length === 0
    ? inspection.header.startingBlockNumber
    : blocks[blocks.length - 1].blockNo + 1;

  const displayBlockNo = isEditing
    ? currentBlock!.blockNo
    : nextBlockNo;

  const goToPrevious = () => {
    if (isEditing) {
      saveCurrentEdit();
      if (currentIndex > 0) {
        loadBlock(currentIndex - 1);
      }
    } else if (!isEditing && blocks.length > 0) {
      loadBlock(blocks.length - 1);
    }
  };

  const loadBlock = (index: number) => {
    const block = blocks[index];
    setL1(String(block.l1));
    setL2(String(block.l2));
    setL3(String(block.l3));
    setRemarks(block.remarks || '');
    setBlockType(block.type || '1');
    setPhotoUrls(block.photoUrls || (block.photoUrl ? [block.photoUrl] : []));
    setRotation(0);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (isEditing) {
      // Save edits to current block first
      saveCurrentEdit();

      if (currentIndex < blocks.length - 1) {
        loadBlock(currentIndex + 1);
      } else {
        // Back to new block mode
        resetForm();
      }
    }
  };

  const saveCurrentEdit = () => {
    const v1 = parseFloat(l1);
    const v2 = parseFloat(l2);
    const v3 = parseFloat(l3);
    if (!isNaN(v1) && !isNaN(v2) && !isNaN(v3) && v1 > 0 && v2 > 0 && v3 > 0) {
      updateBlock(currentBlock!.id, v1, v2, v3, remarks, currentBlock?.allowance, blockType as any, currentBlock?.pricePerCbm, undefined, photoUrls);
    }
  };

  const resetForm = () => {
    setL1('');
    setL2('');
    setL3('');
    setRemarks('');
    setBlockType('1');
    setPhotoUrls([]);
    setRotation(0);
    setCurrentIndex(-1);
    l1Ref.current?.focus();
  };

  const handleNextBlock = () => {
    if (isEditing) {
      goToNext();
      return;
    }

    // VALIDATION
    const v1 = parseFloat(l1);
    const v2 = parseFloat(l2);
    const v3 = parseFloat(l3);
    if (isNaN(v1) || isNaN(v2) || isNaN(v3) || v1 <= 0 || v2 <= 0 || v3 <= 0) {
      toast({ title: 'Invalid Dimensions', description: 'Please enter valid positive numbers.', variant: 'destructive' });
      return;
    }

    const h = inspection.header;
    const preset = h.blockTypes.find((p: any) => p.id === activeType) || h.blockTypes[0];
    const allowanceValue = preset.allowance;
    const priceValue = preset.pricePerCbm;

    addBlock(v1, v2, v3, remarks, allowanceValue, activeType, priceValue, undefined, photoUrls);

    // Feedback calculations
    const n1 = Math.max(v1 - allowanceValue, 0);
    const n2 = Math.max(v2 - allowanceValue, 0);
    const n3 = Math.max(v3 - allowanceValue, 0);
    const netCbm = (n1 * n2 * n3) / 1_000_000;

    setLastAdded({
      blockNo: nextBlockNo,
      dims: `${v1} × ${v2} × ${v3}`,
      netCbm: netCbm.toFixed(4),
    });

    if (navigator.vibrate) navigator.vibrate(50);
    setL1(''); setL2(''); setL3(''); setRemarks(''); setPhotoUrls([]); setRotation(0);
    l1Ref.current?.focus();
    updateDraftBlock(undefined);
    setTimeout(() => setLastAdded(null), 2500);
  };

  const confirmEditType = (allowance: number, pricePerCbm: number) => {
    const types = inspection.header.blockTypes || [];
    const exists = types.some(p => p.id === activeType);
    if (!exists) {
      // Adding a brand-new type
      addBlockType({ id: activeType, allowance, pricePerCbm });
      toast({ title: `Type T${activeType} Added`, description: `Allowance: ${allowance}cm, Price: ${pricePerCbm}` });
    } else {
      // Updating an existing type
      updateBlockType({ id: activeType, allowance, pricePerCbm });
      toast({ title: `Type T${activeType} Updated`, description: `Allowance: ${allowance}cm, Price: ${pricePerCbm}` });
    }
    setShowEditTypeModal(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = Array.from(files).map(file => uploadPhoto(file));
      const urls = await Promise.all(uploadPromises);
      setPhotoUrls(prev => [...prev, ...urls]);
      toast({ title: 'Photos Uploaded', description: `${urls.length} photos added to block.` });
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  const removePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFinishInspection = () => {
    if (isEditing) saveCurrentEdit();
    navigate('/finish-details');
  };

  // Keyboard navigation for inputs
  const handleKeyDown = (e: React.KeyboardEvent, next: React.RefObject<HTMLInputElement> | null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (next?.current) {
        next.current.focus();
        // Select all text on focus for easy overwrite
        next.current.select();
      } else {
        handleNextBlock();
      }
    }
  };

  const totals = useInspectionStore((s) => s.activeInspection?.totals) || inspection.totals;
  const canGoPrev = isEditing ? currentIndex > 0 : blocks.length > 0;

  // Calculating active volume on the fly for preview
  const previewNetCbm = (() => {
    const v1 = parseFloat(l1);
    const v2 = parseFloat(l2);
    const v3 = parseFloat(l3);
    if (isNaN(v1) || isNaN(v2) || isNaN(v3)) return null;
    const h = inspection.header;
    const preset = h.blockTypes.find((p: any) => p.id === activeType) || h.blockTypes[0];
    const currentAllowance = preset.allowance;

    const n1 = Math.max(v1 - currentAllowance, 0);
    const n2 = Math.max(v2 - currentAllowance, 0);
    const n3 = Math.max(v3 - currentAllowance, 0);
    return ((n1 * n2 * n3) / 1_000_000).toFixed(3);
  })();

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      {/* HEADER */}
      <header className="p-4 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex bg-card/50 rounded-full p-1 border border-border shadow-sm shrink-0">
          <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 hover:bg-muted" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 flex flex-col justify-center border-l border-border/50 ml-1">
            <span className="text-xs font-bold leading-none truncate max-w-[80px]">{inspection.header.consignee}</span>
          </div>
        </div>

        {/* TYPE SWITCHER */}
        <div className="flex-1 flex items-center justify-center gap-1.5 bg-card/50 border border-border p-0.5 rounded-full px-1 max-w-[260px] overflow-hidden">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
            onClick={() => {
              const types = inspection.header.blockTypes || [];
              const nextId = String(types.length + 1);
              // Pre-set the pending type id and open modal — type is NOT saved yet
              setActiveType(nextId);
              setShowEditTypeModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="h-5 w-[1px] bg-border mx-0.5 shrink-0" />
          <div className="flex gap-1 overflow-x-auto scrollbar-hide overflow-y-hidden">
            {(inspection.header.blockTypes || []).map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveType(p.id)}
                onDoubleClick={() => {
                    setActiveType(p.id);
                    setShowEditTypeModal(true);
                }}
                className={cn(
                  "h-8 px-3 rounded-full text-[10px] font-black transition-all shrink-0 uppercase leading-none flex items-center justify-center",
                  activeType === p.id 
                    ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                T{p.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEditHeader(true)}
            className="rounded-full h-10 w-10 bg-card/50 border border-border text-muted-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            saveInspection();
            toast({ title: 'Saved', description: 'Inspection saved locally.' });
          }} className="rounded-full h-10 w-10 bg-primary/10 text-primary border border-primary/20">
            <Save className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* MAIN HUD */}
      <div className="flex-1 flex flex-col px-4 max-w-md mx-auto w-full">

        {/* STATUS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className={cn("px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-2", isEditing ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-primary/10 text-primary border border-primary/20 shadow-sm")}>
              {isEditing ? <Edit3 className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {isEditing ? `Modifying #${currentIndex + 1}` : `New Block #${blocks.length + 1}`}
            </div>

            <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-md">
              <span className="text-[9px] font-black uppercase text-muted-foreground mr-1">Status:</span>
              <span className="text-xs font-black text-primary px-1">ACTIVE</span>
            </div>
          </div>

          {previewNetCbm && (
            <div className="text-xs font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 animate-in fade-in slide-in-from-right-2">
              ~{previewNetCbm} m³
            </div>
          )}
        </div>

        {/* BLOCK VISUALIZER CARD */}
        <GlassContainer className="relative overflow-hidden mb-6 min-h-[160px] flex items-center justify-center bg-gradient-to-br from-card/80 via-card/50 to-transparent">
          {/* Large Watermark Number */}
          <div className="absolute right-[-20px] top-[-30px] text-[120px] font-black text-foreground/5 pointer-events-none select-none leading-none z-0">
            {String(displayBlockNo)}
          </div>

          <div className="z-10 w-full flex flex-col items-center py-2 sm:py-4 scale-75 sm:scale-90 origin-center transition-transform">
            <ObliqueBlockViews
              length={parseFloat(l1) || 0}
              height={parseFloat(l2) || 0}
              width={parseFloat(l3) || 0}
            />
          </div>

          {/* Block ID Badge */}
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg shadow-sm z-20">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2">Block</span>
            <span className="text-xl font-black text-primary">#{String(displayBlockNo).padStart(3, '0')}</span>
          </div>

          {/* Photo Actions */}
          <div className="absolute bottom-4 right-4 z-20 flex gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-10 px-4 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary border-none shadow-lg gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {photoUrls.length > 0 ? `ADD PHOTO (${photoUrls.length})` : 'ADD PHOTO'}
            </Button>
          </div>
        </GlassContainer>

        {/* INPUTS */}
        <div className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 gap-3">
            <DimensionInput
              label="Length"
              value={l1}
              onChange={setL1}
              ref={l1Ref}
              onKeyDown={(e) => handleKeyDown(e, l2Ref)}
              autoFocus={!isEditing} // Autofocus only on new blocks
            />
            <DimensionInput
              label="Height"
              value={l2}
              onChange={setL2}
              ref={l2Ref}
              onKeyDown={(e) => handleKeyDown(e, l3Ref)}
            />
            <DimensionInput
              label="Width"
              value={l3}
              onChange={setL3}
              ref={l3Ref}
              onKeyDown={(e) => handleKeyDown(e, null)}
            />
            <div className="space-y-1.5 px-1 pt-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Remarks</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes for this block..."
                className="h-12 text-sm font-semibold bg-card border-2 border-border focus:border-primary rounded-xl"
              />
            </div>

            {/* PHOTOS LIST BELOW REMARKS */}
            {photoUrls.length > 0 && (
              <div className="space-y-1.5 px-1 pt-2 animate-in fade-in slide-in-from-bottom-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Photos ({photoUrls.length})</Label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {photoUrls.map((url, idx) => (
                    <div key={idx} className="relative group/photo shrink-0">
                      <img
                        src={url}
                        alt={`Block Photo ${idx + 1}`}
                        className="h-24 w-24 object-cover rounded-xl border border-border transition-transform hover:scale-[1.02]"
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:scale-110 transition-transform z-20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-6 mt-auto pb-4 space-y-4">
          <div className="flex gap-4">
            {/* PREVIOUS BUTTON */}
            {canGoPrev && (
              <Button
                onClick={goToPrevious}
                variant="outline"
                className="flex-1 h-20 text-xl font-bold tracking-wider rounded-2xl border-2 hover:bg-muted/50"
              >
                <ChevronLeft className="mr-2 w-6 h-6" />
                PREV
              </Button>
            )}

            {/* NEXT / ADD BUTTON */}
            <Button
              onClick={handleNextBlock}
              className={cn(
                "h-20 text-2xl font-black tracking-widest shadow-[0_10px_40px_-10px_rgba(var(--primary),0.5)] transition-all active:scale-[0.98] rounded-2xl relative overflow-hidden group",
                canGoPrev ? "flex-[2]" : "w-full",
                !l1 || !l2 || !l3 ? "opacity-90" : "animate-pulse-subtle"
              )}
              disabled={!l1 || !l2 || !l3}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isEditing ? 'UPDATE' : 'NEXT BLOCK'}
              <ChevronRight className="ml-2 w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>

          {/* FINISH BUTTON */}
          {blocks.length > 0 && !isEditing && (
            <div className="flex justify-center">
              <Button
                onClick={handleFinishInspection}
                variant="secondary"
                className="border-2 border-primary text-primary hover:bg-primary/10 hover:border-primary transition-all uppercase font-bold text-sm tracking-widest h-12 px-8 rounded-full shadow-lg gap-2"
              >
                Finish Details →
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* FEEDBACK TOAST (Custom inline) */}
      {lastAdded && !isEditing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
          <GlassContainer className="bg-success text-success-foreground border-success/30 flex items-center justify-between p-4 shadow-xl animate-in slide-in-from-top-4 fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase opacity-90">Block #{String(lastAdded.blockNo).padStart(3, '0')} Added</div>
                <div className="font-black text-lg leading-none">{lastAdded.netCbm} m³</div>
              </div>
            </div>
            <div className="text-right opacity-80 font-mono text-sm">
              {lastAdded.dims}
            </div>
          </GlassContainer>
        </div>
      )}

      {/* Sticky footer only if needed by screen size, otherwise handled by padding */}
      <SummaryBar totals={totals} />

      {/* EDIT HEADER PANEL */}
      {showEditHeader && (
        <EditHeaderPanel
          header={inspection.header}
          blocksCount={blocks.length}
          onClose={() => setShowEditHeader(false)}
          onSave={(updatedHeader) => {
            updateHeader(updatedHeader);
            setShowEditHeader(false);
            toast({ title: 'Session Updated', description: 'Start marking info has been updated.' });
          }}
        />
      )}
      {/* EDIT TYPE MODAL */}
      {showEditTypeModal && (
        <EditTypeModal
          header={inspection.header}
          activeType={activeType}
          onClose={() => setShowEditTypeModal(false)}
          onConfirm={confirmEditType}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Edit Header Panel (slide-up drawer)
───────────────────────────────────────────────────────────── */
interface EditHeaderPanelProps {
  header: InspectionHeader;
  blocksCount: number;
  onClose: () => void;
  onSave: (header: InspectionHeader) => void;
}

function EditHeaderPanel({ header, blocksCount, onClose, onSave }: EditHeaderPanelProps) {
  const { register, handleSubmit, watch, setValue } = useForm<InspectionHeader>({
    defaultValues: { ...header },
  });

  const calculationMode = watch('calculationMode');

  const onSubmit = (data: InspectionHeader) => {
    data.pricePerCbm = Number(data.pricePerCbm);
    data.startingBlockNumber = Number(data.startingBlockNumber);
    onSave(data);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] flex flex-col bg-background rounded-t-3xl border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 pb-4 pt-2 border-b border-border">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Edit Session Info</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Changes apply to all existing & future blocks</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form id="edit-header-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* CUSTOMER SECTION */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Customer Details
              </h3>
              <div className="space-y-3 bg-card/50 rounded-2xl border border-border p-4">
                <PanelField label="Consignee" {...register('consignee', { required: true })} />
                <PanelField label="Address" {...register('consigneeAddress')} />
                <PanelField label="Buyer (if other than consignee)" {...register('buyer')} />
                <PanelField label="Notify Party" {...register('notifyParty')} />
              </div>
            </section>

            {/* SHIPMENT SECTION */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Ship className="w-3.5 h-3.5" /> Logistics
              </h3>
              <div className="space-y-3 bg-card/50 rounded-2xl border border-border p-4">
                <div className="grid grid-cols-2 gap-3">
                  <PanelField label="Pre-Carriage by" {...register('preCarriageBy')} />
                  <PanelField label="Place of Receipt" {...register('placeOfReceipt')} />
                  <PanelField label="Port of Loading" {...register('portOfLoading')} />
                  <PanelField label="Vessel / Flight No" {...register('vessel')} />
                  <PanelField label="Port of Discharge" {...register('portOfDischarge')} />
                  <PanelField label="Final Destination" {...register('finalDestination')} />
                  <PanelField label="Final Dest. Country" {...register('finalDestinationCountry')} />
                  <PanelField label="Country of Origin" {...register('countryOfOrigin')} />
                </div>
              </div>
            </section>

            {/* COMMERCIAL SECTION */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5" /> Commercial
              </h3>
              <div className="space-y-3 bg-card/50 rounded-2xl border border-border p-4">
                <div className="grid grid-cols-2 gap-3">
                  <PanelField label="Currency" {...register('currency')} />
                  <PanelField label="Price / CBM" type="number" step="any" {...register('pricePerCbm')} />
                  <PanelField label="Payment Terms" {...register('termsOfPayment')} />
                  <PanelField label="HS Code" {...register('hsCode')} />
                </div>
                <PanelField label="Marks & Nos" {...register('marksAndNos')} />
              </div>
            </section>

            {/* INSPECTION SETTINGS */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Ruler className="w-3.5 h-3.5" /> Inspection Settings
              </h3>
              <div className="space-y-4 bg-card/50 rounded-2xl border border-border p-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">
                    Start Block #
                  </Label>
                  <Input
                    type="number"
                    {...register('startingBlockNumber')}
                    className="h-11 font-semibold text-base bg-background/50"
                  />
                </div>
                {blocksCount > 0 && (
                  <p className="text-[10px] text-amber-500 pl-1 font-medium -mt-1">
                    ⚠ Start # re-numbers all {blocksCount} blocks
                  </p>
                )}

                {/* Calculation Mode */}
                <div>
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-3 block">Calculation Mode</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div
                      onClick={() => setValue('calculationMode', 'net')}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]",
                        calculationMode === 'net'
                          ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                          : "border-border bg-card/50"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-full", calculationMode === 'net' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Box className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-foreground">Net (Standard)</div>
                        <div className="text-xs text-muted-foreground">Apply allowance, standard logic</div>
                      </div>
                      {calculationMode === 'net' ? (
                        <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </div>

                    <div
                      onClick={() => setValue('calculationMode', 'gross')}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]",
                        calculationMode === 'gross'
                          ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                          : "border-border bg-card/50"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-full", calculationMode === 'gross' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Box className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-foreground">Gross (Round Up)</div>
                        <div className="text-xs text-muted-foreground">No allowance, round UP 3 decimals</div>
                      </div>
                      {calculationMode === 'gross' ? (
                        <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </form>
        </div>

        {/* Footer with Save Button */}
        <div className="px-5 py-4 border-t border-border bg-background/80 backdrop-blur-md">
          <Button
            type="submit"
            form="edit-header-form"
            className="w-full h-14 text-base font-black tracking-wider uppercase rounded-2xl shadow-lg shadow-primary/20"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Panel Field component (smaller, for the drawer)
───────────────────────────────────────────────────────────── */
const PanelField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, className, ...props }, ref) => (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">{label}</Label>
      <Input ref={ref} {...props} className={cn("h-11 font-semibold text-base bg-background/50", className)} />
    </div>
  ),
);
PanelField.displayName = 'PanelField';

/* ─────────────────────────────────────────────────────────────
   Edit Type Modal
───────────────────────────────────────────────────────────── */
interface EditTypeModalProps {
  header: InspectionHeader;
  activeType: string;
  onClose: () => void;
  onConfirm: (allowance: number, price: number) => void;
}

function EditTypeModal({ header, activeType, onClose, onConfirm }: EditTypeModalProps) {
  const existingPreset = header.blockTypes.find(p => p.id === activeType);
  const isNew = !existingPreset;
  // For new types, pre-fill with the last type's values as a template
  const lastPreset = header.blockTypes[header.blockTypes.length - 1];
  const preset = existingPreset || { allowance: lastPreset?.allowance || 15, pricePerCbm: lastPreset?.pricePerCbm || 0 };

  const [allowance, setAllowance] = useState(String(preset.allowance));
  const [price, setPrice] = useState(String(preset.pricePerCbm));

  const isT1 = activeType === '1';

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] bg-background rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 flex flex-col max-w-md mx-auto overflow-hidden">
        
        <div className="p-6 border-b border-border bg-muted/30">
          <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2", isNew ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600")}>
            {isNew ? '+ New Type' : 'Edit Type'}
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">Type T{activeType}</h2>
          <p className="text-xs text-muted-foreground mt-1">{isNew ? 'Set the allowance and price for this new preset' : 'Update allowance and price for this preset'}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Allowance (cm)
            </Label>
            <Input
              type="number"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              disabled={isT1}
              className={cn(
                "h-14 text-2xl font-black tabular-nums bg-card border-2 border-primary/20 focus:border-primary",
                isT1 && "opacity-60 grayscale cursor-not-allowed"
              )}
            />
            {isT1 && (
              <p className="text-[10px] text-amber-500 font-bold uppercase mt-1 pl-1">
                T1 Allowance is static and cannot be changed
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Price / CBM ({header.currency})
            </Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-14 text-2xl font-black tabular-nums bg-card border-2 border-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-wider">
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm(parseFloat(allowance) || 0, parseFloat(price) || 0)}
            className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-primary/20"
          >
            {isNew ? `Add T${activeType}` : `Save T${activeType}`}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Dimension Input (for block measurements)
───────────────────────────────────────────────────────────── */
const DimensionInput = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    value: string;
    onChange: (v: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    autoFocus?: boolean;
  }
>(({ label, value, onChange, onKeyDown, autoFocus }, ref) => (
  <div className="relative group">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors">
      {label}
    </span>
    <Input
      ref={ref}
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      placeholder="0"
      className="h-20 pl-24 pr-6 text-4xl font-black text-right tabular-nums bg-card border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl shadow-sm transition-all"
      onFocus={(e) => e.target.select()}
    />
  </div>
));
DimensionInput.displayName = 'DimensionInput';
