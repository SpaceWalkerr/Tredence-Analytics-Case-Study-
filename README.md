# HR Workflow Designer

This is a small web app where an HR admin can build a workflow by dragging boxes onto a canvas and connecting them with lines.

Think of it like making a flowchart:

```text
Start -> Collect Documents -> Manager Approval -> Send Email -> End
```

The app is built with **React**, **TypeScript**, **Vite**, and **React Flow**.

## What You Can Do

- Drag workflow steps from the left sidebar onto the canvas.
- Connect steps with arrows.
- Click a step to edit its details on the right side.
- Test the workflow in the sandbox panel.
- See validation errors if the workflow is broken.
- Export the workflow as JSON.
- Import a saved workflow JSON file.
- Use undo, redo, zoom controls, mini-map, and auto-layout.

## Node Types

The app has 5 kinds of workflow steps:

| Node | What It Means |
| --- | --- |
| Start | Where the workflow begins |
| Task | A human task, like collecting documents |
| Approval | Someone approves something, like a manager |
| Automated Step | The system does something, like sending an email |
| End | Where the workflow finishes |

## How To Run This Project

First, make sure Node.js is installed on your computer.

Then open this folder in a terminal and run:

```bash
npm install
```

This downloads the project packages.

After that, run:

```bash
npm run dev
```

You will see a local website link, usually:

```text
http://127.0.0.1:5173/
```

Open that link in your browser.

## How To Build The Project

To check that the project is ready for production, run:

```bash
npm run build
```

If it finishes without errors, the project builds correctly.

## How To Use The App

1. Look at the left sidebar.
2. Drag a node, like `Task`, onto the canvas.
3. Connect nodes by dragging from one small dot to another small dot.
4. Click any node to open its edit form.
5. Change the title, assignee, approval role, automation action, or other fields.
6. Click `Test Workflow` to open the sandbox.
7. Run the simulation to see the workflow step-by-step.

## What The Sandbox Does

The sandbox checks the workflow and then pretends to run it.

It shows:

- The full workflow JSON.
- Validation problems, if something is missing.
- A step-by-step execution log if the workflow is valid.

Example problems it can catch:

- There is no Start node.
- There is no End node.
- A node is not connected.
- The workflow has a cycle.
- A required Task title is missing.

## Folder Guide

Here is what the main folders mean:

```text
src/
  api/          fake API calls live here
  components/   React UI pieces live here
  data/         starter workflow and node templates live here
  hooks/        reusable React logic lives here
  types/        TypeScript types live here
  utils/        validation logic lives here
```

## Important Files

| File | What It Does |
| --- | --- |
| `src/App.tsx` | Main app logic and React Flow canvas |
| `src/components/NodeFormPanel.tsx` | The form shown when you click a node |
| `src/components/WorkflowNodeCard.tsx` | The custom node design on the canvas |
| `src/api/mockWorkflowApi.ts` | Fake API for automations and simulation |
| `src/utils/validation.ts` | Checks if the workflow is valid |
| `src/data/nodeTemplates.ts` | Defines the available node templates |
| `src/types/workflow.ts` | TypeScript shapes for nodes, edges, and API data |

## Mock API

There is no real backend server. The app uses fake API functions so the prototype works by itself.

The fake API supports:

```text
GET /automations
```

This gives automation options like:

```json
[
  { "id": "send_email", "label": "Send Email", "params": ["to", "subject"] },
  { "id": "generate_doc", "label": "Generate Document", "params": ["template", "recipient"] }
]
```

And:

```text
POST /simulate
```

This accepts the workflow JSON and returns a fake execution result.

## Design Choices

- React Flow is used because it is good for draggable node-based editors.
- TypeScript is used so node data is easier to understand and safer to change.
- Node forms are separate from canvas nodes so the code stays clean.
- The mock API is local because this prototype does not need a backend.
- Validation is kept in one file so workflow rules are easy to find.

## Project Status

This is a working prototype for the HR Workflow Designer case study.

It is ready to run locally, review, and publish on GitHub.
