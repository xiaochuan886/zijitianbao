import { PrismaClient } from '@prisma/client'
import { Role } from '../src/lib/enums'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 清理现有数据
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.organization.deleteMany()

  console.log('开始创建种子数据...')

  // 创建示例机构
  const org = await prisma.organization.create({
    data: {
      name: '示例机构',
      code: 'ORG001',
      departments: {
        create: [
          { name: '财务部' },
          { name: '技术部' },
          { name: '人力资源部' },
        ],
      },
    },
  })

  console.log('已创建机构:', org.name)

  // 创建不同角色的用户
  const users = await Promise.all([
    // 系统管理员
    prisma.user.create({
      data: {
        name: '系统管理员',
        email: 'admin@example.com',
        password: await hash('admin123', 12),
        role: Role.ADMIN,
      },
    }),
    // 财务人员
    prisma.user.create({
      data: {
        name: '财务主管',
        email: 'finance@example.com',
        password: await hash('finance123', 12),
        role: Role.FINANCE,
        organizationId: org.id,
      },
    }),
    // 填报人
    prisma.user.create({
      data: {
        name: '普通填报员',
        email: 'reporter@example.com',
        password: await hash('reporter123', 12),
        role: Role.REPORTER,
        organizationId: org.id,
      },
    }),
    // 审核人员
    prisma.user.create({
      data: {
        name: '审核专员',
        email: 'auditor@example.com',
        password: await hash('auditor123', 12),
        role: Role.AUDITOR,
        organizationId: org.id,
      },
    }),
    // 观察者
    prisma.user.create({
      data: {
        name: '数据观察员',
        email: 'observer@example.com',
        password: await hash('observer123', 12),
        role: Role.OBSERVER,
        organizationId: org.id,
      },
    }),
  ])

  console.log('已创建用户:')
  users.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - ${user.role}`)
  })

  console.log('种子数据创建完成！')
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 