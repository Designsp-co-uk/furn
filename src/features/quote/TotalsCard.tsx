import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { Quote, QuoteTotals } from '../../domain/models.ts'
import { LIMITS } from '../../data/pricingDefaults.ts'
import { formatMoney } from '../../utils/money.ts'
import { NumberField } from '../../components/ui/Field.tsx'
import { EditGrandTotalDialog } from './EditGrandTotalDialog.tsx'

interface TotalsCardProps {
  quote: Quote
  totals: QuoteTotals
  discountMax: number
  locked?: boolean
  onDiscount: (value: number) => void
  onTax: (value: number) => void
  onSaveGrandTotal?: (value: number | null) => Promise<void> | void
}

export function TotalsCard({
  quote,
  totals,
  discountMax,
  locked = false,
  onDiscount,
  onTax,
  onSaveGrandTotal,
}: TotalsCardProps) {
  const [editTotalOpen, setEditTotalOpen] = useState(false)

  return (
    <aside className="card totals-card">
      <h2>Order total</h2>
      <div className="total-row">
        <span>Subtotal</span>
        <span>{formatMoney(totals.subtotal)}</span>
      </div>
      <div className="total-row total-input">
        <NumberField
          label="Discount"
          suffix="%"
          value={quote.discountPercent}
          min={LIMITS.discountMin}
          max={discountMax}
          disabled={locked}
          onChange={onDiscount}
        />
        <span>{formatMoney(totals.discountAmount)}</span>
      </div>
      <div className="total-row total-input">
        <NumberField
          label="VAT"
          suffix="%"
          value={quote.taxPercent}
          min={LIMITS.taxMin}
          max={LIMITS.taxMax}
          disabled={locked}
          onChange={onTax}
        />
        <span>{formatMoney(totals.taxAmount)}</span>
      </div>
      <div className="total-grand">
        <div className="total-grand-label">
          <span>Total</span>
          {totals.isManualGrandTotal ? <span className="manual-price-badge">manual</span> : null}
        </div>
        <div className="total-grand-value">
          <strong>{formatMoney(totals.grandTotal)}</strong>
          {locked || !onSaveGrandTotal ? null : (
            <button
              type="button"
              className="btn-inline-icon"
              title="Edit final total"
              aria-label="Edit final total"
              onClick={() => setEditTotalOpen(true)}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {onSaveGrandTotal ? (
        <EditGrandTotalDialog
          open={editTotalOpen}
          totals={totals}
          jobNo={quote.jobNo}
          onOpenChange={setEditTotalOpen}
          onSave={onSaveGrandTotal}
        />
      ) : null}
    </aside>
  )
}
