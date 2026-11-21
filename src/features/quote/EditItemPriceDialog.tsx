import { useEffect, useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { PricingConfig, QuoteItem } from '../../domain/models.ts'
import { isDrawingFamily, itemProductId } from '../../domain/models.ts'
import { findGlazing, findMaterial, findProduct } from '../../domain/catalogue.ts'
import { useAppStore } from '../../store/useAppStore.ts'
import { describeConfiguration } from '../../domain/factories.ts'
import { calculateItemPrice } from '../../domain/pricing.ts'
import { formatMoney, roundMoney } from '../../utils/money.ts'
import { Button } from '../../components/ui/Button.tsx'
import { TextField } from '../../components/ui/Field.tsx'

export interface EditItemPriceDialogProps {
  open: boolean
  item: QuoteItem | null
  index?: number
  pricingConfig: PricingConfig
  onOpenChange: (open: boolean) => void
  onSave: (manualUnitPrice: number | null) => Promise<void> | void
}

function formatDecimal(val: number): string {
  return Number.isInteger(val) ? String(val) : val.toFixed(2)
}

function EditItemPriceForm({
  item,
  index,
  pricingConfig,
  onOpenChange,
  onSave,
}: {
  item: QuoteItem
  index?: number
  pricingConfig: PricingConfig
  onOpenChange: (open: boolean) => void
  onSave: (manualUnitPrice: number | null) => Promise<void> | void
}) {
  const catalogue = useAppStore((state) => state.catalogue)
  const product = findProduct(itemProductId(item), catalogue)
  const material = findMaterial(item.materialId, catalogue)
  const glazing = findGlazing(item.glazingId, catalogue)
  const drawing = isDrawingFamily(item.productType) ? item.productType : null

  const autoPrice = calculateItemPrice({ ...item, manualUnitPrice: undefined }, pricingConfig, catalogue)
  const currentPrice = calculateItemPrice(item, pricingConfig, catalogue)
  const isManual = item.manualUnitPrice != null

  const [unitPriceText, setUnitPriceText] = useState(() => formatDecimal(currentPrice.unitPrice))
  const [lineTotalText, setLineTotalText] = useState(() => formatDecimal(currentPrice.lineTotal))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const qty = Math.max(1, item.quantity)

  useEffect(() => {
    setUnitPriceText(formatDecimal(currentPrice.unitPrice))
    setLineTotalText(formatDecimal(currentPrice.lineTotal))
    setError(null)
  }, [item.id, currentPrice.unitPrice, currentPrice.lineTotal])

  function handleUnitPriceChange(text: string) {
    setUnitPriceText(text)
    setError(null)
    const val = parseFloat(text)
    if (!isNaN(val) && val >= 0) {
      setLineTotalText(formatDecimal(roundMoney(val * qty)))
    }
  }

  function handleLineTotalChange(text: string) {
    setLineTotalText(text)
    setError(null)
    const val = parseFloat(text)
    if (!isNaN(val) && val >= 0) {
      setUnitPriceText(formatDecimal(roundMoney(val / qty)))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const parsed = parseFloat(unitPriceText)
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid price (0 or greater).')
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
    <Dialog.Content className="dialog dialog-wide" aria-describedby={undefined}>
      <div className="dialog-head">
        <Dialog.Title className="dialog-title">Edit opening price</Dialog.Title>
        <Dialog.Close className="icon-x" aria-label="Close">
          <X size={20} />
        </Dialog.Close>
      </div>

      <div className="price-edit-meta">
        <strong>
          {index != null ? `${index + 1}. ` : ''}
          {product.name}
          {drawing ? ` · ${describeConfiguration(item)}` : ''}
        </strong>
        <p>
          {item.location.trim() ? `${item.location.trim()} · ` : ''}
          {item.widthMm} × {item.heightMm} mm · Qty {item.quantity} · {material.name} · {glazing.name}
        </p>
        <div className="price-edit-calc">
          <span>Calculated parts-based price:</span>
          <span>
            {formatMoney(autoPrice.unitPrice)} each ({formatMoney(autoPrice.lineTotal)} total)
          </span>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="price-edit-fields">
          {qty === 1 ? (
            <TextField
              label="Opening price (£)"
              value={unitPriceText}
              onChange={handleUnitPriceChange}
              autoFocus
              placeholder="e.g. 800"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField
                label="Price each (£)"
                value={unitPriceText}
                onChange={handleUnitPriceChange}
                autoFocus
                placeholder="e.g. 400"
              />
              <TextField
                label={`Total for ${qty} openings (£)`}
                value={lineTotalText}
                onChange={handleLineTotalChange}
                placeholder="e.g. 800"
              />
            </div>
          )}
          <p className="price-edit-help">
            Custom prices directly feed into the quote subtotal, taxes, discount, and printed work orders.
          </p>
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className={`dialog-actions ${isManual ? 'dialog-actions-split' : ''}`}>
          {isManual ? (
            <Button type="button" variant="secondary" onClick={() => void handleReset()} disabled={saving}>
              Reset to calculated price
            </Button>
          ) : null}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save price'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog.Content>
  )
}

export function EditItemPriceDialog({
  open,
  item,
  index,
  pricingConfig,
  onOpenChange,
  onSave,
}: EditItemPriceDialogProps) {
  if (!item) return null
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <EditItemPriceForm
          item={item}
          index={index}
          pricingConfig={pricingConfig}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

