import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
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
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  Search,
  Calendar,
  RefreshCw,
} from 'lucide-react'
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

interface QuarterContract {
  id: string
  name: string | null
  client: string | null
  client_cpf: string | null
  contracted_value: number | null
  entry_value: number | null
  entry_payment_method: string | null
  payment_method: string | null
  installments: number | null
  status: string | null
  start_date: string | null
  end_date_planned: string | null
  internal_failure: boolean | null
  manager: string | null
  address: string | null
}

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

function formatCurrency(val: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

function getStatusBadge(status: string | null) {
  if (!status) return <Badge variant="secondary">—</Badge>
  const variant =
    status === 'Ativo' ? 'default' : status === 'Cancelado' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

export default function Quarter() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3))
  const [data, setData] = useState<QuarterData | null>(null)
  const [allContracts, setAllContracts] = useState<QuarterContract[]>([])
  const [quarterContracts, setQuarterContracts] = useState<QuarterContract[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [allTotalValue, setAllTotalValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [contractsLoading, setContractsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'quarter' | 'all'>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const hasFetchedRef = useRef(false)
  const { toast } = useToast()

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  const loadQuarterData = useCallback(async () => {
    setLoading(true)
    const { startDate, nextStartDate } = getQuarterDateRange(year, quarter)

    try {
      const quarterData = await fetchQuarterData(year, quarter)
      setData(quarterData)
    } catch {
      setData(null)
    }

    try {
      const { data: viewData, error: viewError } = await supabase
        .from('vw_formas_pagamentos')
        .select(
          'id, name, client, contracted_value, entry_value, entry_payment_method, installments, status, start_date, end_date_planned, internal_failure',
        )
        .gte('start_date', startDate)
        .lt('start_date', nextStartDate)
        .order('start_date', { ascending: false })

      if (viewError) throw viewError

      setQuarterContracts((viewData || []) as QuarterContract[])
      const total = (viewData || []).reduce((sum, c: any) => sum + (c.contracted_value || 0), 0)
      setTotalValue(total)
    } catch {
      setQuarterContracts([])
      setTotalValue(0)
    }

    setLoading(false)
  }, [year, quarter])

  const loadAllContracts = useCallback(async () => {
    setContractsLoading(true)
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('vw_formas_pagamentos')
        .select(
          'id, name, client, client_cpf, contracted_value, entry_value, entry_payment_method, payment_method, installments, status, start_date, end_date_planned, internal_failure, manager, address',
        )
        .order('created_at', { ascending: false })

      if (viewError) throw viewError

      const contracts = (viewData || []) as QuarterContract[]
      setAllContracts(contracts)
      setAllTotalValue(contracts.reduce((sum, c) => sum + (c.contracted_value || 0), 0))
    } catch {
      setAllContracts([])
      setAllTotalValue(0)
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível carregar os contratos. Verifique sua conexão.',
        variant: 'destructive',
      })
    }
    setContractsLoading(false)
  }, [toast])

  useEffect(() => {
    loadQuarterData()
  }, [loadQuarterData, refreshKey])

  useEffect(() => {
    loadAllContracts()
  }, [loadAllContracts, refreshKey])

  const handleRefresh = useCallback(() => {
    hasFetchedRef.current = false
    setRefreshKey((k) => k + 1)
  }, [])

  const processes: Process[] = data?.processes ?? []
  const stats = data?.stats

  const activeContracts = viewMode === 'all' ? allContracts : quarterContracts

  const displayedContracts = useMemo(() => {
    if (!search.trim()) return activeContracts
    const q = search.toLowerCase().trim()
    return activeContracts.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.client || '').toLowerCase().includes(q) ||
        (c.client_cpf || '').toLowerCase().includes(q),
    )
  }, [activeContracts, search])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-primary text-primary-foreground p-6 md:p-8 rounded-xl shadow-elevation relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
              Relatório Trimestral — Q{quarter}/{year}
            </h2>
            <p className="text-primary-foreground/80 max-w-xl text-sm md:text-base">
              Visão consolidada de processos jurídicos e valores financeiros por trimestre.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRefresh}
            className="shrink-0"
            disabled={contractsLoading || loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${contractsLoading || loading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
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

      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
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
                <CardTitle className="text-sm font-medium text-primary">
                  Valor no Trimestre
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-primary/70 mt-1">
                  Contratos do Q{quarter}/{year}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Valor Total Geral
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(allTotalValue)}
                </div>
                <p className="text-xs text-green-600/70 mt-1">
                  Todos os contratos ({allContracts.length})
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-subtle border p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-serif font-bold text-primary">
            {viewMode === 'all' ? 'Todos os Contratos' : `Contratos do Q${quarter}/${year}`}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'quarter' ? 'default' : 'outline'}
              onClick={() => setViewMode('quarter')}
            >
              <Calendar className="h-4 w-4 mr-1" />Q{quarter}/{year}
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead className="font-semibold text-primary min-w-[160px]">Cliente</TableHead>
                <TableHead>Nome do Contrato/Obra</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead className="text-right">Valor Contratado</TableHead>
                <TableHead className="text-right">Valor de Entrada</TableHead>
                <TableHead>Método de Entrada</TableHead>
                <TableHead className="text-center">Parcelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Previsão de Término</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : displayedContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                displayedContracts.map((c) => (
                  <TableRow key={c.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-bold text-base text-primary min-w-[160px]">
                      {c.client || '—'}
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">
                      {c.name || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.client_cpf || '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(c.contracted_value)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(c.entry_value)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.entry_payment_method || '—'}
                    </TableCell>
                    <TableCell className="text-center">{c.installments || '—'}</TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.start_date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.end_date_planned)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!contractsLoading && displayedContracts.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Exibindo {displayedContracts.length} de{' '}
            {(viewMode === 'all' ? allContracts : quarterContracts).length} contrato(s)
          </p>
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
