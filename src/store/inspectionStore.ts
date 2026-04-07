import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Block, CompanyProfile, Customer, Inspection, InspectionHeader, InspectionTotals } from '@/types/inspection';
import { DEFAULT_COMPANY_PROFILE, DEFAULT_HEADER } from '@/types/inspection';
import { buildBlock, calcTotals, recalcBlock } from '@/lib/calculations';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface InspectionStore {
  userId: string | null;
  setUserId: (id: string | null) => void;
  resetStore: () => void;          // wipes both memory + localStorage
  companyProfile: CompanyProfile;
  setCompanyProfile: (profile: CompanyProfile) => void;

  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  syncStatus: 'saved' | 'syncing' | 'error' | 'offline';
  setSyncStatus: (status: 'saved' | 'syncing' | 'error' | 'offline') => void;
  syncActiveToDb: () => Promise<void>;

  activeInspection: Inspection | null;
  startNewInspection: (header: InspectionHeader) => void;
  discardActiveInspection: () => void;
  checkDraftExpiration: () => void;

  addBlock: (l1: number, l2: number, l3: number, remarks?: string, allowance?: number, type?: 'small' | 'large' | 'other', photoUrl?: string, photoUrls?: string[]) => void;
  updateBlock: (blockId: string, l1: number, l2: number, l3: number, remarks?: string, allowance?: number, type?: 'small' | 'large' | 'other', photoUrl?: string, photoUrls?: string[]) => void;
  deleteBlock: (blockId: string) => void;
  updateHeader: (header: InspectionHeader) => void;
  finishInspection: () => Promise<string>;
  uploadPhoto: (file: File) => Promise<string>;
  clearActiveInspection: () => void;
  updateDraftBlock: (draft: Inspection['draftBlock']) => void;

  customers: Customer[];
  selectedCustomerId: string | null;
  fetchCustomersFromDb: () => Promise<void>;
  saveCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => Promise<string>;
  deleteCustomer: (id: string) => Promise<void>;
  setSelectedCustomerId: (id: string | null) => void;

  savedInspections: Inspection[];
  saveInspection: () => void;
  loadInspection: (id: string) => void;
  duplicateInspection: (id: string) => void;
  fetchInspection: (id: string) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;
  fetchInspectionsFromDb: () => Promise<void>;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useInspectionStore = create<InspectionStore>()(
  persist(
    (set, get) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }),

      resetStore: () => {
        localStorage.removeItem('quarry-inspection-storage');
        set({
          userId: null,
          companyProfile: DEFAULT_COMPANY_PROFILE,
          activeInspection: null,
          savedInspections: [],
          customers: [],
          selectedCustomerId: null,
        });
      },

      companyProfile: DEFAULT_COMPANY_PROFILE,
      setCompanyProfile: (profile) => set({ companyProfile: profile }),

      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setIsOnline: (online) => set({ isOnline: online, syncStatus: online ? 'saved' : 'offline' }),
      syncStatus: 'saved',
      setSyncStatus: (status) => set({ syncStatus: status }),

      activeInspection: null,

      startNewInspection: (header) => {
        const inspection: Inspection = {
          id: generateId(),
          header,
          blocks: [],
          totals: { totalBlocks: 0, totalGrossCbm: 0, totalNetCbm: 0, totalValue: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          savedToCloud: false,
          status: 'draft',
        };
        set({ activeInspection: inspection });
      },

      uploadPhoto: async (file) => {
        const fileName = `${crypto.randomUUID()}-${file.name}`;
        const filePath = `blocks/${fileName}`;

        const { data, error } = await supabase.storage
          .from('block-photos')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('block-photos')
          .getPublicUrl(data.path);

        return publicUrl;
      },

      clearActiveInspection: () => set({ activeInspection: null }),

      updateDraftBlock: (draft) => {
        const { activeInspection } = get();
        if (!activeInspection) return;
        set({
          activeInspection: {
            ...activeInspection,
            draftBlock: draft,
          }
        });
      },

      discardActiveInspection: () => {
        set({ activeInspection: null });
      },

      checkDraftExpiration: () => {
        const { activeInspection } = get();
        if (!activeInspection || !activeInspection.updatedAt) return;

        const updated = new Date(activeInspection.updatedAt).getTime();
        const now = Date.now();
        const diffMinutes = (now - updated) / (1000 * 60);

        if (diffMinutes > 200) {
          set({ activeInspection: null });
        }
      },

      addBlock: (l1, l2, l3, remarks = '', allowance, type = 'small', photoUrl, photoUrls) => {
        const { activeInspection } = get();
        if (!activeInspection) return;
        const { header, blocks } = activeInspection;
        const blockNo = blocks.length === 0
          ? header.startingBlockNumber
          : blocks[blocks.length - 1].blockNo + 1;
        const block = buildBlock(
          generateId(),
          blockNo,
          l1,
          l2,
          l3,
          header,
          remarks,
          allowance,
          type,
          photoUrl,
          photoUrls
        );
        const newBlocks = [...blocks, block];
        set({
          activeInspection: {
            ...activeInspection,
            blocks: newBlocks,
            totals: calcTotals(newBlocks),
            updatedAt: new Date().toISOString(),
          },
        });
        setTimeout(() => get().syncActiveToDb(), 100);
      },

      updateBlock: (blockId, l1, l2, l3, remarks, allowance, type, photoUrl, photoUrls) => {
        const { activeInspection } = get();
        if (!activeInspection) return;
        const { header } = activeInspection;
        const newBlocks = activeInspection.blocks.map((b) =>
          b.id === blockId
            ? buildBlock(
              b.id,
              b.blockNo,
              l1,
              l2,
              l3,
              header,
              remarks !== undefined ? remarks : b.remarks,
              allowance !== undefined ? allowance : b.allowance,
              type !== undefined ? type : b.type || 'small',
              photoUrl !== undefined ? photoUrl : b.photoUrl,
              photoUrls !== undefined ? photoUrls : b.photoUrls
            )
            : b
        );
        set({
          activeInspection: {
            ...activeInspection,
            blocks: newBlocks,
            totals: calcTotals(newBlocks),
            updatedAt: new Date().toISOString(),
          },
        });
        setTimeout(() => get().syncActiveToDb(), 100);
      },

      deleteBlock: (blockId) => {
        const { activeInspection } = get();
        if (!activeInspection) return;
        const newBlocks = activeInspection.blocks.filter((b) => b.id !== blockId);
        set({
          activeInspection: {
            ...activeInspection,
            blocks: newBlocks,
            totals: calcTotals(newBlocks),
            updatedAt: new Date().toISOString(),
          },
        });
        setTimeout(() => get().syncActiveToDb(), 100);
      },

      updateHeader: (header) => {
        const { activeInspection } = get();
        if (!activeInspection) return;
        // Re-number blocks from the new startingBlockNumber and recalculate CBM/value
        const newBlocks = activeInspection.blocks.map((b, i) =>
          buildBlock(
            b.id,
            header.startingBlockNumber + i,
            b.l1,
            b.l2,
            b.l3,
            header,
            b.remarks,
            undefined, // Passing undefined here will force buildBlock to re-inherit from header
            b.type || 'small',
            b.photoUrl,
            b.photoUrls
          )
        );
        set({
          activeInspection: {
            ...activeInspection,
            header,
            blocks: newBlocks,
            totals: calcTotals(newBlocks),
            updatedAt: new Date().toISOString(),
          },
        });
        setTimeout(() => get().syncActiveToDb(), 100);
      },

      finishInspection: async () => {
        const { activeInspection, savedInspections } = get();
        if (!activeInspection) throw new Error('No active inspection');

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Save to Supabase
        const { error } = await supabase.from('inspections').upsert({
          local_id: activeInspection.id,
          user_id: user.id,
          header: activeInspection.header as unknown as Json,
          blocks: activeInspection.blocks as unknown as Json,
          totals: activeInspection.totals as unknown as Json,
          created_at: activeInspection.createdAt,
        }, { onConflict: 'local_id' });

        if (error) {
          console.error('Supabase upsert error:', error);
          throw error;
        }

        const updated = { ...activeInspection, savedToCloud: true, status: 'completed' as const, updatedAt: new Date().toISOString() };
        const existing = savedInspections.findIndex((i) => i.id === updated.id);
        const newList = existing >= 0
          ? savedInspections.map((i, idx) => idx === existing ? updated : i)
          : [...savedInspections, updated];

        // Update both lists
        set({ activeInspection: updated, savedInspections: newList });

        return updated.id;
      },

      savedInspections: [],

      saveInspection: () => {
        const { activeInspection, savedInspections } = get();
        if (!activeInspection) return;
        const updated = { ...activeInspection, savedToCloud: true, updatedAt: new Date().toISOString() };
        const existing = savedInspections.findIndex((i) => i.id === updated.id);
        const newList = existing >= 0
          ? savedInspections.map((i, idx) => idx === existing ? updated : i)
          : [...savedInspections, updated];
        set({ activeInspection: updated, savedInspections: newList });
      },

      loadInspection: (id) => {
        const { savedInspections } = get();
        const found = savedInspections.find((i) => i.id === id);
        if (found) set({ activeInspection: { ...found } });
      },

      duplicateInspection: (id) => {
        const { savedInspections } = get();
        const source = savedInspections.find((i) => i.id === id);
        if (!source) return;

        const newInspection: Inspection = {
          id: generateId(),
          header: { ...source.header },
          blocks: [],
          totals: { totalBlocks: 0, totalGrossCbm: 0, totalNetCbm: 0, totalValue: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          savedToCloud: false,
          status: 'draft',
        };

        set({ activeInspection: newInspection });
      },

      fetchInspection: async (id) => {
        // First check local
        const { savedInspections } = get();
        const found = savedInspections.find((i) => i.id === id);
        if (found) {
          set({ activeInspection: { ...found } });
          return;
        }

        // Then check DB with user_id filter for defense-in-depth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('inspections')
          .select('*')
          .eq('local_id', id)
          .eq('user_id', user.id)
          .single();

        if (error || !data) return;

        const inspection: Inspection = {
          id: data.local_id || data.id,
          header: data.header as unknown as InspectionHeader,
          blocks: (data.blocks as unknown as Block[]) || [],
          totals: data.totals as unknown as InspectionTotals,
          createdAt: data.created_at,
          savedToCloud: true,
          status: 'completed',
          updatedAt: data.created_at
        };

        set({ activeInspection: inspection });
      },

      deleteInspection: async (id) => {
        const { savedInspections, activeInspection } = get();

        // Delete from Supabase as well
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('inspections')
            .delete()
            .eq('local_id', id)
            .eq('user_id', user.id);
        }

        set({
          savedInspections: savedInspections.filter((i) => i.id !== id),
          activeInspection: activeInspection?.id === id ? null : activeInspection,
        });
      },

      fetchInspectionsFromDb: async () => {
        // Get current user for defense-in-depth filtering
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('inspections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error || !data) return;

        const inspections: Inspection[] = data.map((row) => ({
          id: row.local_id || row.id,
          header: row.header as unknown as InspectionHeader,
          blocks: (row.blocks as unknown as Block[]) || [],
          totals: row.totals as unknown as InspectionTotals,
          createdAt: row.created_at,
          savedToCloud: true,
          status: 'completed' as const,
          updatedAt: row.created_at,
        }));

        set({ savedInspections: inspections });
      },

      syncActiveToDb: async () => {
        const { activeInspection, isOnline, setSyncStatus } = get();
        if (!activeInspection || !isOnline) {
          if (!isOnline) setSyncStatus('offline');
          return;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setSyncStatus('syncing');

        try {
          const { error } = await supabase.from('inspections').upsert({
            local_id: activeInspection.id,
            user_id: user.id,
            header: activeInspection.header as unknown as Json,
            blocks: activeInspection.blocks as unknown as Json,
            totals: activeInspection.totals as unknown as Json,
            created_at: activeInspection.createdAt,
            updated_at: new Date().toISOString(), // Keep track for conflict resolution
          }, { onConflict: 'local_id' });

          if (error) throw error;
          
          setSyncStatus('saved');
          // Optionally mark as savedToCloud in memory too
          if (!activeInspection.savedToCloud) {
            set({ 
              activeInspection: { ...activeInspection, savedToCloud: true } 
            });
          }
        } catch (err) {
          console.error('Auto-sync error:', err);
          setSyncStatus('error');
        }
      },

      customers: [],
      selectedCustomerId: null,

      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),

      fetchCustomersFromDb: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error || !data) return;

        const customers: Customer[] = data.map((row) => ({
          id: row.id,
          name: row.name,
          address: row.address || '',
          country: row.country || '',
          phone: row.phone || '',
          email: row.email || '',
          rbiCode: row.rbi_code || '',
          ieCode: row.ie_code || '',
          gstNumber: row.gst_number || '',
          lutNumber: row.lut_number || '',
          otherReferences: row.other_references || [],
          bankName: row.bank_name || '',
          bankBranch: row.bank_branch || '',
          bankAddress: row.bank_address || '',
          accountNumber: row.account_number || '',
          swiftCode: row.swift_code || '',
          defaultPortOfLoading: row.default_port_of_loading || '',
          defaultPortOfDischarge: row.default_port_of_discharge || '',
          defaultFinalDestination: row.default_final_destination || '',
          defaultFinalDestinationCountry: row.default_final_destination_country || '',
          defaultTermsOfDelivery: row.default_terms_of_delivery || '',
          defaultTermsOfPayment: row.default_terms_of_payment || '',
          defaultCurrency: row.default_currency || 'USD',
          defaultHsCode: row.default_hs_code || '',
        }));

        set({ customers });
      },

      saveCustomer: async (customer) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const dbRow = {
          name: customer.name,
          user_id: user.id,
          address: customer.address,
          country: customer.country,
          phone: customer.phone,
          email: customer.email,
          rbi_code: customer.rbiCode,
          ie_code: customer.ieCode,
          gst_number: customer.gstNumber,
          lut_number: customer.lutNumber,
          other_references: customer.otherReferences,
          bank_name: customer.bankName,
          bank_branch: customer.bankBranch,
          bank_address: customer.bankAddress,
          account_number: customer.accountNumber,
          swift_code: customer.swiftCode,
          default_port_of_loading: customer.defaultPortOfLoading,
          default_port_of_discharge: customer.defaultPortOfDischarge,
          default_final_destination: customer.defaultFinalDestination,
          default_final_destination_country: customer.defaultFinalDestinationCountry,
          default_terms_of_delivery: customer.defaultTermsOfDelivery,
          default_terms_of_payment: customer.defaultTermsOfPayment,
          default_currency: customer.defaultCurrency,
          default_hs_code: customer.defaultHsCode,
        };

        let resultId = customer.id;

        if (customer.id) {
          const { error } = await supabase
            .from('customers')
            .update(dbRow)
            .eq('id', customer.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('customers')
            .insert(dbRow)
            .select()
            .single();
          if (error) throw error;
          resultId = data.id;
        }

        await get().fetchCustomersFromDb();
        return resultId!;
      },

      deleteCustomer: async (id) => {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await get().fetchCustomersFromDb();
        if (get().selectedCustomerId === id) {
          set({ selectedCustomerId: null });
        }
      },
    }),
    {
      name: 'quarry-inspection-storage',
      version: 4, // bump this to wipe all cached data across all browsers
      onRehydrateStorage: () => async (state) => {
        if (!state) return;
        state.checkDraftExpiration();

        // Guard: if the stored userId doesn't match the current auth session, wipe the store
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id ?? null;
        if (state.userId && currentUserId && state.userId !== currentUserId) {
          // Different user — clear everything sensitive
          localStorage.removeItem('quarry-inspection-storage');
          state.companyProfile = DEFAULT_COMPANY_PROFILE;
          state.savedInspections = [];
          state.activeInspection = null;
          state.userId = null;
        } else if (currentUserId) {
          state.userId = currentUserId;
          // After rehydrating, try to fetch fresh data from DB
          state.fetchInspectionsFromDb();
          // If there's an active inspection, try to sync it
          if (state.activeInspection) {
            state.syncActiveToDb();
          }
        }
      },
    },
  ),
);
