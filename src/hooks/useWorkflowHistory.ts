import { useCallback, useRef, useState } from 'react';
import type { WorkflowEdge, WorkflowNode } from '../types/workflow';

type Snapshot = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export function useWorkflowHistory(initial: Snapshot) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [snapshot, setSnapshot] = useState(initial);

  const commit = useCallback((next: Snapshot) => {
    past.current.push(snapshot);
    future.current = [];
    setSnapshot(next);
  }, [snapshot]);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return snapshot;
    future.current.push(snapshot);
    setSnapshot(previous);
    return previous;
  }, [snapshot]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return snapshot;
    past.current.push(snapshot);
    setSnapshot(next);
    return next;
  }, [snapshot]);

  return {
    snapshot,
    commit,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
