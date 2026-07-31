import { NextRequest,NextResponse } from "next/server";
import { valueAnalyzeSchema } from "@/lib/validation";
import { discoverNumericValues } from "@/lib/value-monitor";
import { apiError } from "@/lib/api";

const attempts=new Map<string,number[]>();
export async function POST(request:NextRequest){try{const key=request.headers.get("x-forwarded-for")??"local";const now=Date.now();const recent=(attempts.get(key)??[]).filter((value)=>now-value<60_000);if(recent.length>=10)return apiError(new Error("Analysis rate limit reached. Try again shortly."),429);attempts.set(key,[...recent,now]);const {url}=valueAnalyzeSchema.parse(await request.json());const candidates=await discoverNumericValues(url);return NextResponse.json({success:true,candidates});}catch(error){return apiError(error);}}
