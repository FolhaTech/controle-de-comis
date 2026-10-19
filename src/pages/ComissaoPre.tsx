import { useEffect, useRef, useState } from 'react'
import { Upload, RefreshCw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  consolidarPeriodo,
  currentPeriodoLabel,
  fetchPeriodo,
  uploadPlanilha,
  type ComissaoPreResult,
} from '@/services/comissao-pre'

const currency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

export default function ComissaoPre() {
  const { toast } = useToast()
  const [periodo, setPeriodo] = useState(currentPeriodoLabel())
  const [result, setResult] = useState<ComissaoPreResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isConsolidating, setIsConsolidating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async (label: string) => {
    setLoading(true)
    const { data, error } = await fetchPeriodo(label)
    setLoading(false)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: String((error as Error)?.message || error) })
      setResult(null)
      return
    }
    setResult(data)
  }

  useEffect(() => {
    load(periodo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const { data, error } = await uploadPlanilha(file)
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao importar', description: String((error as Error)?.message || error) })
      return
    }
    toast({
      title: `${data?.imported} liberações importadas`,
      description: data?.periodos.length ? `Períodos afetados: ${data.periodos.join(', ')}` : undefined,
    })
    load(periodo)
  }

  const handleConsolidar = async () => {
    setIsConsolidating(true)
    const { data, error } = await consolidarPeriodo(periodo)
    setIsConsolidating(false)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao consolidar', description: String((error as Error)?.message || error) })
      return
    }
    setResult(data)
    toast({
      title: 'Período consolidado',
      description: data?.email_sent ? 'E-mail de aprovação enviado.' : 'Consolidado, mas o e-mail não foi enviado (confira as variáveis de SMTP).',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Comissão Pré</h2>
          <p className="text-muted-foreground">
            Premiação das atendentes do pré-processual, alimentada pela planilha do Legal One.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Importando...' : 'Importar planilha'}
          </Button>
          <Button variant="outline" onClick={() => load(periodo)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleConsolidar} disabled={isConsolidating}>
            <Send className="mr-2 h-4 w-4" />
            {isConsolidating ? 'Consolidando...' : 'Consolidar e enviar'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="periodo" className="text-sm font-medium">
          Período (mês de fechamento):
        </label>
        <Input
          id="periodo"
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="w-[180px]"
        />
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-subtle border p-4">
          <p className="text-sm text-muted-foreground">
            Período: {formatDate(result.inicio)} a {formatDate(result.fim)} (dia 20 a dia 19)
          </p>
          <p className="text-lg font-semibold mt-1">
            Total de pastas liberadas: {result.total_pastas}
          </p>
          <p className="text-sm mt-1">
            Gestão direta ({result.gestora_direta}): <strong>{currency(result.valor_gestao)}</strong>
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-subtle border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>Atendente</TableHead>
              <TableHead className="text-center">Liberações</TableHead>
              <TableHead className="text-center">Meta individual (40)</TableHead>
              <TableHead className="text-center">Streak</TableHead>
              <TableHead className="text-right">Individual</TableHead>
              <TableHead className="text-right">Coletivo</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!result || result.atendentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {loading ? 'Carregando...' : 'Nenhuma liberação neste período.'}
                </TableCell>
              </TableRow>
            ) : (
              result.atendentes.map((a) => (
                <TableRow key={a.responsavel} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-medium">{a.responsavel}</TableCell>
                  <TableCell className="text-center">{a.liberacoes}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={a.bateu_individual ? 'default' : 'secondary'}>
                      {a.bateu_individual ? 'Bateu' : 'Não bateu'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{a.streak_individual || '—'}</TableCell>
                  <TableCell className="text-right">{currency(a.valor_individual)}</TableCell>
                  <TableCell className="text-right">{currency(a.valor_coletivo)}</TableCell>
                  <TableCell className="text-right font-semibold">{currency(a.valor_total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
