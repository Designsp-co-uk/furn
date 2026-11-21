import { useEffect, useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { QuoteTotals } from '../../domain/models.ts'
import { formatMoney, roundMoney } from '../../utils/money.ts'
import { Button } from '../../components/ui/Button.tsx'
import { TextField } from '../../components/ui/Field.tsx'

export interface EditGrandTotalDialogProps {
  open: boolean
  totals: QuoteTotals
  jobNo?: string
  onOpenChange: (open: boolean) => void
  onSave: (manualGrandTotal: number | null) => Promise<void> | void
}

function formatDecimal(val: number): string {
  return Number.isInteger(val) ? String(val) : val.toFixed(2)
}

function EditGrandTotalForm({
  totals,
  jobNo,
  onOpenChange,
  onSave,
}: {
  totals: QuoteTotals
  jobNo?: string
  onOpenChange: (open: boolean) => void
  onSave: (manualGrandTotal: number | null) => Promise<void> | void
}) {
  const isManual = Boolean(totals.isManualGrandTotal)
  const calculated = totals.calculatedGrandTotal ?? totals.grandTotal
  const [totalText, setTotalText] = useState(() => formatDecimal(totals.grandTotal))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTotalText(formatDecimal(totals.grandTotal))
    setError(null)
  }, [totals.grandTotal])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const parsed = parseFloat(totalText)
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid total amount (0 or greater).')
      return
    }
    setSaving(true)
    try {
      await onSave(roundMoney(parsed))
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (saving) return
    setSaving(true)
    try {
      await onSave(null)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Content className="dialog" aria-describedby={undefined}>
      <div className="dialog-head">
        <Dialog.Title className="dialog-title">Edit final order total</Dialog.Title>
        <Dialog.Close className="icon-x" aria-label="Close">
          <X size={20} />
        </Dialog.Close>
      </div>

      <div className="price-edit-meta">
        <strong>{jobNo ? `Order ${jobNo}` : 'Order Summary'}</strong>
        <p>
          Subtotal: {formatMoney(totals.subtotal)}
          {totals.discountPercent > 0 ? ` · Discount ${totals.discountPercent}%: ${formatMoney(totals.discountAmount)}` : ''}
          {totals.taxPercent > 0 ? ` · VAT ${totals.taxPercent}%: ${formatMoney(totals.taxAmount)}` : ''}
        </p>
        <div className="price-edit-calc">
          <span>Calculated order total:</span>
          <span>{formatMoney(calculated)}</span>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="price-edit-fields">
          <TextField
            label="Final price (£)"
            value={totalText}
            onChange={(text) => {
              setTotalText(text)
              setError(null)
            }}
            autoFocus
            placeholder="e.g. 900"
          />
          <p className="price-edit-help">
            Manually enter the finalized price for this quote. This final amount will be shown in the order total and on printed quotes and work orders.
          </p>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className={`dialog-actions ${isManual ? 'dialog-actions-split' : ''}`}>
          {isManual ? (
            <Button type="button" variant="secondary" onClick={() => void handleReset()} disabled={saving}>
              Reset to calculated total
            </Button>
          ) : null}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save total'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog.Content>
  )
}

export function EditGrandTotalDialog({
  open,
  totals,
  jobNo,
  onOpenChange,
  onSave,
}: EditGrandTotalDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <EditGrandTotalForm
          totals={totals}
          jobNo={jobNo}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

