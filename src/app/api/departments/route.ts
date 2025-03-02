import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";

const prisma = new PrismaClient();

/**
 * GET /api/departments
 * 获取部门列表
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");
    
    // 构建查询条件
    const where = organizationId 
      ? { organizationId } 
      : {};
    
    // 获取部门列表
    const departments = await prisma.department.findMany({
      where,
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
    
    return NextResponse.json(departments);
  } catch (error) {
    console.error("获取部门列表失败:", error);
    
    return NextResponse.json(
      { error: "获取部门列表失败", details: (error as Error).message },
      { status: 500 }
    );
  }
} 