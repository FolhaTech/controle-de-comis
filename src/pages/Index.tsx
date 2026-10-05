import { useEffect, useMemo, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import {
  filterContractsByPeriod,
  calculateMetrics,
  calculateCommission,
  calculatePersonMonthlyCommission,
} from '@/lib/calculations'
import { MetricCards } from './dashboard/MetricCards'
import { ProgressCharts } from './dashboard/ProgressCharts'
import { RecentActivity } from './dashboard/RecentActivity'
import { ContractsSummaryTable } from './dashboard/ContractsSummaryTable'
import { DashboardFilters } from './dashboard/DashboardFilters'
import { TeamBreakdownTable } from './dashboard/TeamBreakdownTable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const {
    contracts,
    consultants,
    filter,
    settings,
    contractsLoading,
    consultantsLoading,
    contractsError,
  } = useAppStore()
  const [hasPendingAlert, setHasPendingAlert] = useState(false)
  const [teamFilter, setTeamFilter] = useState('all')
  const [taskFilter, setTaskFilter] = useState('all')
  const { toast } = useToast()

  const loading = contractsLoading || consultantsLoading

  const teamOptions = useMemo(
    () => Array.from(new Set(consultants.map((c) => c.name))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [consultants],
  )
  const taskOptions = useMemo(
    () =>
      Array.from(
        new Set(
          contracts
            .map((c) => c.case_type)
            .filter((t): t is string => !!t && t.trim().length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [contracts],
  )

  // Scoped only by month/year — kept separate from the display-scoped list
  // below so Remuneração can always be computed against the real monthly
  // contract set, matching the Equipe page, even when a tarefa filter narrows
  // what's shown elsewhere on the dashboard.
  const periodContracts = filterContractsByPeriod(contracts, filter.month, filter.year)

  const filteredContracts = periodContracts.filter((c) => {
    const matchesTeam = teamFilter === 'all' || (c.closed_by || '') === teamFilter
    const matchesTask = taskFilter === 'all' || (c.case_type || '') === taskFilter
    return matchesTeam && matchesTask
  })

  const metrics = calculateMetrics(filteredContracts)
  const commission = calculateCommission(filteredContracts, settings)

  const activeContracts = metrics.validContractsCount
  const totalContractedValue = metrics.grossRevenue
  const scopedConsultants =
    teamFilter === 'all' ? consultants : consultants.filter((c) => c.name === teamFilter)
  const teamSize = scopedConsultants.filter((c) => c.status === 'active').length
  const remuneracaoTotal = scopedConsultants.reduce(
    (sum, c) =>
      sum + calculatePersonMonthlyCommission(periodContracts, c.name, filter.month, filter.year, settings).total,
    0,
  )
  const individualAverage = teamSize > 0 ? metrics.validContractsCount / teamSize : 0

  useEffect(() => {
    if (contractsError) {
      toast({
        title: 'Erro de Conexão',
        description: contractsError,
        variant: 'destructive',
      })
    }
  }, [contractsError, toast])

  useEffect(() => {
    const hasOldPending = contracts.some((c) => {
      if (c.status === 'Distrato Pendente' && c.created_at) {
        const diffHours =
          (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60)
        return diffHours > 48
      }
      return false
    })
    setHasPendingAlert(hasOldPending)
  }, [contracts])

  return (
    <div className="space-y-6 animate-fade-in">
      {hasPendingAlert && (
        <Alert variant="destructive" className="border-orange-500 text-orange-700 bg-orange-50">
          <AlertCircle className="h-4 w-4 !text-orange-700" />
          <AlertTitle>Atenção Requerida</AlertTitle>
          <AlertDescription>
            Existem contratos com "Distrato Pendente" há mais de 48 horas. Ação necessária para
            reversão ou cancelamento.
          </AlertDescription>
        </Alert>
      )}

      <DashboardFilters
        team={teamFilter}
        onTeamChange={setTeamFilter}
        teamOptions={teamOptions}
        task={taskFilter}
        onTaskChange={setTaskFilter}
        taskOptions={taskOptions}
      />

      <MetricCards
        activeContracts={activeContracts}
        totalContractedValue={totalContractedValue}
        teamSize={teamSize}
        remuneracaoTotal={remuneracaoTotal}
        loading={loading}
      />

      <ProgressCharts
        individualCount={Number(individualAverage.toFixed(1))}
        individualGoal={settings.goals.individualContracts}
        groupCount={metrics.validContractsCount}
        groupGoal={settings.goals.groupContracts}
        ticketMedio={metrics.ticketMedio}
        ticketMedioGoal={settings.goals.ticketMedio}
        loading={loading}
      />

      <ContractsSummaryTable contracts={filteredContracts} loading={contractsLoading} />

      <TeamBreakdownTable
        consultants={scopedConsultants}
        displayContracts={filteredContracts}
        periodContracts={periodContracts}
        settings={settings}
        month={filter.month}
        year={filter.year}
        loading={loading}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity contracts={filteredContracts} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-subtle border p-6 h-full">
            <h3 className="font-serif text-lg font-semibold mb-4 text-primary">
              Resumo Financeiro
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">
                  Comissão Base ({commission.currentTier}%)
                </span>
                <span className="font-medium">R$ {commission.baseCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-muted-foreground">Bônus Adicionais</span>
                <span className="font-medium text-success">
                  + R$ {commission.bonusValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-lg">Total a Receber</span>
                <span className="font-bold text-xl text-primary">
                  R$ {commission.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
