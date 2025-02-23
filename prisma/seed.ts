import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 清理现有数据
  await prisma.record.deleteMany()
  await prisma.subProject.deleteMany()
  await prisma.project.deleteMany()
  await prisma.fundType.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.auditLog.deleteMany()

  // 创建机构
  const org1 = await prisma.organization.create({
    data: {
      name: '总公司',
      code: 'HQ001',
    },
  })

  const org2 = await prisma.organization.create({
    data: {
      name: '分公司A',
      code: 'BR001',
    },
  })

  // 创建部门
  const dept1 = await prisma.department.create({
    data: {
      name: '技术部',
      organizationId: org1.id,
    },
  })

  const dept2 = await prisma.department.create({
    data: {
      name: '财务部',
      organizationId: org1.id,
    },
  })

  const dept3 = await prisma.department.create({
    data: {
      name: '运营部',
      organizationId: org2.id,
    },
  })

  // 创建用户
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.create({
    data: {
      name: '系统管理员',
      email: 'admin@example.com',
      password: adminPassword,
      role: Role.ADMIN,
      organizationId: org1.id,
    },
  })

  const reporter = await prisma.user.create({
    data: {
      name: '张三',
      email: 'reporter@example.com',
      password: userPassword,
      role: Role.REPORTER,
      organizationId: org1.id,
    },
  })

  const finance = await prisma.user.create({
    data: {
      name: '李四',
      email: 'finance@example.com',
      password: userPassword,
      role: Role.FINANCE,
      organizationId: org1.id,
    },
  })

  const auditor = await prisma.user.create({
    data: {
      name: '王五',
      email: 'auditor@example.com',
      password: userPassword,
      role: Role.AUDITOR,
      organizationId: org2.id,
    },
  })

  // 创建资金类型
  const fundType1 = await prisma.fundType.create({
    data: {
      name: '设备采购',
    },
  })

  const fundType2 = await prisma.fundType.create({
    data: {
      name: '人工费用',
    },
  })

  // 创建项目
  const project1 = await prisma.project.create({
    data: {
      name: '2024年度技术升级项目',
      status: 'active',
      startYear: 2024,
      organizations: {
        connect: [{ id: org1.id }],
      },
      departments: {
        connect: [{ id: dept1.id }],
      },
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: '2024年度运营改善项目',
      status: 'active',
      startYear: 2024,
      organizations: {
        connect: [{ id: org2.id }],
      },
      departments: {
        connect: [{ id: dept3.id }],
      },
    },
  })

  // 创建子项目
  const subProject1 = await prisma.subProject.create({
    data: {
      name: '服务器更新',
      projectId: project1.id,
      fundTypes: {
        connect: [{ id: fundType1.id }],
      },
    },
  })

  const subProject2 = await prisma.subProject.create({
    data: {
      name: '软件开发',
      projectId: project1.id,
      fundTypes: {
        connect: [{ id: fundType2.id }],
      },
    },
  })

  // 创建记录
  await prisma.record.create({
    data: {
      subProjectId: subProject1.id,
      year: 2024,
      month: 1,
      predicted: 100000,
      actualUser: 98000,
      actualFinance: 98000,
      auditResult: 98000,
      status: 'approved',
      submittedBy: reporter.id,
      submittedAt: new Date('2024-01-15'),
    },
  })

  await prisma.record.create({
    data: {
      subProjectId: subProject2.id,
      year: 2024,
      month: 1,
      predicted: 50000,
      actualUser: 48000,
      status: 'submitted',
      submittedBy: reporter.id,
      submittedAt: new Date('2024-01-15'),
    },
  })

  console.log('数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 