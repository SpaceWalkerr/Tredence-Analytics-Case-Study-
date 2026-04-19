# HR Workflow Designer

A React + React Flow prototype for visually designing, configuring, validating, importing/exporting, and simulating HR workflows such as onboarding, leave approval, and document verification.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## What Is Included

- React 19 + Vite + TypeScript application
- React Flow canvas with custom Start, Task, Approval, Automated Step, and End nodes
- Drag-and-drop node templates from the sidebar
- Configurable node form panel with controlled inputs
- Dynamic automation parameter fields powered by a mock `GET /automations` API
- Mock `POST /simulate` workflow execution
- Workflow validation for missing connections, Start/End constraints, required task titles, and cycles
- Visual validation state on nodes
- Test sandbox panel with serialized graph JSON and execution timeline
- Export/import workflow JSON
- Mini-map, zoom controls, basic auto-layout, undo/redo

## Architecture

```text
src/
  api/                 mock API layer for automations and simulation
  components/          canvas-adjacent UI, forms, panels, custom node card
  data/                node templates and seeded sample workflow
  hooks/               reusable data hooks
  types/               workflow node, edge, API, and simulation types
  utils/               graph validation logic
```

The app keeps workflow state in `App.tsx` as React Flow nodes and edges. Node-specific data is modeled as a discriminated TypeScript union in `src/types/workflow.ts`, which keeps edit forms type-aware and makes adding future node types straightforward.

The form panel is intentionally separated from React Flow nodes. Nodes focus on canvas rendering, while `NodeFormPanel` owns configuration behavior. This makes each area easier to extend independently.

## Mock API Design

The exercise does not require backend persistence, so the mock API is implemented as async local functions in `src/api/mockWorkflowApi.ts`.

- `getAutomations()` represents `GET /automations`
- `simulateWorkflow()` represents `POST /simulate`

Both functions include a small delay to make UI loading and sandbox behavior feel realistic while remaining easy to test and replace with MSW, JSON Server, or a real API later.

## Validation Assumptions

- A valid workflow has exactly one Start node.
- A valid workflow has at least one End node.
- Start nodes cannot have incoming edges.
- Every non-Start node needs an incoming edge.
- Every non-End node needs an outgoing edge.
- Cycles are invalid for the simulation sandbox.
- Task title and automation action are required.

## Design Notes

The UI uses the provided references as inspiration: a light dotted canvas, compact node cards, muted side panels, visible workflow status, and right-side configuration/simulation panels. The implementation prioritizes a working designer over marketing screens or static mockups.
