import useAppStore from '@/stores/useAppStore'
import type { Contract } from '@/lib/types'
import type { ContractAdjustmentFormValues } from '@/pages/equipe/ContractAdjustmentForm'

// Shared add/edit/remove routing for the manual contract_adjustments overlay
// (see fetchContracts in services/contracts.ts) — used by both the
// per-consultant "Ver contratos" dialog and the standalone Contratos page.
// A contract row backed by an 'add' adjustment is manual end-to-end, so
// editing/removing it acts on that adjustment directly; any other row is
// live CRM data, so editing creates/updates an 'edit' override and removing
// creates a 'remove' override, both keyed by the contract's id (its
// processo_id).
export function useContractRowActions() {
  const { contractAdjustments, addContractAdjustment, updateContractAdjustment, deleteContractAdjustment } =
    useAppStore()

  const isManualContract = (contract: Contract) =>
    contractAdjustments.some((a) => a.action === 'add' && a.id === contract.id)

  const findEditAdjustment = (contract: Contract) =>
    contractAdjustments.find((a) => a.action === 'edit' && a.target_processo_id === contract.id)

  const saveAdd = (values: ContractAdjustmentFormValues, fallbackClosedBy: string) =>
    addContractAdjustment({ ...values, action: 'add', closed_by: values.closed_by || fallbackClosedBy })

  const saveEdit = (contract: Contract, values: ContractAdjustmentFormValues, fallbackClosedBy: string) => {
    const closedBy = values.closed_by || fallbackClosedBy
    if (isManualContract(contract)) {
      return updateContractAdjustment(contract.id, { ...values, closed_by: closedBy })
    }
    const existing = findEditAdjustment(contract)
    if (existing) {
      return updateContractAdjustment(existing.id, { ...values, closed_by: closedBy })
    }
    return addContractAdjustment({ ...values, action: 'edit', target_processo_id: contract.id, closed_by: closedBy })
  }

  const removeContract = (contract: Contract, fallbackClosedBy: string) => {
    if (isManualContract(contract)) {
      return deleteContractAdjustment(contract.id)
    }
    return addContractAdjustment({ action: 'remove', target_processo_id: contract.id, closed_by: fallbackClosedBy })
  }

  return { isManualContract, saveAdd, saveEdit, removeContract }
}
