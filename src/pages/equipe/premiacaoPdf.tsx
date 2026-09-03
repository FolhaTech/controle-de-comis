import {
  calculateAttendantCommission,
  calculateCommissionBreakdown,
  calculateMonthlyDeduction,
  contractValue,
  getAjudaCusto,
  isContractValid,
} from '@/lib/calculations'
import type { Contract, Consultant, ConsultantDeduction, Settings } from '@/lib/types'

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const NAVY = '#1b2a5e'
const GOLD = '#d3a13a'
const RED = '#a30015'

interface PremiacaoReportProps {
  consultant: Consultant
  contracts: Contract[]
  consultantDeductions: ConsultantDeduction[]
  settings: Settings
  month: number
  year: number
  // Set on every report but the last when printing several consultants in
  // one job (see the Equipe page's "Extrair PDFs" bulk action), so each
  // consultant starts on a fresh printed page.
  pageBreakAfter?: boolean
}

// Renders one consultant's Premiação report, styled to match the firm's
// official template. Mounted into #premiacao-print-root and printed via
// window.print() — see useEquipePrinting in Equipe.tsx. Kept print-only
// (no more jsPDF/html2canvas): browser print-to-PDF gives sharp vector
// text and a far smaller file than a rasterized canvas ever could.
export function PremiacaoReport({
  consultant,
  contracts,
  consultantDeductions,
  settings,
  month,
  year,
  pageBreakAfter = false,
}: PremiacaoReportProps) {
  const now = new Date()
  const normalize = (v: string) => v.trim().toLowerCase()
  const target = normalize(consultant.name)

  const personContracts = contracts.filter((c) => {
    if (!c.closed_by || normalize(c.closed_by) !== target) return false
    if (!c.start_date) return false
    const d = new Date(c.start_date)
    return d.getMonth() + 1 === month && d.getFullYear() === year && d <= now
  })

  const cancelledContracts = personContracts.filter(
    (c) => c.status === 'Cancelado' && !c.internal_failure,
  )

  const breakdown = calculateCommissionBreakdown(personContracts, settings)
  const trabalhistaContracts = personContracts.filter(
    (c) => c.service_type === 'Trabalhista' && isContractValid(c),
  )
  const trabalhista = calculateAttendantCommission(trabalhistaContracts.length, settings)
  const totalPremiacao = breakdown.total + trabalhista.commissionValue

  const validContracts = personContracts.filter(isContractValid)
  const validCount = validContracts.length
  const validTotalValue = validContracts.reduce((sum, c) => sum + contractValue(c), 0)
  const ticketMedio = validCount > 0 ? validTotalValue / validCount : 0

  const ajudaCusto = getAjudaCusto(consultant)
  const desconto = calculateMonthlyDeduction(consultantDeductions, consultant.name, month, year)
  const canceladosTotal = cancelledContracts.reduce((sum, c) => sum + contractValue(c), 0)
  const totalNotaFiscal = totalPremiacao + ajudaCusto - canceladosTotal - desconto

  // "Poderia ter chegado aqui": what this month's premiação would be one
  // commission tier up — a motivational look at the value of a few more
  // contracts, not a literal projection tied to any specific real client.
  // Trabalhista is flat-rate per contract, not tier-based on value, so it
  // never has a "next tier" upside — only the non-Trabalhista slice does.
  const nonTrabalhistaValid = validContracts.filter((c) => c.service_type !== 'Trabalhista')
  const nonTrabalhistaValue = nonTrabalhistaValid.reduce((sum, c) => sum + contractValue(c), 0)
  const nextTier = settings.tiers
    .filter((t) => t.min > nonTrabalhistaValid.length)
    .sort((a, b) => a.min - b.min)[0]
  const poderiaTerChegado =
    nonTrabalhistaValid.length === 0
      ? totalNotaFiscal
      : nextTier
        ? nonTrabalhistaValue * (nextTier.percentage / 100) + trabalhista.commissionValue + ajudaCusto - canceladosTotal - desconto
        : totalNotaFiscal

  const itemsByContractId = new Map(breakdown.items.map((i) => [i.contract.id, i]))

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 760,
        background: '#ffffff',
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#1a1a1a',
        breakAfter: pageBreakAfter ? 'page' : 'auto',
        padding: '0 0 24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', background: NAVY, color: '#fff', padding: '18px 28px' }}>
        <MountainLogo />
        <div style={{ flex: 1, marginLeft: 16 }}>
          <div style={{ fontSize: 19, letterSpacing: 1 }}>ARANTES ARIMURA</div>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.85 }}>ADVOCACIA</div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 14 }}>PREMIAÇÃO</div>
          <div style={{ fontSize: 14, marginBottom: 10 }}>PRESTAÇÃO DE SERVIÇO</div>
          <div style={{ fontSize: 15, fontWeight: 'bold' }}>{consultant.name.toUpperCase()}</div>
          {consultant.cnpj && <div style={{ fontSize: 12 }}>{consultant.cnpj}</div>}
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
            Competência: {MONTH_LABELS[month - 1]}/{year}
          </div>
        </div>
      </div>

      {/* Resumo prestação de serviços */}
      <div style={{ border: `1px solid ${NAVY}`, marginTop: 18 }}>
        <div style={{ background: NAVY, color: '#fff', padding: '6px 12px', fontWeight: 'bold' }}>
          Resumo prestação de serviços
        </div>
        <SummaryRowCentered label="TICKET MÉDIO" value={currency(ticketMedio)} />
        <SummaryRowCentered label="META ATINGIDA" value={`${validCount} Contratos`} />
        <SummaryRow label="Premiação" value={currency(totalPremiacao)} />
        <SummaryRow label="Ajuda de custo" value={currency(ajudaCusto)} />
        <SummaryRow label="cancelados (-)" value={currency(canceladosTotal)} />
        {desconto > 0 && <SummaryRow label="desconto (-)" value={currency(desconto)} />}
        <SummaryRow label="Total Nota Fiscal" value={currency(totalNotaFiscal)} bold />
      </div>

      {/* Resumo cancelados */}
      <div style={{ border: `1px solid ${RED}`, marginTop: 14 }}>
        <div style={{ background: RED, color: '#fff', padding: '6px 12px', fontWeight: 'bold' }}>
          Resumo cancelados
        </div>
        {cancelledContracts.length === 0 ? (
          <div style={{ padding: '10px 12px', fontSize: 12, color: '#666' }}>
            Nenhum cancelamento nesta competência.
          </div>
        ) : (
          cancelledContracts.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 12px',
                fontSize: 12,
                borderTop: '1px solid #eee',
              }}
            >
              <span>{c.client || c.name}</span>
              <span>{currency(contractValue(c))}</span>
            </div>
          ))
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: RED,
            color: '#fff',
            padding: '6px 12px',
            fontWeight: 'bold',
          }}
        >
          <span>Total</span>
          <span>{currency(canceladosTotal)}</span>
        </div>
      </div>

      {/* Progress staircase */}
      <StaircaseChart current={totalNotaFiscal} target={poderiaTerChegado} />

      {/* Detail table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18, fontSize: 11 }}>
        <thead>
          <tr style={{ background: NAVY, color: '#fff' }}>
            <th style={cellStyle('left')}>NOME - CLIENTE</th>
            <th style={cellStyle('left')}>TIPO DE AÇÃO</th>
            <th style={cellStyle('right')}>$ CONTRATO</th>
            <th style={cellStyle('right')}>% META</th>
            <th style={cellStyle('right')}>PREMIAÇÃO</th>
          </tr>
        </thead>
        <tbody>
          {personContracts.map((c, idx) => {
            const item = itemsByContractId.get(c.id)
            const isTrabalhista = c.service_type === 'Trabalhista'
            return (
              <tr key={c.id} style={{ background: idx % 2 === 0 ? '#f2f2f2' : '#ffffff' }}>
                <td style={cellStyle('left')}>{c.client || c.name || '—'}</td>
                <td style={cellStyle('left')}>{c.case_type || c.service_type || '—'}</td>
                <td style={cellStyle('right')}>{currency(contractValue(c))}</td>
                <td style={cellStyle('right')}>
                  {isTrabalhista ? '—' : item ? `${item.percentage.toFixed(1)}%` : '—'}
                </td>
                <td style={cellStyle('right')}>
                  {isTrabalhista
                    ? currency(trabalhista.valuePerContract)
                    : item
                      ? currency(item.commissionValue)
                      : currency(0)}
                </td>
              </tr>
            )
          })}
          {personContracts.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...cellStyle('left'), textAlign: 'center', color: '#666' }}>
                Nenhum contrato nesta competência.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: RED, color: '#fff', fontWeight: 'bold' }}>
            <td colSpan={4} style={cellStyle('right')}>
              Total
            </td>
            <td style={cellStyle('right')}>{currency(totalPremiacao)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// Simple CSS-drawn stand-in for the firm's mountain-peak mark.
function MountainLogo() {
  return (
    <svg width="46" height="40" viewBox="0 0 46 40">
      <polygon points="8,34 18,10 26,26" fill="#ffffff" opacity={0.95} />
      <polygon points="20,34 30,4 40,34" fill="#ffffff" />
      <polygon points="28,34 34,18 40,34" fill="#ffffff" opacity={0.75} />
    </svg>
  )
}

// The "VOCÊ ESTÁ AQUI / PODERIA TER CHEGADO AQUI" checkered staircase from
// the firm's official Premiação template — four rising steps in navy/gold,
// current total called out at the base, the next-tier total at the top.
function StaircaseChart({ current, target }: { current: number; target: number }) {
  const unit = 26 // px per step
  const colWidth = 40
  const barGap = 4
  const chartLeft = 60
  const chartHeight = unit * 4
  const badgeHeight = 26
  const barsBottom = 22 // reserved space for the "VOCÊ ESTÁ AQUI" label below the bars
  const labelHeight = 32 // reserved space for the "PODERIA TER CHEGADO AQUI" label above

  const bar1Top = barsBottom + unit
  const bar4Top = barsBottom + chartHeight
  const gapAboveBar = 6

  return (
    <div
      style={{
        marginTop: 28,
        marginBottom: 10,
        position: 'relative',
        height: bar4Top + gapAboveBar + badgeHeight + labelHeight,
      }}
    >
      <div style={{ position: 'absolute', left: chartLeft, bottom: barsBottom, display: 'flex', alignItems: 'flex-end', gap: barGap }}>
        {[1, 2, 3, 4].map((steps, barIdx) => (
          <div key={barIdx} style={{ display: 'flex', flexDirection: 'column-reverse', width: colWidth }}>
            {Array.from({ length: steps }).map((_, rowIdx) => (
              <div key={rowIdx} style={{ display: 'flex', height: unit }}>
                <div style={{ width: colWidth / 2, background: (rowIdx + barIdx) % 2 === 0 ? NAVY : GOLD }} />
                <div style={{ width: colWidth / 2, background: (rowIdx + barIdx) % 2 === 0 ? GOLD : NAVY }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', left: chartLeft, bottom: 0, fontSize: 9, fontWeight: 'bold', color: GOLD }}>
        VOCÊ ESTÁ AQUI
      </div>

      {/* current (navy) badge, sitting just above the first/shortest bar */}
      <Callout left={chartLeft} bottom={bar1Top + gapAboveBar} background={NAVY} value={currency(current)} />

      {/* target (red) badge, sitting just above the last/tallest bar */}
      <Callout
        left={chartLeft + 3 * (colWidth + barGap)}
        bottom={bar4Top + gapAboveBar}
        background={RED}
        value={currency(target)}
      />

      <div
        style={{
          position: 'absolute',
          left: chartLeft + 3 * (colWidth + barGap),
          bottom: bar4Top + gapAboveBar + badgeHeight + 4,
          fontSize: 9,
          fontWeight: 'bold',
          color: NAVY,
          width: colWidth + 30,
          textAlign: 'center',
        }}
      >
        PODERIA TER
        <br />
        CHEGADO AQUI
      </div>
    </div>
  )
}

function Callout({
  left,
  bottom,
  background,
  value,
}: {
  left: number
  bottom: number
  background: string
  value: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        bottom,
        background,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        padding: '4px 12px',
        borderRadius: 3,
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </div>
  )
}

function cellStyle(align: 'left' | 'right'): React.CSSProperties {
  return {
    padding: '5px 10px',
    textAlign: align,
    border: '1px solid #ddd',
  }
}

function SummaryRowCentered({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        padding: '4px 12px',
        fontWeight: 'bold',
        color: NAVY,
        borderTop: '1px solid #eee',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px 12px',
        background: NAVY,
        color: '#fff',
        fontWeight: bold ? 'bold' : 'normal',
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

