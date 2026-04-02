import type { OperationBaseline } from './discovery.js';

export interface ShortcutEntry {
  operationId: string;
  commandPath: string[];
  pathParams: string[];
  httpMethod: string;
  path: string;
}

const PATH_PARAM_PATTERN = /\{[+]?([^}]+)\}/g;

function extractPathParams(path: string): string[] {
  const params = new Set<string>();

  for (const match of path.matchAll(PATH_PARAM_PATTERN)) {
    const paramName = match[1];

    if (paramName) {
      params.add(paramName);
    }
  }

  return [...params];
}

function deriveCommandPath(operationId: string): string[] {
  return operationId.split('.').filter(Boolean);
}

export function generateShortcutEntries(
  operations: OperationBaseline[]
): ShortcutEntry[] {
  return [...operations]
    .sort((left, right) => left.operationId.localeCompare(right.operationId))
    .map((operation) => ({
      commandPath: deriveCommandPath(operation.operationId),
      httpMethod: operation.httpMethod,
      operationId: operation.operationId,
      path: operation.path,
      pathParams: extractPathParams(operation.path)
    }));
}
