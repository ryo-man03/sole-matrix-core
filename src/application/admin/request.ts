import { randomUUID } from "node:crypto";

export function adminRequestId(request: Request): string {
  const value = request.headers.get("x-request-id");
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
    ? value : randomUUID();
}
