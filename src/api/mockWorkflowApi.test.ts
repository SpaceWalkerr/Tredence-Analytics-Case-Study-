import { describe, expect, it } from 'vitest';
import { defaultWorkflowTemplate } from '../data/workflowTemplates';
import { getAutomations, MOCK_API_ENDPOINTS, simulateWorkflow } from './mockWorkflowApi';

describe('mockWorkflowApi', () => {
  it('supports GET /automations with dynamic action params', async () => {
    const automations = await getAutomations();

    expect(MOCK_API_ENDPOINTS.automations).toBe('GET /automations');
    expect(automations).toEqual(
      expect.arrayContaining([
        { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
        { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
      ]),
    );
  });

  it('supports POST /simulate with a step-by-step execution result', async () => {
    const result = await simulateWorkflow({
      nodes: defaultWorkflowTemplate.nodes,
      edges: defaultWorkflowTemplate.edges,
      workflowName: defaultWorkflowTemplate.name,
      approvalOutcome: 'approved',
    });

    expect(MOCK_API_ENDPOINTS.simulate).toBe('POST /simulate');
    expect(result.ok).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0]).toEqual(
      expect.objectContaining({
        nodeId: expect.any(String),
        nodeType: expect.any(String),
        title: expect.any(String),
        status: expect.any(String),
        detail: expect.any(String),
      }),
    );
    expect(result.summary?.totalSteps).toBe(result.steps.length);
  });
});
