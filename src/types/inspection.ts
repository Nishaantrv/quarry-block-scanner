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

export interface InspectionHeader {
  // Customer
  consignee: string;
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
  pricePerCbm: number;
  exporterRefNumber: string;
  hsCode?: string;
  countryOfOrigin?: string;
  // Inspection settings
  allowance: number; // legacy default
  allowanceSmall: number; // default 15
  allowanceLarge: number; // default 20
  allowanceOther: number; // default 0
  startingBlockNumber: number; // default 1
  // Stone description
  marksAndNos: string;
  stoneType: string;
  quarryCode: string;
  calculationMode: 'gross' | 'net';
  abstractDetails?: string;
  // Persistent Type Presets
  type1Allowance: number;
  type1Price: number;
  type2Allowance?: number;
  type2Price?: number;
  type3Allowance?: number;
  type3Price?: number;
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
  type?: 'small' | 'large' | 'other';
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
    type: 'small' | 'large' | 'other';
    manualAllowance: string;
  };
}

export const DEFAULT_HEADER: InspectionHeader = {
  consignee: '',
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
  allowance: 15,
  allowanceSmall: 15,
  allowanceLarge: 20,
  allowanceOther: 0,
  startingBlockNumber: 1,
  marksAndNos: '',
  stoneType: '',
  quarryCode: '',
  calculationMode: 'net',
  hsCode: '',
  countryOfOrigin: '',
  abstractDetails: '',
  type1Allowance: 15,
  type1Price: 0,
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
