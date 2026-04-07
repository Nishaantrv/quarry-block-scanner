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
