import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const { settings, updateSettings } = useAppStore()
  const { toast } = useToast()

  const handleSaveGoals = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateSettings({
      goals: {
        individualContracts: Number(formData.get('indCont')),
        individualValue: Number(formData.get('indVal')),
        groupContracts: Number(formData.get('grpCont')),
        groupValue: Number(formData.get('grpVal')),
        ticketMedio: Number(formData.get('tkMedio')),
      },
    })
    toast({ title: 'Configurações atualizadas', description: 'Metas salvas com sucesso.' })
  }

  const handleSaveIPCA = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateSettings({
      ipca: {
        year: Number(formData.get('ipcaYear')),
        value: Number(formData.get('ipcaVal')),
        appliedPercentage: Number(formData.get('ipcaPct')),
      },
    })
    toast({ title: 'Configurações atualizadas', description: 'Reajuste IPCA salvo com sucesso.' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-serif font-bold">Configurações do Sistema</h2>

      <Tabs defaultValue="metas" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="metas">Metas e Gatilhos</TabsTrigger>
          <TabsTrigger value="ajuda">Ajuda de Custo (IPCA)</TabsTrigger>
        </TabsList>

        <TabsContent value="metas" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metas de Atendimento (Mensal)</CardTitle>
              <CardDescription>Defina os alvos de contratos e faturamento.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGoals} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 border rounded-lg bg-secondary/20">
                    <h4 className="font-semibold text-primary">Meta Individual</h4>
                    <div className="space-y-2">
                      <Label htmlFor="indCont">Qtd. Contratos</Label>
                      <Input
                        id="indCont"
                        name="indCont"
                        type="number"
                        defaultValue={settings.goals.individualContracts}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="indVal">Valor Total (R$)</Label>
                      <Input
                        id="indVal"
                        name="indVal"
                        type="number"
                        defaultValue={settings.goals.individualValue}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg bg-secondary/20">
                    <h4 className="font-semibold text-primary">Meta de Grupo</h4>
                    <div className="space-y-2">
                      <Label htmlFor="grpCont">Qtd. Contratos</Label>
                      <Input
                        id="grpCont"
                        name="grpCont"
                        type="number"
                        defaultValue={settings.goals.groupContracts}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grpVal">Valor Total (R$)</Label>
                      <Input
                        id="grpVal"
                        name="grpVal"
                        type="number"
                        defaultValue={settings.goals.groupValue}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Label htmlFor="tkMedio">Ticket Médio Alvo (R$)</Label>
                  <Input
                    id="tkMedio"
                    name="tkMedio"
                    type="number"
                    className="max-w-xs"
                    defaultValue={settings.goals.ticketMedio}
                  />
                </div>

                <Button type="submit">Salvar Metas</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gatilhos de Comissão</CardTitle>
              <CardDescription>
                Escalonamento de % baseado no número de contratos validados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {settings.tiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-3 border rounded-md">
                    <div className="flex-1">
                      <span className="font-medium">
                        {tier.min} a {tier.max === 999 ? '++' : tier.max} contratos
                      </span>
                    </div>
                    <div className="font-bold text-primary">{tier.percentage}%</div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4">
                  * Para editar os gatilhos, entre em contato com o suporte técnico.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ajuda" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reajuste - Ajuda de Custo</CardTitle>
              <CardDescription>
                Configuração baseada no Índice Nacional de Preços ao Consumidor Amplo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveIPCA} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="ipcaYear">Ano Referência</Label>
                  <Input
                    id="ipcaYear"
                    name="ipcaYear"
                    type="number"
                    defaultValue={settings.ipca.year}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipcaVal">IPCA (%)</Label>
                  <Input
                    id="ipcaVal"
                    name="ipcaVal"
                    type="number"
                    step="0.01"
                    defaultValue={settings.ipca.value}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipcaPct">Porcentagem Aplicada (%)</Label>
                  <Input
                    id="ipcaPct"
                    name="ipcaPct"
                    type="number"
                    defaultValue={settings.ipca.appliedPercentage}
                  />
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border mt-4">
                  <p className="text-sm font-medium">Reajuste final calculado:</p>
                  <p className="text-2xl font-bold text-primary">
                    {((settings.ipca.value * settings.ipca.appliedPercentage) / 100).toFixed(2)}%
                  </p>
                </div>
                <Button type="submit">Salvar IPCA</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
