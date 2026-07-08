import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, ClipboardCheck, DollarSign, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { fetchQuarterData } from '@/services/processos'
import { supabase } from '@/lib/supabase/client'
import { DocumentIndicators } from './processos/DocumentIndicators'
import type { Process, QuarterData } from '@/lib/processos'

const QUARTERS = [
  { value: '1', label: 'Q1 — Jan/Mar' },
  { value: '2', label: 'Q2 — Abr/Jun' },
  { value: '3', label: 'Q3 — Jul/Set' },
  { value: '4', label: 'Q4 — Out/Dez' },
]

function getQuarterDateRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = startMonth + 2
  const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`
  const nextStartMonth = endMonth + 1
  const nextStartDate =
    nextStartMonth > 12
      ? `${year + 1}-01-01`
      : `${year}-${String(nextStartMonth).padStart(2, '0')}-01`
  return { startDate, nextStartDate }
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export default function Quarter() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3))
  const [data, setData] = useState<QuarterData | null>(null)
  const [totalValue, setTotalValue] = useState(0)
  const [loading, setLoading] = useState(true)

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { startDate, nextStartDate } = getQuarterDateRange(year, quarter)

    try {
      const quarterData = await fetchQuarterData(year, quarter)
      setData(quarterData)
    } catch {
      setData(null)
    }

    try {
      const { data: works } = await supabase
        .from('works')
        .select('contracted_value, start_date, status, internal_failure')
        .gte('start_date', startDate)
        .lt('start_date', nextStartDate)

      const validWorks = (works || []).filter((w) => {
        if (w.status === 'Cancelado' && !w.internal_failure) return false
        return true
      })
      const total = validWorks.reduce((sum, w) => sum + (w.contracted_value || 0), 0)
      setTotalValue(total)
    } catch {
      setTotalValue(0)
    }

    setLoading(false)
  }, [year, quarter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const processes: Process[] = data?.processes ?? []
  const stats = data?.stats

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-primary text-primary-foreground p-6 md:p-8 rounded-xl shadow-elevation relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
            Relatório Trimestral — Q{quarter}/{year}
          </h2>
          <p className="text-primary-foreground/80 max-w-xl text-sm md:text-base">
            Visão consolidada de processos jurídicos e valores financeiros por trimestre.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp className="w-40 h-40" strokeWidth={1} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Ano</label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Trimestre</label>
          <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q.value} value={q.value}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">No trimestre selecionado</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentação Média</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.avgDocPercentage?.toFixed(1) ?? '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Progresso médio de docs</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-primary/70 mt-1">Contratos no trimestre</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-subtle border p-4 space-y-4">
        <h3 className="text-lg font-serif font-bold text-primary">
          Processos do Q{quarter}/{year}
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead>Processo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tarefa</TableHead>
                <TableHead>Documentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : processes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para este trimestre.
                  </TableCell>
                </TableRow>
              ) : (
                processes.map((p) => (
                  <TableRow key={p.processo_id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium">{p.processo_id}</TableCell>
                    <TableCell className="font-medium">{p.nome_cliente || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.dat_abertura ? format(new Date(p.dat_abertura), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {p.nom_tarefa || '—'}
                    </TableCell>
                    <TableCell>
                      <DocumentIndicators process={p} compact />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
