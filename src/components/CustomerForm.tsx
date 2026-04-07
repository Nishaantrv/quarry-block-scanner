import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useInspectionStore } from '@/store/inspectionStore';
import type { Customer } from '@/types/inspection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GlassContainer } from './ui/glass-container';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: (customerId: string) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const saveCustomer = useInspectionStore((s) => s.saveCustomer);

  const { register, control, handleSubmit, reset } = useForm<Customer>({
    defaultValues: customer || {
      name: '',
      address: '',
      country: '',
      defaultCurrency: 'USD',
      otherReferences: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "otherReferences" as any,
  } as any);

  useEffect(() => {
    if (customer) reset(customer);
  }, [customer, reset]);

  const onSubmit = async (data: Customer) => {
    try {
      const id = await saveCustomer(data);
      toast({ title: customer ? 'Customer updated' : 'Customer created' });
      onSuccess(id);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error saving customer', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-black uppercase tracking-tight">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        <Section title="Basic Info">
          <Field label="Customer / Consignee Name (Required)" {...register('name', { required: true })} />
          <Field label="Address" {...register('address')} />
          <div className="grid grid-cols-2 gap-3">
             <Field label="Country" {...register('country')} />
             <Field label="Phone" {...register('phone')} />
          </div>
          <Field label="Email" {...register('email')} />
        </Section>

        <Section title="Registration & References">
          <div className="grid grid-cols-2 gap-3">
            <Field label="GST Number" {...register('gstNumber')} />
            <Field label="RBI Code" {...register('rbiCode')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <Field label="IE Code" {...register('ieCode')} />
             <Field label="LUT Number" {...register('lutNumber')} />
          </div>

          <div className="space-y-3 mt-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Other References</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`otherReferences.${index}` as any)} placeholder="e.g. HS CODE: 6802" className="h-10 bg-background/50" />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append('' as any)}
              className="w-full border-dashed bg-background/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reference Line
            </Button>
          </div>
        </Section>

        <Section title="Bank Details">
          <Field label="Bank Name" {...register('bankName')} />
          <Field label="Branch" {...register('bankBranch')} />
          <Field label="Bank Address" {...register('bankAddress')} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Account Number" {...register('accountNumber')} />
            <Field label="SWIFT Code" {...register('swiftCode')} />
          </div>
        </Section>

        <Section title="Shipping Defaults">
           <div className="grid grid-cols-2 gap-3">
              <Field label="Port of Discharge" {...register('defaultPortOfDischarge')} />
              <Field label="Final Destination" {...register('defaultFinalDestination')} />
           </div>
           <div className="grid grid-cols-2 gap-3">
              <Field label="Destination Country" {...register('defaultFinalDestinationCountry')} />
              <Field label="HS Code" {...register('defaultHsCode')} />
           </div>
           <div className="grid grid-cols-2 gap-3">
              <Field label="Terms of Delivery" {...register('defaultTermsOfDelivery')} />
              <Field label="Terms of Payment" {...register('defaultTermsOfPayment')} />
           </div>
           <div className="grid grid-cols-2 gap-3">
              <Field label="Currency" {...register('defaultCurrency')} />
              <Field label="Port of Loading" {...register('defaultPortOfLoading')} />
           </div>
        </Section>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-14 font-bold uppercase">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 h-14 font-bold uppercase bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Save className="w-4 h-4 mr-2" />
          Save Customer
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1 px-1">{title}</h3>
      <GlassContainer className="p-4 space-y-4">
        {children}
      </GlassContainer>
    </div>
  );
}

const Field = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 pl-1">{label}</Label>
      <Input ref={ref} {...props} className="h-12 bg-background/50 font-medium" />
    </div>
  ),
);
Field.displayName = 'Field';
