import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import useAppStore from '@/stores/useAppStore'

export default function Equipe() {
  const { consultants } = useAppStore()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Equipe Comercial</h2>
          <p className="text-muted-foreground">Gerencie os consultores e seus acessos.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {consultants.map((consultant) => (
          <Card key={consultant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center space-y-0 gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground font-serif">
                  {consultant.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{consultant.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{consultant.role}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mt-2">
                <Badge
                  variant={consultant.active ? 'default' : 'secondary'}
                  className={consultant.active ? 'bg-success hover:bg-success' : ''}
                >
                  {consultant.active ? 'Ativo' : 'Inativo'}
                </Badge>
                <button className="text-sm text-primary hover:underline font-medium">
                  Ver Performance
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
