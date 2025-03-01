import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

// 使用常量对象而不是枚举来定义 RecordStatus
const RecordStatus = {
  DRAFT: 'DRAFT',
  UNFILLED: 'UNFILLED',
  SUBMITTED: 'SUBMITTED',
  PENDING_WITHDRAWAL: 'PENDING_WITHDRAWAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

const prisma = new PrismaClient()

async function main() {
  console.log('开始生成种子数据...')

  // 清理现有数据
  await cleanDatabase()

  // 创建用户
  const adminUser = await createAdminUser()
  const reporterUsers = await createReporterUsers(5)
  const financeUsers = await createFinanceUsers(3)
  const auditorUsers = await createAuditorUsers(2)

  // 创建机构
  const organizations = await createOrganizations(3)

  // 创建部门
  const departments = await createDepartments(organizations)

  // 创建项目分类
  const categories = await createProjectCategories(organizations)

  // 创建项目
  const projects = await createProjects(organizations, departments, categories)

  // 创建子项目
  const subProjects = await createSubProjects(projects)

  // 创建资金类型
  const fundTypes = await createFundTypes()

  // 关联子项目和资金类型
  await linkSubProjectsToFundTypes(subProjects, fundTypes)

  // 创建预测记录
  await createPredictRecords(subProjects, reporterUsers)

  console.log('种子数据生成完成！')
}

// 清理数据库
async function cleanDatabase() {
  console.log('清理现有数据...')
  
  // 按照依赖关系顺序删除数据
  await prisma.withdrawalRequest.deleteMany({})
  await prisma.recordAudit.deleteMany({})
  await prisma.auditLog.deleteMany({})
  await prisma.predictRecord.deleteMany({})
  await prisma.actualUserRecord.deleteMany({})
  await prisma.actualFinRecord.deleteMany({})
  await prisma.auditRecord.deleteMany({})
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`
  await prisma.userOrganization.deleteMany({})
  await prisma.subProject.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.projectCategory.deleteMany({})
  await prisma.department.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.organization.deleteMany({})
  await prisma.fundType.deleteMany({})
  await prisma.$executeRaw`PRAGMA foreign_keys = ON;`
  
  console.log('数据清理完成')
}

// 创建管理员用户
async function createAdminUser() {
  console.log('创建管理员用户...')
  
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.create({
    data: {
      name: '系统管理员',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      active: true
    }
  })
  
  console.log(`创建管理员用户: ${admin.name}`)
  return admin
}

// 创建填报人用户
async function createReporterUsers(count: number) {
  console.log('创建填报人用户...')
  
  const users = []
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  for (let i = 1; i <= count; i++) {
    const user = await prisma.user.create({
      data: {
        name: `填报人${i}`,
        email: `reporter${i}@example.com`,
        password: hashedPassword,
        role: 'REPORTER',
        active: true
      }
    })
    
    users.push(user)
    console.log(`创建填报人用户: ${user.name}`)
  }
  
  return users
}

// 创建财务用户
async function createFinanceUsers(count: number) {
  console.log('创建财务用户...')
  
  const users = []
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  for (let i = 1; i <= count; i++) {
    const user = await prisma.user.create({
      data: {
        name: `财务${i}`,
        email: `finance${i}@example.com`,
        password: hashedPassword,
        role: 'FINANCE',
        active: true
      }
    })
    
    users.push(user)
    console.log(`创建财务用户: ${user.name}`)
  }
  
  return users
}

// 创建审核用户
async function createAuditorUsers(count: number) {
  console.log('创建审核用户...')
  
  const users = []
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  for (let i = 1; i <= count; i++) {
    const user = await prisma.user.create({
      data: {
        name: `审核员${i}`,
        email: `auditor${i}@example.com`,
        password: hashedPassword,
        role: 'AUDITOR',
        active: true
      }
    })
    
    users.push(user)
    console.log(`创建审核用户: ${user.name}`)
  }
  
  return users
}

// 创建机构
async function createOrganizations(count: number) {
  console.log('创建机构...')
  
  const organizations = []
  
  const orgNames = ['市政府', '市财政局', '市发改委']
  const orgCodes = ['GOV', 'FIN', 'DEV']
  
  for (let i = 0; i < count; i++) {
    const organization = await prisma.organization.create({
      data: {
        name: orgNames[i],
        code: orgCodes[i]
      }
    })
    
    organizations.push(organization)
    console.log(`创建机构: ${organization.name}`)
  }
  
  return organizations
}

// 创建部门
async function createDepartments(organizations: any[]) {
  console.log('创建部门...')
  
  const departments = []
  
  // 为每个机构创建2-3个部门
  for (const org of organizations) {
    const deptCount = Math.floor(Math.random() * 2) + 2 // 2-3个部门
    
    for (let i = 1; i <= deptCount; i++) {
      const department = await prisma.department.create({
        data: {
          name: `${org.name}部门${i}`,
          organizationId: org.id
        }
      })
      
      departments.push(department)
      console.log(`创建部门: ${department.name}`)
    }
  }
  
  return departments
}

// 创建项目分类
async function createProjectCategories(organizations: any[]) {
  console.log('创建项目分类...')
  
  const categories = []
  
  const categoryNames = [
    '基础设施建设', '民生工程', '科技创新', 
    '文化教育', '环境保护', '产业发展',
    '城市更新', '乡村振兴', '交通建设'
  ]
  
  // 为每个机构创建3个分类
  for (const org of organizations) {
    for (let i = 0; i < 3; i++) {
      const categoryIndex = organizations.indexOf(org) * 3 + i
      const category = await prisma.projectCategory.create({
        data: {
          name: categoryNames[categoryIndex],
          code: `CAT${categoryIndex + 1}`,
          organizationId: org.id
        }
      })
      
      categories.push(category)
      console.log(`创建项目分类: ${category.name}`)
    }
  }
  
  return categories
}

// 创建项目
async function createProjects(organizations: any[], departments: any[], categories: any[]) {
  console.log('创建项目...')
  
  const projects = []
  const projectNames = [
    '城市道路改造', '污水处理厂', '智慧城市', '公共交通',
    '保障性住房', '城市绿化', '文化中心', '科技园区',
    '农村基础设施', '教育信息化', '医疗设备更新', '产业园区',
    '旅游景区开发', '老旧小区改造', '垃圾处理厂', '新能源',
    '水利工程', '农业科技', '体育场馆', '社区服务中心'
  ]
  
  // 为每个分类创建1-2个项目
  for (const category of categories) {
    const projectCount = Math.floor(Math.random() * 2) + 1 // 1-2个项目
    
    for (let i = 0; i < projectCount; i++) {
      const projectIndex = categories.indexOf(category) * 2 + i
      const projectName = projectNames[projectIndex % projectNames.length]
      
      // 找到同一机构的部门
      const orgDepartments = departments.filter(
        dept => dept.organizationId === category.organizationId
      )
      
      // 随机选择1-2个部门
      const deptCount = Math.floor(Math.random() * 2) + 1
      const selectedDepts = []
      
      for (let j = 0; j < deptCount; j++) {
        if (orgDepartments.length > 0) {
          const randomIndex = Math.floor(Math.random() * orgDepartments.length)
          selectedDepts.push({ id: orgDepartments[randomIndex].id })
        }
      }
      
      const project = await prisma.project.create({
        data: {
          name: `${projectName}${projectIndex + 1}`,
          status: 'ACTIVE',
          startYear: 2023,
          hasRecords: false,
          organizationId: category.organizationId,
          categoryId: category.id,
          code: `PRJ${projectIndex + 1}`,
          departments: {
            connect: selectedDepts
          }
        }
      })
      
      projects.push(project)
      console.log(`创建项目: ${project.name}`)
    }
  }
  
  return projects
}

// 创建子项目
async function createSubProjects(projects: any[]) {
  console.log('创建子项目...')
  
  const subProjects = []
  
  // 为每个项目创建2-3个子项目
  for (const project of projects) {
    const subProjectCount = Math.floor(Math.random() * 2) + 2 // 2-3个子项目
    
    for (let i = 1; i <= subProjectCount; i++) {
      const subProject = await prisma.subProject.create({
        data: {
          name: `${project.name}子项目${i}`,
          projectId: project.id
        }
      })
      
      subProjects.push(subProject)
      console.log(`创建子项目: ${subProject.name}`)
    }
  }
  
  return subProjects
}

// 创建资金类型
async function createFundTypes() {
  console.log('创建资金类型...')
  
  const fundTypeNames = ['设备采购', '工程款', '材料费', '人工费', '咨询费', '管理费']
  const fundTypes = []
  
  for (const name of fundTypeNames) {
    const fundType = await prisma.fundType.create({
      data: {
        name
      }
    })
    
    fundTypes.push(fundType)
    console.log(`创建资金类型: ${fundType.name}`)
  }
  
  return fundTypes
}

// 关联子项目和资金类型
async function linkSubProjectsToFundTypes(subProjects: any[], fundTypes: any[]) {
  console.log('关联子项目和资金类型...')
  
  for (const subProject of subProjects) {
    // 为每个子项目随机选择2-3个资金类型
    const typeCount = Math.floor(Math.random() * 2) + 2 // 2-3个资金类型
    const selectedTypes = []
    const usedIndexes = new Set()
    
    for (let i = 0; i < typeCount; i++) {
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * fundTypes.length)
      } while (usedIndexes.has(randomIndex))
      
      usedIndexes.add(randomIndex)
      selectedTypes.push({ id: fundTypes[randomIndex].id })
    }
    
    await prisma.subProject.update({
      where: { id: subProject.id },
      data: {
        fundTypes: {
          connect: selectedTypes
        }
      }
    })
    
    console.log(`关联子项目 ${subProject.name} 与 ${selectedTypes.length} 个资金类型`)
  }
}

// 创建预测记录
async function createPredictRecords(subProjects: any[], users: any[]) {
  console.log('创建预测记录...')
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // 获取所有子项目
  for (const subProject of subProjects) {
    // 获取子项目关联的资金类型
    const subProjectWithFundTypes = await prisma.subProject.findUnique({
      where: { id: subProject.id },
      include: { fundTypes: true }
    })
    
    const fundTypes = subProjectWithFundTypes?.fundTypes || []
    
    if (fundTypes.length === 0) {
      console.log(`警告: 子项目 ${subProject.name} 没有关联的资金类型，跳过创建记录`)
      continue
    }
    
    // 创建过去3个月的记录
    for (let i = 1; i <= 3; i++) {
      let month = currentMonth - i
      let year = currentYear
      
      if (month <= 0) {
        month = 12 + month
        year--
      }
      
      // 随机选择一个用户
      const randomUser = users[Math.floor(Math.random() * users.length)]
      
      // 为每个资金类型创建一条记录
      for (const fundType of fundTypes) {
        try {
          // 检查记录是否已存在
          const existingRecord = await (prisma as any).predictRecord.findFirst({
            where: {
              subProjectId: subProject.id,
              fundTypeId: fundType.id,
              year: year,
              month: month
            }
          });
          
          if (!existingRecord) {
            // 创建新记录
            await (prisma as any).predictRecord.create({
              data: {
                subProjectId: subProject.id,
                fundTypeId: fundType.id,
                year: year,
                month: month,
                amount: Math.floor(Math.random() * 1000000) / 100,
                status: RecordStatus.DRAFT,
                remark: `${subProject.name} ${fundType.name} ${year}年${month}月预测`,
                submittedBy: randomUser.id,
                submittedAt: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1)
              }
            });
            console.log(`创建预测记录: ${subProject.name} ${fundType.name} ${year}年${month}月`);
          } else {
            console.log(`跳过重复记录: ${subProject.name} ${fundType.name} ${year}年${month}月`);
          }
        } catch (error) {
          console.error(`创建记录失败: ${subProject.name} ${fundType.name} ${year}年${month}月`, error);
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 