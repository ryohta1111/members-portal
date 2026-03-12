'use client'

interface StakeModalProps {
  amount: string
  setAmount: (v: string) => void
  multiplier: number
  decimals: number
  tokenSymbol: string
  minStake: number
  maxStake: number
  loading: boolean
  error: string
  disabled?: boolean
  disabledMessage?: string
  onStake: () => void
}

function fmtAmount(raw: number, decimals: number) {
  return (raw / Math.pow(10, decimals)).toLocaleString()
}

export function StakeModal({
  amount, setAmount, multiplier, decimals, tokenSymbol,
  minStake, maxStake, loading, error, disabled, disabledMessage, onStake,
}: StakeModalProps) {
  const inputNum = parseFloat(amount) || 0
  const previewTotal = (inputNum * multiplier).toLocaleString('en-US', { maximumFractionDigits: 2 })
  const sym = tokenSymbol.startsWith('$') ? tokenSymbol : `$${tokenSymbol}`

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 mb-4 animate-fade-in-up">
      <h3 className="text-base font-semibold mb-5">Stake Amount</h3>

      {disabled ? (
        <>
          <div className="text-center py-8">
            <div className="text-[32px] mb-3">🚫</div>
            <p className="text-base font-semibold mb-2">{disabledMessage || '応募期間外です'}</p>
          </div>
          <button className="w-full py-4 rounded-full text-base font-semibold bg-[var(--border)] text-[var(--text-sub)] cursor-not-allowed" disabled>
            応募期間外
          </button>
        </>
      ) : (
        <>
          <div className="relative mb-2.5">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              disabled={loading}
              className="w-full py-3.5 px-4 pr-[90px] border-[1.5px] border-[var(--border)] rounded-[var(--radius-sm)] text-lg font-mono font-medium text-[var(--text)] bg-[var(--surface)] outline-none transition-colors focus:border-[var(--blue)]"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--text-sub)]">
              {sym}
            </span>
          </div>

          <div className="flex justify-between text-xs text-[var(--text-sub)] mb-1.5">
            <span></span>
            <span>Min: {fmtAmount(minStake, decimals)} / Max: {fmtAmount(maxStake, decimals)}</span>
          </div>

          {inputNum > 0 && (
            <div className="bg-[var(--green-light)] rounded-[var(--radius-sm)] px-4 py-3 mt-3.5 mb-5 flex justify-between items-center">
              <span className="text-sm text-[var(--green)] font-medium">受取予定（元本 + 報酬）</span>
              <span className="text-base font-bold text-[var(--green)] font-mono">{previewTotal} {sym}</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--red)] mb-3">{error}</p>
          )}

          <button
            onClick={onStake}
            disabled={loading || !amount || inputNum <= 0}
            className="w-full py-4 rounded-full text-base font-semibold bg-[var(--blue)] text-white transition-all hover:bg-[#2563eb] hover:-translate-y-px hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? '処理中...' : 'Stake'}
          </button>
        </>
      )}
    </div>
  )
}
