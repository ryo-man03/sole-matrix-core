import "server-only";import { timingSafeEqual } from "node:crypto";
export function authorizeInternalJob(request:Request){const expected=process.env.INTERNAL_DAILY_PICK_JOB_SECRET;const header=request.headers.get("x-sole-matrix-job-secret");if(!expected||!header)return false;const a=Buffer.from(expected),b=Buffer.from(header);return a.length===b.length&&timingSafeEqual(a,b)}
