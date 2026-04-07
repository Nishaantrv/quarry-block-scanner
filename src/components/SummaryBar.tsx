import React from 'react';
import { useInspectionStore } from '@/store/inspectionStore';
import type { InspectionTotals } from '@/types/inspection';

export function SummaryBar({ totals }: { totals: InspectionTotals }) {
  const header = useInspectionStore((s) => s.activeInspection?.header);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-bottom">
      <div className="grid grid-cols-4 gap-1 px-2 py-2 max-w-lg mx-auto text-center">
        <SummaryItem label="Blocks" value={totals.totalBlocks.toString()} />
        <SummaryItem label="Gross" value={(totals.totalGrossCbm ?? 0).toFixed(3)} unit="m³" />
        <SummaryItem label="Net" value={(totals.totalNetCbm ?? 0).toFixed(3)} unit="m³" />
        <SummaryItem
          label="Value"
          value={(totals.totalValue ?? 0).toFixed(0)}
          unit={header?.currency || ''}
        />
      </div>
    </div>
  );
}

function SummaryItem({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
      {unit && <span className="text-[9px] text-muted-foreground">{unit}</span>}
    </div>
  );
}
