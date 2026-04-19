import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { WorkflowEdgeData } from '../types/workflow';

export function WorkflowEdge({
  data,
  id,
  markerEnd,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const edgeData = data as WorkflowEdgeData | undefined;
  const label = edgeData?.label;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className={['edge-label-pill', `edge-label-pill--${edgeData?.condition ?? 'standard'}`].join(' ')}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
