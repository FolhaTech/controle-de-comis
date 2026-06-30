import React, { createContext, useContext, useState } from 'react'
import { Contract, Consultant, Settings, FilterContext, ActionType } from '@/lib/types'
import { mockConsultants, mockContracts, mockSettings, mockActionTypes } from '@/lib/mock-data'

interface AppStoreState {
  contracts: Contract[]
  consultants: Consultant[]
  settings: Settings
  filter: FilterContext
  actionTypes: ActionType[]
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => void
  updateContract: (id: string, contract: Partial<Contract>) => void
  deleteContract: (id: string) => void
  addConsultant: (consultant: Omit<Consultant, 'id'>) => void
  updateConsultant: (id: string, consultant: Partial<Consultant>) => void
  addActionType: (actionType: Omit<ActionType, 'id'>) => void
  updateActionType: (id: string, actionType: Partial<ActionType>) => void
  deleteActionType: (id: string) => void
  updateSettings: (settings: Partial<Settings>) => void
  setFilter: (filter: Partial<FilterContext>) => void
}

const AppContext = createContext<AppStoreState | null>(null)

const generateId = () => Math.random().toString(36).substr(2, 9)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts)
  const [consultants, setConsultants] = useState<Consultant[]>(mockConsultants)
  const [settings, setSettings] = useState<Settings>(mockSettings)
  const [actionTypes, setActionTypes] = useState<ActionType[]>(mockActionTypes)

  const [filter, setFilterState] = useState<FilterContext>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const addContract = (contractData: Omit<Contract, 'id' | 'createdAt'>) => {
    const newContract: Contract = {
      ...contractData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    setContracts((prev) => [newContract, ...prev])
  }

  const updateContract = (id: string, data: Partial<Contract>) => {
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const deleteContract = (id: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== id))
  }

  const addConsultant = (consultantData: Omit<Consultant, 'id'>) => {
    const newConsultant: Consultant = { ...consultantData, id: generateId() }
    setConsultants((prev) => [...prev, newConsultant])
  }

  const updateConsultant = (id: string, data: Partial<Consultant>) => {
    setConsultants((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const addActionType = (actionTypeData: Omit<ActionType, 'id'>) => {
    const newActionType: ActionType = { ...actionTypeData, id: generateId() }
    setActionTypes((prev) => [...prev, newActionType])
  }

  const updateActionType = (id: string, data: Partial<ActionType>) => {
    setActionTypes((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
  }

  const deleteActionType = (id: string) => {
    setActionTypes((prev) => prev.filter((a) => a.id !== id))
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
        actionTypes,
        addContract,
        updateContract,
        deleteContract,
        addConsultant,
        updateConsultant,
        addActionType,
        updateActionType,
        deleteActionType,
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
