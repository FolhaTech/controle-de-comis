import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Contract, Consultant, Settings, FilterContext, ActionType, ContractAdjustment } from '@/lib/types'
import {
  fetchTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '@/services/team-members'
import { fetchContracts } from '@/services/contracts'
import {
  fetchContractAdjustments,
  createContractAdjustment,
  updateContractAdjustment,
  deleteContractAdjustment,
  type ContractAdjustmentInput,
  type ContractAdjustmentUpdate,
} from '@/services/contract-adjustments'
import { fetchActionTypes, createActionType } from '@/services/action-types'

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
    creditCardBonusPercentage: 1.0,
    cashBonusPercentage: 2.0,
  },
  quarterTiers: [
    { contracts: 105, award: 1250 },
    { contracts: 120, award: 1625 },
    { contracts: 150, award: 2500 },
  ],
  ipca: { year: 2025, value: 4.83, appliedPercentage: 70 },
  attendantCommission: {
    baseAllowance: 2000,
    tiers: [
      { min: 0, max: 9, valuePerContract: 0 },
      { min: 10, max: 35, valuePerContract: 25 },
      { min: 36, max: 49, valuePerContract: 50 },
      { min: 50, max: null, valuePerContract: 60 },
    ],
  },
}

interface AppStoreState {
  contracts: Contract[]
  contractsLoading: boolean
  contractsError: string | null
  contractAdjustments: ContractAdjustment[]
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
  addContractAdjustment: (input: ContractAdjustmentInput) => Promise<{ error: unknown }>
  updateContractAdjustment: (id: string, updates: ContractAdjustmentUpdate) => Promise<{ error: unknown }>
  deleteContractAdjustment: (id: string) => Promise<{ error: unknown }>
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
  const [contractsError, setContractsError] = useState<string | null>(null)
  const [contractAdjustments, setContractAdjustments] = useState<ContractAdjustment[]>([])
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
    setContractsError(null)
    const [{ data, error }, { data: adjustments }] = await Promise.all([
      fetchContracts(),
      fetchContractAdjustments(),
    ])
    if (error) {
      setContractsError('Não foi possível carregar os contratos. Verifique sua conexão.')
    }
    if (!error && data) setContracts(data)
    if (adjustments) setContractAdjustments(adjustments)
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

  // These three mutate the manual add/edit/remove overlay applied on top of
  // the live CRM contracts (see fetchContracts) — after any of them succeed,
  // refetch so the merged contract list picks up the change immediately.
  const addContractAdjustmentAction = useCallback(async (input: ContractAdjustmentInput) => {
    const { error } = await createContractAdjustment(input)
    if (!error) await fetchContractsAction()
    return { error }
  }, [fetchContractsAction])

  const updateContractAdjustmentAction = useCallback(async (id: string, updates: ContractAdjustmentUpdate) => {
    const { error } = await updateContractAdjustment(id, updates)
    if (!error) await fetchContractsAction()
    return { error }
  }, [fetchContractsAction])

  const deleteContractAdjustmentAction = useCallback(async (id: string) => {
    const { error } = await deleteContractAdjustment(id)
    if (!error) await fetchContractsAction()
    return { error }
  }, [fetchContractsAction])

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
        contractsError,
        contractAdjustments,
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
        addContractAdjustment: addContractAdjustmentAction,
        updateContractAdjustment: updateContractAdjustmentAction,
        deleteContractAdjustment: deleteContractAdjustmentAction,
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
