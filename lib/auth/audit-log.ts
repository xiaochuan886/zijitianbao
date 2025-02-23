import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export interface AuditLogData {
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  status: "success" | "failure"
  error?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details ? JSON.stringify(data.details) : null,
        status: data.status,
        error: data.error,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

export async function withAuditLog(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  {
    action,
    resource,
    getResourceId,
  }: {
    action: string
    resource: string
    getResourceId?: (req: NextRequest) => string | undefined
  }
) {
  const userId = req.headers.get("x-user-id")
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const response = await handler()
    
    await createAuditLog({
      userId,
      action,
      resource,
      resourceId: getResourceId?.(req),
      status: "success",
      details: {
        method: req.method,
        url: req.url,
      },
    })

    return response
  } catch (error) {
    await createAuditLog({
      userId,
      action,
      resource,
      resourceId: getResourceId?.(req),
      status: "failure",
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        method: req.method,
        url: req.url,
      },
    })

    throw error
  }
} 