import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Contract, Consultant, Settings, FilterContext, ActionType } from '@/lib/types'
import {
  fetchTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '@/services/team-members'
import {
  fetchContracts,
  createContract,
  updateContract,
  deleteContract,
} from '@/services/contracts'
import {
  fetchActionTypes,
  createActionType,
  updateActionType,
  deleteActionType,
} from '@/services/action-types'

const defaultSettings: Settings = {
  goals: {
    individualContracts: 50,
    individualValue: 135000,
    groupContracts: 200,
    groupValue: 540000,
    ticketMedio: 2700,
  },
  tiers: [
    { min: 10, max: 29, percentage: 2.5 },
    { min: 30, max: 36, percentage: 5.0 },
    { min: 37, max: 49, percentage: 6.0 },
    { min: 50, max: 999, percentage: 10.0 },
  ],
  bonuses: {
    highValueThreshold: 3000,
    highValuePercentage: 1.0,
    maxInstallments: 12,
    installmentsPercentage: 2.0,
  },
  quarterTiers: [
    { contracts: 105, award: 1250 },
    { contracts: 120, award: 1625 },
    { contracts: 150, award: 2500 },
  ],
  ipca: { year: 2025, value: 4.83, appliedPercentage: 70 },
}

interface AppStoreState {
  contracts: Contract[]
  contractsLoading: boolean
  consultants: Consultant[]
  consultantsLoading: boolean
  actionTypes: ActionType[]
  actionTypesLoading: boolean
  settings: Settings
  filter: FilterContext
  initApp: () => Promise<void>
  fetchConsultants: () => Promise<{ error: unknown }>
  fetchContracts: () => Promise<void>
  fetchActionTypes: () => Promise<void>
  addContract: (contract: Partial<Contract>) => Promise<{ error: unknown }>
  updateContract: (id: string, updates: Partial<Contract>) => Promise<{ error: unknown }>
  deleteContract: (id: string) => Promise<{ error: unknown }>
  addConsultant: (member: Partial<Consultant>) => Promise<{ error: unknown }>
  updateConsultant: (id: string, updates: Partial<Consultant>) => Promise<{ error: unknown }>
  deleteConsultant: (id: string) => Promise<{ error: unknown }>
  addActionType: (actionType: { name: string; active: boolean }) => Promise<{ error: unknown }>
  updateActionType: (id: string, updates: Partial<ActionType>) => Promise<{ error: unknown }>
  deleteActionType: (id: string) => Promise<{ error: unknown }>
  updateSettings: (settings: Partial<Settings>) => void
  setFilter: (filter: Partial<FilterContext>) => void
}

const AppContext = createContext<AppStoreState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [consultantsLoading, setConsultantsLoading] = useState(false)
  const [actionTypes, setActionTypes] = useState<ActionType[]>([])
  const [actionTypesLoading, setActionTypesLoading] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [filter, setFilterState] = useState<FilterContext>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const fetchConsultants = useCallback(async () => {
    setConsultantsLoading(true)
    const { data, error } = await fetchTeamMembers()
    if (!error && data) setConsultants(data)
    setConsultantsLoading(false)
    return { error }
  }, [])

  const fetchContractsAction = useCallback(async () => {
    setContractsLoading(true)
    const { data, error } = await fetchContracts()
    if (!error && data) setContracts(data)
    setContractsLoading(false)
  }, [])

  const fetchActionTypesAction = useCallback(async () => {
    setActionTypesLoading(true)
    const { data, error } = await fetchActionTypes()
    if (!error && data) setActionTypes(data)
    setActionTypesLoading(false)
  }, [])

  const initApp = useCallback(async () => {
    await Promise.all([fetchContractsAction(), fetchConsultants(), fetchActionTypesAction()])
  }, [fetchContractsAction, fetchConsultants, fetchActionTypesAction])

  const addContract = useCallback(async (contract: Partial<Contract>) => {
    const { data, error } = await createContract(contract)
    if (!error && data) setContracts((prev) => [data, ...prev])
    return { error }
  }, [])

  const updateContractRow = useCallback(async (id: string, updates: Partial<Contract>) => {
    const { data, error } = await updateContract(id, updates)
    if (!error && data) setContracts((prev) => prev.map((c) => (c.id === id ? data : c)))
    return { error }
  }, [])

  const deleteContractRow = useCallback(async (id: string) => {
    const { error } = await deleteContract(id)
    if (!error) setContracts((prev) => prev.filter((c) => c.id !== id))
    return { error }
  }, [])

  const addConsultant = useCallback(async (member: Partial<Consultant>) => {
    const { data, error } = await createTeamMember(member)
    if (!error && data) setConsultants((prev) => [data, ...prev])
    return { error }
  }, [])

  const updateConsultant = useCallback(async (id: string, updates: Partial<Consultant>) => {
    const { data, error } = await updateTeamMember(id, updates)
    if (!error && data) setConsultants((prev) => prev.map((c) => (c.id === id ? data : c)))
    return { error }
  }, [])

  const deleteConsultant = useCallback(async (id: string) => {
    const { error } = await deleteTeamMember(id)
    if (!error) setConsultants((prev) => prev.filter((c) => c.id !== id))
    return { error }
  }, [])

  const addActionType = useCallback(async (actionType: { name: string; active: boolean }) => {
    const { data, error } = await createActionType(actionType)
    if (!error && data) setActionTypes((prev) => [...prev, data])
    return { error }
  }, [])

  const updateActionType = useCallback(async (id: string, updates: Partial<ActionType>) => {
    const { data, error } = await updateActionType(id, updates)
    if (!error && data) setActionTypes((prev) => prev.map((a) => (a.id === id ? data : a)))
    return { error }
  }, [])

  const deleteActionType = useCallback(async (id: string) => {
    const { error } = await deleteActionType(id)
    if (!error) setActionTypes((prev) => prev.filter((a) => a.id !== id))
    return { error }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const setFilter = (newFilter: Partial<FilterContext>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }))
  }

  return (
    <AppContext.Provider
      value={{
        contracts,
        contractsLoading,
        consultants,
        consultantsLoading,
        actionTypes,
        actionTypesLoading,
        settings,
        filter,
        initApp,
        fetchConsultants,
        fetchContracts: fetchContractsAction,
        fetchActionTypes: fetchActionTypesAction,
        addContract,
        updateContract: updateContractRow,
        deleteContract: deleteContractRow,
        addConsultant,
        updateConsultant,
        deleteConsultant,
        addActionType,
        updateActionType,
        deleteActionType,
        updateSettings,
        setFilter,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}
