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
import { Badge } from '@/components/ui/badge'
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

interface QuarterContract {
  id: string
  name: string | null
  client: string | null
  contracted_value: number | null
  entry_value: number | null
  entry_payment_method: string | null
  installments: number | null
  status: string | null
  start_date: string | null
  end_date_planned: string | null
  internal_failure: boolean | null
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
  const [contracts, setContracts] = useState<QuarterContract[]>([])
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
      const { data: viewData } = await supabase
        .from('vw_formas_pagamentos')
        .select(
          'id, name, client, contracted_value, entry_value, entry_payment_method, installments, status, start_date, end_date_planned, internal_failure',
        )
        .gte('start_date', startDate)
        .lt('start_date', nextStartDate)
        .order('start_date', { ascending: false })

      const validContracts = (viewData || []).filter((c) => {
        if (c.status === 'Cancelado' && !c.internal_failure) return false
        return true
      })
      setContracts(validContracts as QuarterContract[])
      const total = validContracts.reduce((sum, c) => sum + (c.contracted_value || 0), 0)
      setTotalValue(total)
    } catch {
      setContracts([])
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
          Contratos do Q{quarter}/{year}
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead>Nome</TableHead>
                <TableHead>Cliente</TableHead>
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
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((c) => (
                  <TableRow key={c.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="font-medium max-w-[180px] truncate">
                      {c.name || '—'}
                    </TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {c.client || '—'}
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
                      {c.start_date ? format(new Date(c.start_date), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.end_date_planned
                        ? format(new Date(c.end_date_planned), 'dd/MM/yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
