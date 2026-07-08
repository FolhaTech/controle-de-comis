import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { DocumentIndicators } from './DocumentIndicators'
import { DOCUMENT_FIELDS, isDocFilled, type Process } from '@/lib/processos'
import { format } from 'date-fns'

interface ProcessDetailDialogProps {
  process: Process | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProcessDetailDialog({ process, open, onOpenChange }: ProcessDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        {process && (
          <>
            <DialogHeader>
              <DialogTitle>Processo #{process.processo_id}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium">{process.nome_cliente || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium">{process.cpf_cliente || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{process.telefone_cliente || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Abertura</p>
                    <p className="font-medium">
                      {process.dat_abertura
                        ? format(new Date(process.dat_abertura), 'dd/MM/yyyy')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tarefa</p>
                    <Badge variant="secondary">{process.nom_tarefa || '—'}</Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Resumo do Caso</p>
                  <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-md">
                    {process.resumo_caso_cli || 'Sem resumo disponível.'}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground mb-3">Documentos</p>
                  <div className="mb-3">
                    <DocumentIndicators process={process} />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {DOCUMENT_FIELDS.map((field) => {
                      const filled = isDocFilled(process[field.key])
                      return (
                        <div key={field.key} className="flex items-center justify-between text-sm">
                          <span>{field.label}</span>
                          <Badge variant={filled ? 'default' : 'outline'}>
                            {filled ? 'Anexado' : 'Pendente'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
