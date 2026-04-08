import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useInspectionStore } from '@/store/inspectionStore';
import type { InspectionHeader } from '@/types/inspection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassContainer } from '@/components/ui/glass-container';
import { cn } from '@/lib/utils';
import { ArrowLeft, FileDown, Ship, Wallet, Box, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FinishDetailsPage() {
    const navigate = useNavigate();
    const inspection = useInspectionStore((s) => s.activeInspection);
    const updateHeader = useInspectionStore((s) => s.updateHeader);
    const finishInspection = useInspectionStore((s) => s.finishInspection);

    const { register, handleSubmit, watch } = useForm<InspectionHeader>({
        defaultValues: inspection?.header ?? {},
    });

    // Auto-save on every change
    const formValues = watch();
    React.useEffect(() => {
        if (!inspection) return;
        
        const data = { ...formValues };
        const numericFields: (keyof InspectionHeader)[] = [
            'pricePerCbm',
            'startingBlockNumber'
        ];

        numericFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '' && typeof data[field] === 'string') {
                // @ts-ignore
                data[field] = Number(data[field]);
            }
        });



        // Debounced update to store
        const timer = setTimeout(() => {
            updateHeader({ ...inspection.header, ...data });
        }, 1000);

        return () => clearTimeout(timer);
    }, [formValues, inspection?.id, updateHeader]);

    React.useEffect(() => {
        if (!inspection) navigate('/');
    }, [inspection, navigate]);

    if (!inspection) return null;

    const totals = inspection.totals;

    const onSubmit = async (data: InspectionHeader) => {
        // Only convert numeric fields if they are present in the form data
        const numericFields: (keyof InspectionHeader)[] = [
            'pricePerCbm',
            'startingBlockNumber'
        ];

        numericFields.forEach(field => {
            if (data[field] !== undefined && data[field] !== '') {
                // @ts-ignore
                data[field] = Number(data[field]);
            } else {
                // Remove from data to not overwrite valid values from existing header
                delete data[field];
            }
        });



        // Apply the completed details to the store
        updateHeader({ ...inspection.header, ...data });

        try {
            await finishInspection();
            toast({ title: 'Inspection Complete', description: 'Saved successfully.' });
            navigate(`/export`);
        } catch (err: any) {
            console.error('CRITICAL SAVE ERROR:', err);
            
            let errorMessage = 'Failed to save';
            let detail = '';
            
            if (err.message) errorMessage = err.message;
            if (err.details) detail = err.details;
            if (err.hint) detail += ` Hint: ${err.hint}`;
            if (err.code) detail += ` (Code: ${err.code})`;
            
            // If it's still generic, try to stringify
            if (errorMessage === 'Failed to save' && typeof err === 'object') {
                errorMessage = JSON.stringify(err).substring(0, 100);
            }
            
            toast({
                title: 'Save Failed',
                description: errorMessage + (detail ? ` - ${detail}` : ''),
                variant: 'destructive',
            });
        }
        // ... existing onSubmit logic ...
    };


    return (
        <div className="min-h-screen pb-32 pt-6 px-4 max-w-md mx-auto">
            {/* Header */}
            <header className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/marking')}
                    className="rounded-full bg-card/50 backdrop-blur-md border border-white/5 shadow-sm h-12 w-12"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Finish Details</h1>
                    <p className="text-sm text-muted-foreground font-medium">Complete remaining info before export</p>
                </div>
            </header>

            {/* Summary pill - 2x2 Grid for alignment */}
            <GlassContainer className="mb-6 p-4 grid grid-cols-2 gap-4 bg-primary/5 border-primary/20">
                <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">No of blocks</div>
                    <div className="text-2xl font-black text-primary leading-none">{totals.totalBlocks}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Net measurement (cbm)</div>
                    <div className="text-2xl font-black text-primary leading-none">{totals.totalNetCbm.toFixed(3)}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Gross measurement (cbm)</div>
                    <div className="text-2xl font-black text-primary leading-none">{totals.totalGrossCbm.toFixed(3)}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Value ($)</div>
                    <div className="text-2xl font-black text-primary truncate leading-none">{totals.totalValue.toLocaleString()}</div>
                </div>
            </GlassContainer>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* SHIPMENT SECTION */}
                <section className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                        <Ship className="w-4 h-4" /> Shipment Details
                    </h2>
                    <GlassContainer className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Vessel / Flight No" placeholder="e.g. MV CORONA" {...register('vessel')} />
                            <Field label="Port of Loading" placeholder="e.g. CHENNAI" {...register('portOfLoading')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Port of Discharge" placeholder="e.g. HAMBURG" {...register('portOfDischarge')} />
                            <Field label="Final Destination" placeholder="e.g. BERLIN" {...register('finalDestination')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Final Dest. Country" placeholder="e.g. GERMANY" {...register('finalDestinationCountry')} />
                            <Field label="Country of Origin" placeholder="e.g. INDIA" {...register('countryOfOrigin')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Pre-Carriage by" {...register('preCarriageBy')} />
                            <Field label="Place of Receipt" {...register('placeOfReceipt')} />
                        </div>
                    </GlassContainer>
                </section>

                {/* COMMERCIAL SECTION */}
                <section className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                        <Wallet className="w-4 h-4" /> Commercial Details
                    </h2>
                    <GlassContainer className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Invoice Number" placeholder="e.g. INV-001" {...register('invoiceNumber')} />
                            <Field label="Exporter Ref No" {...register('exporterRefNumber')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Terms of Delivery" placeholder="e.g. FOB" {...register('termsOfDelivery')} />
                            <Field label="Terms of Payment" placeholder="e.g. 30 Days LC" {...register('termsOfPayment')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Currency" {...register('currency')} />
                            <Field label="Price / CBM" type="number" step="any" {...register('pricePerCbm')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="HS Code" {...register('hsCode')} />
                            <Field label="Marks & Nos" {...register('marksAndNos')} />
                        </div>
                        <Field label="Customer Phone" placeholder="e.g. +91 1234567890" {...register('consigneePhone')} />
                    </GlassContainer>
                </section>

                {/* STONE DETAILS SECTION */}
                <section className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                        <Box className="w-4 h-4" /> Stone Details
                    </h2>
                    <GlassContainer className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Stone Type" placeholder="e.g. BLACK GALAXY" {...register('stoneType')} />
                            <Field label="Kuppam Code" placeholder="e.g. KC-101" {...register('quarryCode')} />
                        </div>
                    </GlassContainer>
                </section>


                {/* SUBMIT */}
                <Button
                    type="submit"
                    size="lg"
                    className="w-full h-16 text-lg font-black tracking-wider uppercase rounded-xl shadow-xl shadow-primary/20 mt-4 mb-8 gap-3"
                >
                    <FileDown className="w-5 h-5" />
                    Finish &amp; Export
                </Button>
            </form>
        </div>
    );
}

/* ──────────────────────────────── */
const Field = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, className, ...props }, ref) => (
    <div className="space-y-1.5">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">{label}</Label>
        <Input ref={ref} {...props} className={cn('h-14 font-semibold text-lg bg-background/50', className)} />
    </div>
));
Field.displayName = 'Field';
