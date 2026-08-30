import { generatePrimarySlitterPlans, OptimizationInput, OptimizationResult } from './deckleOptimizer';

export interface WorkerMessageRequest {
  type: 'RUN_OPTIMIZATION';
  input: OptimizationInput;
  executionId?: string;
}

export interface WorkerMessageResponse {
  type: 'OPTIMIZATION_SUCCESS' | 'OPTIMIZATION_ERROR';
  result?: OptimizationResult;
  error?: string;
  durationMs?: number;
  executionId?: string;
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (event: MessageEvent<WorkerMessageRequest>) => {
    const { type, input, executionId = 'EXEC-' + Math.floor(100000 + Math.random() * 900000) } = event.data;

    if (type === 'RUN_OPTIMIZATION' && input) {
      const tStart = performance.now();
      console.log(`[OPTIMIZER DEBUG] Worker received input | Execution ID: ${executionId} START`);
      console.log(`[OPTIMIZER DEBUG] Input Summary -> Film: [${input.film}] | Target: ${input.target_quantity_kg ?? 'All'} kg | Total Orders In Backlog: ${input.orders.length}`);

      try {
        console.log(`[OPTIMIZER DEBUG] generatePrimarySlitterPlans START | Execution ID: ${executionId}`);
        // Authoritative deckleOptimizer invocation (UNTOUCHED)
        const result = generatePrimarySlitterPlans(input);
        const tEnd = performance.now();
        const durationMs = Math.round((tEnd - tStart) * 100) / 100;

        console.log(`[OPTIMIZER DEBUG] generatePrimarySlitterPlans END | Execution ID: ${executionId} in ${durationMs}ms (Plans: ${result.plans.length}, Planned: ${result.run.planned_quantity_kg} kg)`);
        console.log(`[OPTIMIZER DEBUG] Result prepared`);

        const response: WorkerMessageResponse = {
          type: 'OPTIMIZATION_SUCCESS',
          result,
          durationMs,
          executionId,
        };

        console.log(`[OPTIMIZER DEBUG] Result posted to UI | Execution ID: ${executionId}`);
        self.postMessage(response);
      } catch (err: any) {
        console.error(`[OPTIMIZER DEBUG] ERROR in generatePrimarySlitterPlans | Execution ID: ${executionId}:`, err);
        const response: WorkerMessageResponse = {
          type: 'OPTIMIZATION_ERROR',
          error: err?.message || 'Unknown optimization error occurred in worker thread.',
          executionId,
        };
        self.postMessage(response);
      }
    }
  };
}
