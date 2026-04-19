import { useEffect, useState } from 'react';
import { getAutomations } from '../api/mockWorkflowApi';
import type { AutomationDefinition } from '../types/workflow';

export function useAutomations() {
  const [automations, setAutomations] = useState<AutomationDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAutomations().then((items) => {
      if (!mounted) return;
      setAutomations(items);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { automations, loading };
}
