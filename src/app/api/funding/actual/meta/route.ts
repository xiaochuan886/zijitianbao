import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 获取所有机构
    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // 获取所有部门
    const departments = await db.department.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // 获取当前可填报月份 - 当前月-1往前推3个月
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    const availableMonths = [];
    
    // 当前月-1
    if (currentMonth === 0) {
      availableMonths.push({ year: currentYear - 1, month: 12 });
    } else {
      availableMonths.push({ year: currentYear, month: currentMonth });
    }
    
    // 往前推3个月
    for (let i = 1; i <= 3; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      
      if (month < 0) {
        month += 12;
        year -= 1;
      }
      
      availableMonths.push({ year, month: month + 1 });
    }
    
    return NextResponse.json({
      organizations,
      departments,
      availableMonths
    });
    
  } catch (error) {
    console.error("获取元数据失败", error);
    return NextResponse.json({ 
      error: "获取元数据失败，请稍后重试", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 