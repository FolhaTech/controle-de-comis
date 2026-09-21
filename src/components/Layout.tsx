import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import useAppStore from '@/stores/useAppStore'

export default function Layout() {
  const { initApp } = useAppStore()

  useEffect(() => {
    initApp()
  }, [initApp])

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
