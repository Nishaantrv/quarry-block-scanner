import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useInspectionStore } from '@/store/inspectionStore';
import type { CompanyProfile } from '@/types/inspection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MyAccountPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const companyProfile = useInspectionStore((s) => s.companyProfile);
  const setCompanyProfile = useInspectionStore((s) => s.setCompanyProfile);

  const { register, control, handleSubmit } = useForm<CompanyProfile>({
    defaultValues: {
      ...companyProfile,
      otherReferences: companyProfile.otherReferences || []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "otherReferences" as any,
  });

  const onSubmit = (data: CompanyProfile) => {
    setCompanyProfile(data);
    toast({ title: 'Company profile saved' });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">My Account</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto p-4 space-y-8">
        <Section title="Appearance">
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Theme</span>
              <span className="text-xs text-muted-foreground">Customize app appearance</span>
            </div>
            <ThemeToggle />
          </div>
        </Section>

        <Section title="Company Details">
          <Field label="Company Name" {...register('companyName')} />
          <Field label="Address" {...register('address')} />
          <Field label="Country" {...register('country')} />
        </Section>

        <Section title="Registration & References">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Other References (RBI, IE, GST, HS, etc.)</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`otherReferences.${index}` as any)} placeholder="e.g. GST NO: 12345" className="h-10" />
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
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reference Line
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Field label="LUT Number" {...register('lutNumber')} />
          </div>

        </Section>

        <Section title="Bank Details">
          <Field label="Bank Name" {...register('bankName')} />
          <Field label="Branch" {...register('bankBranch')} />
          <Field label="Bank Address" {...register('bankAddress')} />
          <Field label="Account Number" {...register('accountNumber')} />
          <Field label="SWIFT Code" {...register('swiftCode')} />
        </Section>

        <Section title="Defaults">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency" {...register('defaultCurrency')} />
          </div>
        </Section>

        <Button type="submit" size="lg" className="w-full h-14 text-base font-bold shadow-sm">
          SAVE PROFILE
        </Button>
      </form>

      <div className="max-w-lg mx-auto p-4 pt-0">
        <Section title="Account">
          <Button
            variant="destructive"
            size="lg"
            className="w-full h-14 text-base font-bold"
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">{title}</h2>
      {children}
    </div>
  );
}

const Field = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input ref={ref} {...props} className="h-12" />
    </div>
  ),
);
Field.displayName = 'Field';
