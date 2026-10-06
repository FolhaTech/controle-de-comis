import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { PremiacaoReport } from './equipe/premiacaoPdf'
import { contractPeriodDate } from '@/lib/calculations'
import type { Consultant } from '@/lib/types'

const normalize = (value: string) => value.trim().toLowerCase()

// Print-only page used by the monthly Premiação email (see /api/cron/premiacao):
// renders one report per consultant with contracts in the month, page-broken, so
// the browser's print-to-PDF gives the whole team in one document.
export default function PremiacaoPrintPage() {
  const [params] = useSearchParams()
  const { consultants, consultantsLoading, contracts, contractsLoading, consultantDeductions, settings, initApp } =
    useAppStore()

  const month = Number(params.get('month'))
  const year = Number(params.get('year'))

  useEffect(() => {
    initApp()
  }, [initApp])

  const withActivity = useMemo(() => {
    const inMonth = contracts.filter((c) => {
      const d = contractPeriodDate(c)
      return !!d && d.getMonth() + 1 === month && d.getFullYear() === year
    })
    const closers = new Set(inMonth.map((c) => normalize(c.closed_by ?? '')).filter(Boolean))
    return consultants.filter((c: Consultant) => closers.has(normalize(c.name)))
  }, [consultants, contracts, month, year])

  const loaded = !consultantsLoading && !contractsLoading && consultants.length > 0

  return (
    <div id="premiacao-print-root" data-ready={loaded ? 'true' : 'false'} data-contract-count={loaded ? withActivity.length : 0}>
      {loaded &&
        withActivity.map((consultant, index) => (
          <PremiacaoReport
            key={consultant.id}
            consultant={consultant}
            contracts={contracts}
            consultantDeductions={consultantDeductions}
            settings={settings}
            month={month}
            year={year}
            pageBreakAfter={index < withActivity.length - 1}
          />
        ))}
    </div>
  )
}
