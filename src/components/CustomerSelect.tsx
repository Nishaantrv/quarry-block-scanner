import React, { useState, useEffect } from 'react';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, X, User, Edit2, Check, ChevronDown } from 'lucide-react';
import { GlassContainer } from './ui/glass-container';
import { cn } from '@/lib/utils';
import { CustomerForm } from './CustomerForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function CustomerSelect() {
  const customers = useInspectionStore((s) => s.customers);
  const selectedCustomerId = useInspectionStore((s) => s.selectedCustomerId);
  const setSelectedCustomerId = useInspectionStore((s) => s.setSelectedCustomerId);
  const fetchCustomers = useInspectionStore((s) => s.fetchCustomersFromDb);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    setSelectedCustomerId(id);
    setSearch('');
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <User className="h-3 w-3" /> Active Customer
        </h2>
        {selectedCustomer && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[10px] font-bold uppercase text-primary hover:bg-primary/10 transition-colors"
            onClick={() => handleEdit(selectedCustomer)}
          >
            <Edit2 className="h-3 w-3 mr-1" /> Edit Profile
          </Button>
        )}
      </div>

      <GlassContainer className={cn("p-4 transition-all duration-300", selectedCustomer ? "border-primary/30 ring-1 ring-primary/10" : "bg-card/50")}>
        {!selectedCustomerId ? (
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2.5 rounded-full border border-border/50 shadow-inner">
                   <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase tracking-tight text-foreground">No customer selected</p>
                   <p className="text-[10px] text-muted-foreground font-medium">Select a customer for the next marking session</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1 h-12 bg-background/50 border-dashed justify-between px-4 font-bold tracking-tight text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Search className="h-4 w-4" />
                        Search Customers...
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[300px] p-2 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-xl" align="start">
                    <div className="p-2 border-b border-border/50 mb-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          className="w-full bg-muted/50 border border-border/50 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Type to filter..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar px-1 pb-1">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(c => (
                          <DropdownMenuItem 
                             key={c.id} 
                             onSelect={() => handleSelect(c.id)}
                             className="rounded-lg py-2 px-3 focus:bg-primary/10 focus:text-primary cursor-pointer border border-transparent hover:border-primary/20 mb-1"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-sm tracking-tight">{c.name}</span>
                              <span className="text-[10px] opacity-70 truncate">{c.country || 'No location set'}</span>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-widest opacity-50">
                          {search ? 'No matches found' : 'Start typing to search'}
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={handleNew} variant="outline" className="h-12 w-12 p-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  <UserPlus className="h-5 w-5" />
                </Button>
              </div>
           </div>
        ) : (
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-primary/20 p-2.5 rounded-full border border-primary/20 shadow-lg shadow-primary/10">
                      <User className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                      <div className="flex items-center gap-1.5 leading-none">
                         <p className="text-sm font-black uppercase tracking-tight text-foreground">{selectedCustomer?.name}</p>
                         <div className="h-4 w-4 bg-primary/20 rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary" />
                         </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{selectedCustomer?.country || 'Unknown Destination'}</p>
                   </div>
                </div>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => setSelectedCustomerId(null)} 
                   className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-2.5 bg-background/50 rounded-xl border border-border/50">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground leading-none mb-1">Defaults</p>
                    <p className="text-[11px] font-bold text-foreground/80 truncate">
                       {selectedCustomer?.defaultPortOfDischarge || 'None'} / {selectedCustomer?.defaultTermsOfDelivery || 'FOB'}
                    </p>
                 </div>
                 <div className="p-2.5 bg-background/50 rounded-xl border border-border/50">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground leading-none mb-1">Payment</p>
                    <p className="text-[11px] font-bold text-foreground/80">
                        {selectedCustomer?.defaultCurrency} · {selectedCustomer?.defaultTermsOfPayment || 'Not set'}
                    </p>
                 </div>
              </div>
           </div>
        )}
      </GlassContainer>

      {/* MODAL FOR NEW/EDIT CUSTOMER */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-3xl overflow-y-auto max-h-[90vh] custom-scrollbar border-white/5 rounded-3xl shadow-2xl p-6">
          <DialogHeader className="mb-0">
             {/* Form handles its own header but DialogTitle is good for accessibility */}
             <DialogTitle className="sr-only">Customer Details Form</DialogTitle>
          </DialogHeader>
          <CustomerForm 
            customer={editingCustomer} 
            onSuccess={(id) => {
              setIsFormOpen(false);
              handleSelect(id);
            }} 
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
