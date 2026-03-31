export interface DiscoveryMethod {
  httpMethod?: string;
  path?: string;
}

export interface DiscoveryResource {
  methods?: Record<string, DiscoveryMethod>;
  resources?: Record<string, DiscoveryResource>;
}

export interface DiscoveryDocument {
  resources?: Record<string, DiscoveryResource>;
}

export interface OperationBaseline {
  operationId: string;
  httpMethod: string;
  path: string;
}

function walkResources(
  segments: string[],
  resource: DiscoveryResource,
  output: OperationBaseline[]
): void {
  for (const [methodName, method] of Object.entries(resource.methods ?? {})) {
    output.push({
      operationId: [...segments, methodName].join('.'),
      httpMethod: method.httpMethod ?? 'GET',
      path: method.path ?? ''
    });
  }

  for (const [resourceName, childResource] of Object.entries(resource.resources ?? {})) {
    walkResources([...segments, resourceName], childResource, output);
  }
}

export function collectOperationBaselines(
  discovery: DiscoveryDocument
): OperationBaseline[] {
  const output: OperationBaseline[] = [];

  for (const [resourceName, resource] of Object.entries(discovery.resources ?? {})) {
    walkResources([resourceName], resource, output);
  }

  return output.sort((left, right) => left.operationId.localeCompare(right.operationId));
}
