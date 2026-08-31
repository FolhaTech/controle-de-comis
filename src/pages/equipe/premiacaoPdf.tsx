import { createRoot } from 'react-dom/client'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  calculateAttendantCommission,
  calculateCommissionBreakdown,
  contractValue,
  isContractValid,
} from '@/lib/calculations'
import type { Contract, Consultant, Settings } from '@/lib/types'

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

interface PremiacaoTemplateProps {
  consultant: Consultant
  contracts: Contract[]
  settings: Settings
  month: number
  year: number
}

function PremiacaoTemplate({ consultant, contracts, settings, month, year }: PremiacaoTemplateProps) {
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

  const ajudaCusto = consultant.fixed_salary || 0
  const canceladosTotal = cancelledContracts.reduce((sum, c) => sum + contractValue(c), 0)
  const totalNotaFiscal = totalPremiacao + ajudaCusto - canceladosTotal

  const itemsByContractId = new Map(breakdown.items.map((i) => [i.contract.id, i]))

  const navy = '#1e2a5e'
  const red = '#a30000'

  return (
    <div
      style={{
        width: 780,
        background: '#ffffff',
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#1a1a1a',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', background: navy, color: '#fff', padding: '20px 28px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, letterSpacing: 1 }}>ARANTES ARIMURA</div>
          <div style={{ fontSize: 12, letterSpacing: 4, opacity: 0.85 }}>ADVOCACIA</div>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 15 }}>PREMIAÇÃO</div>
          <div style={{ fontSize: 15, marginBottom: 10 }}>PRESTAÇÃO DE SERVIÇO</div>
          <div style={{ fontSize: 15, fontWeight: 'bold' }}>{consultant.name.toUpperCase()}</div>
          {consultant.cnpj && <div style={{ fontSize: 12 }}>{consultant.cnpj}</div>}
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
            Competência: {MONTH_LABELS[month - 1]}/{year}
          </div>
        </div>
      </div>

      {/* Resumo prestação de serviços */}
      <div style={{ border: `1px solid ${navy}`, marginTop: 18 }}>
        <div style={{ background: navy, color: '#fff', padding: '6px 12px', fontWeight: 'bold' }}>
          Resumo prestação de serviços
        </div>
        <div style={{ background: navy, color: '#fff' }}>
          <SummaryRowCentered label="TICKET MÉDIO" value={currency(ticketMedio)} />
          <SummaryRowCentered label="META ATINGIDA" value={`${validCount} Contratos`} />
        </div>
        <SummaryRow label="Premiação" value={currency(totalPremiacao)} navy={navy} />
        <SummaryRow label="Ajuda de custo" value={currency(ajudaCusto)} navy={navy} />
        <SummaryRow label="Cancelados (-)" value={currency(canceladosTotal)} navy={navy} />
        <SummaryRow label="Total Nota Fiscal" value={currency(totalNotaFiscal)} navy={navy} bold />
      </div>

      {/* Resumo cancelados */}
      <div style={{ border: `1px solid ${red}`, marginTop: 14 }}>
        <div style={{ background: red, color: '#fff', padding: '6px 12px', fontWeight: 'bold' }}>
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
            background: red,
            color: '#fff',
            padding: '6px 12px',
            fontWeight: 'bold',
          }}
        >
          <span>Total</span>
          <span>{currency(canceladosTotal)}</span>
        </div>
      </div>

      {/* Detail table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18, fontSize: 11 }}>
        <thead>
          <tr style={{ background: navy, color: '#fff' }}>
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
                <td style={cellStyle('left')}>{c.service_type || '—'}</td>
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
          <tr style={{ background: red, color: '#fff', fontWeight: 'bold' }}>
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
  navy,
  bold = false,
}: {
  label: string
  value: string
  navy: string
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px 12px',
        borderTop: '1px solid #eee',
        color: navy,
        fontWeight: bold ? 'bold' : 'normal',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export async function generatePremiacaoPdf(
  consultant: Consultant,
  contracts: Contract[],
  settings: Settings,
  month: number,
  year: number,
) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  document.body.appendChild(container)

  const root = createRoot(container)
  await new Promise<void>((resolve) => {
    root.render(
      <PremiacaoTemplate
        consultant={consultant}
        contracts={contracts}
        settings={settings}
        month={month}
        year={year}
      />,
    )
    setTimeout(resolve, 50)
  })

  try {
    const target = container.firstElementChild as HTMLElement
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#ffffff' })

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const pageHeightPx = Math.floor((pageHeight * canvas.width) / pageWidth)

    let renderedPx = 0
    let pageIndex = 0
    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeightPx
      const ctx = pageCanvas.getContext('2d')!
      ctx.drawImage(
        canvas,
        0,
        renderedPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      )
      const sliceHeightPt = (sliceHeightPx * pageWidth) / canvas.width

      if (pageIndex > 0) pdf.addPage()
      pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, sliceHeightPt)

      renderedPx += sliceHeightPx
      pageIndex++
    }

    const monthLabel = String(month).padStart(2, '0')
    pdf.save(`Premiacao_${consultant.name.replace(/\s+/g, '_')}_${monthLabel}-${year}.pdf`)
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}
