import type { Block, InspectionTotals } from '@/types/inspection';

export function calcGrossCbm(l1: number, l2: number, l3: number): number {
  return (l1 * l2 * l3) / 1_000_000;
}

export function calcNetCbm(l1: number, l2: number, l3: number, allowance: number = 0): number {
  const safeAllowance = Number(allowance) || 0;
  const n1 = Math.max(l1 - safeAllowance, 0);
  const n2 = Math.max(l2 - safeAllowance, 0);
  const n3 = Math.max(l3 - safeAllowance, 0);
  return (n1 * n2 * n3) / 1_000_000;
}

export function calcValue(netCbm: number, pricePerCbm: number): number {
  return netCbm * pricePerCbm;
}

export function resolveAllowance(type: string = '1', header: any, blockAllowance?: number | string): number {
  // If blockAllowance is a valid number (> 0 or exactly 0 if intended), use it
  const bAllw = typeof blockAllowance === 'string' ? parseFloat(blockAllowance) : blockAllowance;
  if (bAllw !== undefined && Number.isFinite(bAllw)) {
    return bAllw;
  }

  // Fallback to header blockTypes array
  if (Array.isArray(header.blockTypes)) {
    const preset = header.blockTypes.find((p: any) => p.id === type);
    if (preset) {
      return Number(preset.allowance);
    }
  }

  // Fallback to legacy allowance or hardcoded default
  const legacyAllw = Number(header.allowance);
  if (header.allowance !== undefined && header.allowance !== '' && Number.isFinite(legacyAllw)) {
    return legacyAllw;
  }

  return 15; // Global fallback
}

export function buildBlock(
  id: string,
  blockNo: number,
  l1: number,
  l2: number,
  l3: number,
  header: any, // Using any here to avoid circular dependency issues if they arise, but it represents InspectionHeader
  remarks: string = '',
  blockAllowance?: number,
  type: string = '1',
  blockPricePerCbm?: number,
  photoUrl?: string,
  photoUrls?: string[],
  photoRotations?: Record<string, number>
): Block {
  const finalAllowance = resolveAllowance(type, header, blockAllowance);
  
  // Find price from types if not provided
  let finalPrice = blockPricePerCbm;
  if (finalPrice === undefined && Array.isArray(header.blockTypes)) {
    const preset = header.blockTypes.find((p: any) => p.id === type);
    if (preset) {
      finalPrice = preset.pricePerCbm;
    }
  }
  
  if (finalPrice === undefined) {
    finalPrice = header.pricePerCbm;
  }

  const grossCbm = calcGrossCbm(l1, l2, l3);

  let netCbm: number;
  if (header.calculationMode === 'gross') {
    // Gross mode: Billable CBM is Gross CBM rounded UP to 3 decimals
    netCbm = Math.ceil(grossCbm * 1000) / 1000;
  } else {
    // Net mode: Standard calculation with allowance
    netCbm = calcNetCbm(l1, l2, l3, finalAllowance);
  }

  const value = calcValue(netCbm, finalPrice);
  return { id, blockNo, l1, l2, l3, grossCbm, netCbm, value, remarks, allowance: finalAllowance, type, photoUrl, photoUrls, photoRotations, pricePerCbm: finalPrice };
}

export function recalcBlock(block: Block, header: any, newBlockNo?: number): Block {
  return buildBlock(
    block.id,
    newBlockNo !== undefined ? newBlockNo : block.blockNo,
    block.l1,
    block.l2,
    block.l3,
    header,
    block.remarks,
    undefined, // Re-calculating allowance from header
    block.type || '1',
    block.pricePerCbm,
    block.photoUrl,
    block.photoUrls,
    block.photoRotations
  );
}

export function calcTotals(blocks: Block[]): InspectionTotals {
  return {
    totalBlocks: blocks.length,
    totalGrossCbm: blocks.reduce((s, b) => s + b.grossCbm, 0),
    totalNetCbm: blocks.reduce((s, b) => s + b.netCbm, 0),
    totalValue: blocks.reduce((s, b) => s + b.value, 0),
  };
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);
  let result = convert(wholePart);
  if (decimalPart > 0) {
    result += ' and ' + convert(decimalPart) + ' Cents';
  }
  return result + ' Only';
}
