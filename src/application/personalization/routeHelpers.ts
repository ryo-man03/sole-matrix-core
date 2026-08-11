import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../infrastructure/auth/supabase/server";
import { validateMutationRequest } from "../http/requestSecurity";
export async function privateUser(){return (await getAuthenticatedUser()).user;}
export function guard(request:Request,key:string){return validateMutationRequest(request,{key,limit:30});}
export function failure(error:unknown){const code=error instanceof Error?error.message:"REQUEST_FAILED";return NextResponse.json({ok:false,error:{code}},{status:code==="NOT_FOUND"?404:400});}
export function unauthenticated(){return NextResponse.json({ok:false,error:{code:"UNAUTHENTICATED"}},{status:401});}
export function validUuid(value:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}
