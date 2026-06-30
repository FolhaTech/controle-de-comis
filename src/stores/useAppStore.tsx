import React, { createContext, useContext, useState, useEffect } from 'react'
import { Contract, Consultant, Settings, FilterContext } from '@/lib/types'
import { mockConsultants, mockContracts, mockSettings } from '@/lib/mock-data'

interface AppStoreState {
  contracts: Contract[]
  consultants: Consultant[]
  settings: Settings
  filter: FilterContext
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => void
  updateContract: (id: string, contract: Partial<Contract>) => void
  updateSettings: (settings: Partial<Settings>) => void
  setFilter: (filter: Partial<FilterContext>) => void
}

const AppContext = createContext<AppStoreState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts)
  const [consultants, setConsultants] = useState<Consultant[]>(mockConsultants)
  const [settings, setSettings] = useState<Settings>(mockSettings)

  const [filter, setFilterState] = useState<FilterContext>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const addContract = (contractData: Omit<Contract, 'id' | 'createdAt'>) => {
    const newContract: Contract = {
      ...contractData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    setContracts((prev) => [newContract, ...prev])
  }

  const updateContract = (id: string, data: Partial<Contract>) => {
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const setFilter = (newFilter: Partial<FilterContext>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }))
  }

  return React.createElement(
    AppContext.Provider,
    {
      value: {
        contracts,
        consultants,
        settings,
        filter,
        addContract,
        updateContract,
        updateSettings,
        setFilter,
      },
    },
    children,
  )
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}
