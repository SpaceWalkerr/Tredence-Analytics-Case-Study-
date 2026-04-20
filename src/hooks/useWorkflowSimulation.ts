import { useCallback, useState } from 'react';
import { simulateWorkflow } from '../api/mockWorkflowApi';
import type { ApprovalOutcome, SimulationRequest, SimulationResult } from '../types/workflow';

export function useWorkflowSimulation() {
  const [approvalOutcome, setApprovalOutcome] = useState<ApprovalOutcome>('approved');
  const [simulation, setSimulation] = useState<SimulationResult>();
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = useCallback(async (request: SimulationRequest) => {
    setIsRunning(true);
    try {
      const result = await simulateWorkflow(request);
      setSimulation(result);
      return result;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const resetSimulation = useCallback(() => {
    setSimulation(undefined);
  }, []);

  return {
    approvalOutcome,
    isRunning,
    resetSimulation,
    runSimulation,
    setApprovalOutcome,
    simulation,
  };
}
