import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { fetchProcesses, fetchProcessStats } from '@/services/processos'
import type { Process, ProcessStats } from '@/lib/processos'
import { StatsCards } from './processos/StatsCards'
import { DocumentIndicators } from './processos/DocumentIndicators'
import { ProcessDetailDialog } from './processos/ProcessDetailDialog'

type SortField = 'dat_abertura' | 'nome_cliente' | 'processo_id' | 'nom_tarefa'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

export default function Processos() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [stats, setStats] = useState<ProcessStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('dat_abertura')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchProcesses(page, PAGE_SIZE, debouncedQuery, sortBy, sortDir)
      setProcesses(result.data)
      setTotal(result.total)
    } catch {
      setProcesses([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQuery, sortBy, sortDir])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    fetchProcessStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [])

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const handleRowClick = (process: Process) => {
    setSelectedProcess(process)
    setDetailOpen(true)
  }

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-secondary/60 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label} <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary">Processos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoramento de processos e documentação
        </p>
      </div>

      <StatsCards stats={stats} loading={statsLoading} />

      <div className="bg-white rounded-xl shadow-subtle border p-4 space-y-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou processo..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <SortHeader field="processo_id" label="Processo" />
                <SortHeader field="dat_abertura" label="Data" />
                <SortHeader field="nom_tarefa" label="Tarefa" />
                <SortHeader field="nome_cliente" label="Cliente" />
                <TableHead>CPF</TableHead>
                <TableHead>Documentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : processes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                processes.map((p) => (
                  <TableRow
                    key={p.processo_id}
                    className="hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(p)}
                  >
                    <TableCell className="font-medium">{p.processo_id}</TableCell>
                    <TableCell className="text-sm">
                      {p.dat_abertura ? format(new Date(p.dat_abertura), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {p.nom_tarefa || '—'}
                    </TableCell>
                    <TableCell className="font-medium">{p.nome_cliente || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.cpf_cliente || '—'}
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total}`
              : '0 resultados'}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Pág. {page} de {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProcessDetailDialog
        process={selectedProcess}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
