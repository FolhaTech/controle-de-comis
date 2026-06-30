import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: Rota não encontrada:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <h1 className="text-4xl font-serif font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">
          Ops! A página que você está procurando não existe.
        </p>
        <Button asChild className="w-full mt-4">
          <Link to="/">Voltar para o Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
