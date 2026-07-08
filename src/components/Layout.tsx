import { Outlet, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import useAppStore from '@/stores/useAppStore'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'

export default function Layout() {
  const { initApp } = useAppStore()
  const { session, loading } = useAuth()

  useEffect(() => {
    initApp()
  }, [initApp])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar />
      <div className="flex-1 flex flex-col md:pl-72">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
