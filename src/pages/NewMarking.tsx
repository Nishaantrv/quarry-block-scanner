import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useInspectionStore } from '@/store/inspectionStore';
import type { InspectionHeader } from '@/types/inspection';
import { DEFAULT_HEADER } from '@/types/inspection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Ship, Wallet, Ruler, Box, CheckCircle2, Circle } from 'lucide-react';
import { GlassContainer } from '@/components/ui/glass-container';
import { cn } from '@/lib/utils';

export default function NewMarking() {
  const navigate = useNavigate();
  const startNewInspection = useInspectionStore((s) => s.startNewInspection);
  const companyProfile = useInspectionStore((s) => s.companyProfile);
  const customers = useInspectionStore((s) => s.customers);
  const selectedCustomerId = useInspectionStore((s) => s.selectedCustomerId);
  const headerDraft = useInspectionStore((s) => s.headerDraft);
  const updateHeaderDraft = useInspectionStore((s) => s.updateHeaderDraft);
  
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const initialValues = React.useMemo(() => {
    if (headerDraft) return headerDraft as InspectionHeader;
    
    return {
      ...DEFAULT_HEADER,
      // User Profile Defaults
      portOfLoading: companyProfile.defaultPortOfLoading || '',
      // Customer Defaults (Override Profile)
      consignee: selectedCustomer?.name || '',
      consigneeAddress: selectedCustomer?.address || '',
      consigneePhone: selectedCustomer?.phone || '',
      portOfDischarge: selectedCustomer?.defaultPortOfDischarge || '',
      finalDestination: selectedCustomer?.defaultFinalDestination || '',
      finalDestinationCountry: selectedCustomer?.defaultFinalDestinationCountry || '',
      termsOfDelivery: selectedCustomer?.defaultTermsOfDelivery || 'FOB',
      termsOfPayment: selectedCustomer?.defaultTermsOfPayment || '',
      hsCode: selectedCustomer?.defaultHsCode || '',
      currency: selectedCustomer?.defaultCurrency || companyProfile.defaultCurrency || 'USD',
    };
  }, [headerDraft, companyProfile, selectedCustomer]);

  const { register, handleSubmit, watch, setValue } = useForm<InspectionHeader>({
    defaultValues: initialValues,
  });

  // Persist form state to store as user types
  const formValues = watch();
  React.useEffect(() => {
    const timer = setTimeout(() => {
      updateHeaderDraft(formValues);
    }, 1000); // 1s debounce to avoid excessive store updates
    return () => clearTimeout(timer);
  }, [formValues, updateHeaderDraft]);

  const calculationMode = watch('calculationMode');

  const onSubmit = (data: InspectionHeader) => {
    const allowance = Number((data as any).defaultAllowance || 15);
    const price = Number(data.pricePerCbm || 0);

    const headerData: InspectionHeader = {
      ...data,
      pricePerCbm: price,
      startingBlockNumber: Number(data.startingBlockNumber || 1),
      blockTypes: [{ id: '1', name: 'T1', allowance, pricePerCbm: price }]
    };

    startNewInspection(headerData);
    navigate('/marking');
  };

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full bg-card/50 backdrop-blur-md border border-white/5 shadow-sm h-12 w-12"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">New Marking</h1>
          <p className="text-sm text-muted-foreground font-medium">Setup your marking session</p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* CUSTOMER SECTION */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <User className="w-4 h-4" /> Customer Details
          </h2>
          <GlassContainer className="p-4 space-y-4">
            <Field label="Consignee (Required)" placeholder="Enter customer name..." {...register('consignee', { required: true })} />
            <Field label="Address" placeholder="Location..." {...register('consigneeAddress')} />
            <Field label="Customer Phone" placeholder="+91..." {...register('consigneePhone')} />
            <Field label="Buyer if other than consignee" placeholder="Optional..." {...register('buyer')} />
            <Field label="Notify Party" placeholder="Optional..." {...register('notifyParty')} />
          </GlassContainer>
        </section>

        {/* SHIPMENT SECTION */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <Ship className="w-4 h-4" /> Logistics
          </h2>
          <GlassContainer className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pre-Carriage by" {...register('preCarriageBy')} />
              <Field label="Place of Receipt by Pre-Carrier" {...register('placeOfReceipt')} />
              <Field label="Port of Loading" {...register('portOfLoading')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vessel / Flight No" {...register('vessel')} />
              <Field label="Port of Discharge" {...register('portOfDischarge')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Final Destination" {...register('finalDestination')} />
              <Field label="Country of Final Dest." {...register('finalDestinationCountry')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country of Origin" placeholder="e.g. INDIA" {...register('countryOfOrigin')} />
            </div>
          </GlassContainer>
        </section>

        {/* COMMERCIAL SECTION */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <Wallet className="w-4 h-4" /> Commercial
          </h2>
          <GlassContainer className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Currency" {...register('currency')} />
              <Field label="Price / CBM" type="number" step="any" placeholder="0.00" {...register('pricePerCbm')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Payment Terms" {...register('termsOfPayment')} />
              <Field label="HS Code" {...register('hsCode')} />
            </div>
            <Field label="Marks & Nos" {...register('marksAndNos')} />
          </GlassContainer>
        </section>

        {/* INSPECTION SETTINGS */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <Ruler className="w-4 h-4" /> Standard Configuration
          </h2>
          <GlassContainer className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Allowance (cm)" type="number" step="any" placeholder="15" {...register('defaultAllowance' as any)} />
              <Field label="Start Block #" type="number" placeholder="1" {...register('startingBlockNumber')} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Port of Loading" {...register('portOfLoading')} />
            </div>

            <div className="pt-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-3 block">Calculation Mode</Label>
              <div className="grid grid-cols-1 gap-3">
                <div
                  onClick={() => setValue('calculationMode', 'net')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]",
                    calculationMode === 'net'
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                      : "border-border bg-card/50"
                  )}
                >
                  <div className={cn("p-2 rounded-full", calculationMode === 'net' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Box className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">Net (Standard)</div>
                    <div className="text-xs text-muted-foreground">Apply allowance, standard logic</div>
                  </div>
                  {calculationMode === 'net' ? (
                    <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>

                <div
                  onClick={() => setValue('calculationMode', 'gross')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]",
                    calculationMode === 'gross'
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                      : "border-border bg-card/50"
                  )}
                >
                  <div className={cn("p-2 rounded-full", calculationMode === 'gross' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Box className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">Gross (Round Up)</div>
                    <div className="text-xs text-muted-foreground">No allowance, round UP 3 decimals</div>
                  </div>
                  {calculationMode === 'gross' ? (
                    <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>
              </div>
            </div>
          </GlassContainer>
        </section>

        <Button type="submit" size="lg" className="w-full h-16 text-lg font-black tracking-wider uppercase rounded-xl shadow-xl shadow-primary/20 mt-8 mb-8">
          Start Marking Session
        </Button>
      </form>
    </div>
  );
}

const Field = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, className, ...props }, ref) => (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">{label}</Label>
      <Input ref={ref} {...props} className={cn("h-14 font-semibold text-lg bg-background/50", className)} />
    </div>
  ),
);
Field.displayName = 'Field';
