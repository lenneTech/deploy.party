/**
 * Whether the API serves Swagger UI under `/api` and the OpenAPI document under `/api-json`
 * (`NSC__SWAGGER=true`). Off by default: the document lists every REST route of an instance, and
 * nothing in deploy.party needs it at runtime.
 */
export function isSwaggerEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}
