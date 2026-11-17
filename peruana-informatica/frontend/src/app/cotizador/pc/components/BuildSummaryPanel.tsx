'use client';

import QuotationSummary from '@/components/quotation/QuotationSummary';
import type { QuotationItem } from './types';

interface BuildSummaryPanelProps {
  items: QuotationItem[];
  onRemoveItem: (index: number) => void;
  onCreateQuotation: () => void;
}

export default function BuildSummaryPanel({ items, onRemoveItem, onCreateQuotation }: BuildSummaryPanelProps) {
  return (
    <div className="lg:col-span-1">
      <QuotationSummary
        items={items}
        onRemoveItem={onRemoveItem}
        onCreateQuotation={onCreateQuotation}
      />
    </div>
  );
}
