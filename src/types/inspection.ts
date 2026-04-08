export interface CompanyProfile {
  companyName: string;
  address: string;
  country: string;
  rbiCode: string;
  ieCode: string;
  gstNumber: string;


  bankName: string;
  bankBranch: string;
  bankAddress: string;
  accountNumber: string;
  swiftCode: string;
  defaultPortOfLoading: string;
  defaultCurrency: string;
  lutNumber?: string;
  otherReferences?: string[];
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  country: string;
  phone?: string;
  email?: string;
  // Registration
  rbiCode?: string;
  ieCode?: string;
  gstNumber?: string;
  lutNumber?: string;
  otherReferences?: string[];
  // Bank
  bankName?: string;
  bankBranch?: string;
  bankAddress?: string;
  accountNumber?: string;
  swiftCode?: string;
  // Defaults
  defaultPortOfLoading?: string;
  defaultPortOfDischarge?: string;
  defaultFinalDestination?: string;
  defaultFinalDestinationCountry?: string;
  defaultTermsOfDelivery?: string;
  defaultTermsOfPayment?: string;
  defaultCurrency?: string;
  defaultHsCode?: string;
}

export interface BlockTypePreset {
  id: string; // "1", "2", "3"
  allowance: number;
  pricePerCbm: number;
}

export interface InspectionHeader {
  // Customer
  consignee: string;
  consigneeShort?: string;
  consigneeAddress: string;
  consigneePhone?: string;
  buyer?: string;
  notifyParty?: string;
  // Shipment
  preCarriageBy?: string;
  placeOfReceipt?: string;
  vessel: string;
  portOfLoading?: string;
  portOfDischarge: string;
  finalDestination: string;
  finalDestinationCountry?: string;
  // Commercial
  invoiceNumber?: string;
  currency: string;
  termsOfDelivery: string;
  termsOfPayment: string;
  pricePerCbm: number; // Legacy/Default base price
  exporterRefNumber: string;
  hsCode?: string;
  countryOfOrigin?: string;
  // Inspection settings
  startingBlockNumber: number; // default 1
  // Stone description
  marksAndNos: string;
  stoneType: string;
  stoneDescription?: string;
  quarryCode: string;
  calculationMode: 'gross' | 'net';
  abstractDetails?: string;
  // Dynamic Type Presets
  blockTypes: BlockTypePreset[];
  inspectionPhotos?: string[];
};

export interface Block {
  id: string;
  blockNo: number;
  l1: number;
  l2: number;
  l3: number;
  grossCbm: number;
  netCbm: number;
  value: number;
  remarks?: string;
  allowance?: number;
  type?: string; // "1", "2", "3" etc.
  photoUrl?: string;
  photoUrls?: string[];
  pricePerCbm?: number;
}

export interface InspectionTotals {
  totalBlocks: number;
  totalGrossCbm: number;
  totalNetCbm: number;
  totalValue: number;
}

export interface Inspection {
  id: string;
  header: InspectionHeader;
  blocks: Block[];
  totals: InspectionTotals;
  createdAt: string;
  savedToCloud: boolean;
  status: 'draft' | 'completed';
  updatedAt?: string;
  draftBlock?: {
    l1: string;
    l2: string;
    l3: string;
    remarks: string;
    type: string;
    manualAllowance: string;
  };
}

export const DEFAULT_HEADER: InspectionHeader = {
  consignee: '',
  consigneeShort: '',
  consigneeAddress: '',
  consigneePhone: '',
  buyer: '',
  notifyParty: '',
  portOfLoading: '',
  vessel: '',
  portOfDischarge: '',
  finalDestination: '',
  currency: 'USD',
  termsOfDelivery: 'FOB',
  termsOfPayment: '',
  pricePerCbm: 0,
  exporterRefNumber: '',
  startingBlockNumber: 1,
  marksAndNos: '',
  stoneType: '',
  stoneDescription: '',
  quarryCode: '',
  calculationMode: 'net',
  hsCode: '',
  countryOfOrigin: '',
  abstractDetails: '',
  blockTypes: [
    { id: '1', allowance: 15, pricePerCbm: 0 },
    { id: '2', allowance: 15, pricePerCbm: 0 },
    { id: '3', allowance: 15, pricePerCbm: 0 },
  ],
};

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: '',
  address: '',
  country: '',
  rbiCode: '',
  ieCode: '',
  gstNumber: '',

  bankName: '',
  bankBranch: '',
  bankAddress: '',
  accountNumber: '',
  swiftCode: '',
  defaultPortOfLoading: '',
  defaultCurrency: 'USD',
  otherReferences: [],
};

export const DEFAULT_CUSTOMER: Customer = {
  id: '',
  name: '',
  address: '',
  country: '',
  defaultCurrency: 'USD',
  otherReferences: [],
};
