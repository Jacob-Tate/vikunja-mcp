type OkResult = { content: [{ type: 'text'; text: string }] };
type FailResult = { content: [{ type: 'text'; text: string }]; isError: true };

export function ok(data: unknown): OkResult {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

export function fail(prefix: string, error: unknown): FailResult {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[${prefix}]`, msg);
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}
