import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return NextResponse.json({ 
    message: "测试API路由正常工作"
  });
}

export async function GET(req: Request) {
  return NextResponse.json({ 
    message: "测试API路由正常工作" 
  });
} 