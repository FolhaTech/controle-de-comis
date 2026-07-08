import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { filterContractsByPeriod, calculateMetrics, calculateCommission } from '@/lib/calculations'
import { MetricCards } from './dashboard/MetricCards'
import { ProgressCharts } from './dashboard/ProgressCharts'
import { RecentActivity } from './dashboard/RecentActivity'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Index() {
  const { contracts, consultants, filter, settings, contractsLoading, consultantsLoading } =
    useAppStore()
  const [hasPendingAlert, setHasPendingAlert] = useState(false)

  const loading = contractsLoading || consultantsLoading

  const filteredContracts = filterContractsByPeriod(contracts, filter.month, filter.year)
  const metrics = calculateMetrics(filteredContracts)
  const commission = calculateCommission(filteredContracts, settings)

  const activeContracts = contracts.filter((c) => c.status !== 'Cancelado').length
  const totalContractedValue = contracts.reduce((sum, c) => sum + (c.contracted_value || 0), 0)
  const teamSize = consultants.filter((c) => c.status === 'active').length
  const avgProgress =
    contracts.length > 0
      ? contracts.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / contracts.length
      : 0

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

      <MetricCards
        activeContracts={activeContracts}
        totalContractedValue={totalContractedValue}
        teamSize={teamSize}
        avgProgress={avgProgress}
        loading={loading}
      />

      <ProgressCharts
        individualCount={metrics.validContractsCount}
        individualGoal={settings.goals.individualContracts}
        groupCount={metrics.validContractsCount}
        groupGoal={settings.goals.groupContracts}
        ticketMedio={metrics.ticketMedio}
        ticketMedioGoal={settings.goals.ticketMedio}
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
