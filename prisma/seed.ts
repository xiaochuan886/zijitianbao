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
  try {
    // 清空数据库
    await cleanDatabase()
    
    // 创建管理员用户
    const adminUser = await createAdminUser()
    
    // 创建填报用户
    const reporterUsers = await createReporterUsers(5)
    
    // 创建财务用户
    const financeUsers = await createFinanceUsers(3)
    
    // 创建审计用户
    const auditorUsers = await createAuditorUsers(2)
    
    // 创建组织
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
    
    // 创建DetailedFundNeed关联
    const detailedFundNeeds = await linkSubProjectsToFundTypes(subProjects, fundTypes, departments)
    
    // 创建预测记录
    await createPredictRecords(subProjects, reporterUsers, detailedFundNeeds)
    
    console.log('种子数据生成完成！')
  } catch (error) {
    console.error('种子数据生成失败:', error)
    process.exit(1)
  }
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
  
  // 创建不关联机构的分类
  for (let i = 0; i < categoryNames.length; i++) {
    try {
      const category = await prisma.projectCategory.create({
        data: {
          name: categoryNames[i],
          code: `CAT${i + 1}`
        }
      })
      
      categories.push(category)
      console.log(`创建项目分类: ${category.name}`)
    } catch (error) {
      console.error(`创建分类 ${categoryNames[i]} 失败:`, error)
    }
  }
  
  return categories
}

// 创建项目
async function createProjects(organizations: any[], departments: any[], categories: any[]) {
  console.log('创建项目...')
  
  const projects = []
  
  // 为每个组织创建2-3个项目
  for (const org of organizations) {
    const projectCount = Math.floor(Math.random() * 2) + 2 // 2-3个项目
    
    // 获取该组织的部门
    const orgDepartments = departments.filter(d => d.organizationId === org.id)
    
    // 随机选择项目分类
    for (let projectIndex = 0; projectIndex < projectCount; projectIndex++) {
      // 随机选择一个分类
      const category = categories[Math.floor(Math.random() * categories.length)]
      
      // 随机选择1-2个部门
      const deptCount = Math.floor(Math.random() * 2) + 1 // 1-2个部门
      const selectedDepts = []
      const usedIndexes = new Set()
      
      for (let i = 0; i < deptCount && i < orgDepartments.length; i++) {
        let randomIndex
        do {
          randomIndex = Math.floor(Math.random() * orgDepartments.length)
        } while (usedIndexes.has(randomIndex))
        
        usedIndexes.add(randomIndex)
        selectedDepts.push({ id: orgDepartments[randomIndex].id })
      }
      
      const project = await prisma.project.create({
        data: {
          name: `${org.name}项目${projectIndex + 1}`,
          status: 'ACTIVE',
          startYear: 2023,
          hasRecords: false,
          categoryId: category.id,
          code: `PRJ${projectIndex + 1}`
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
async function linkSubProjectsToFundTypes(subProjects: any[], fundTypes: any[], departments: any[]) {
  console.log('创建DetailedFundNeed关联...')
  
  const detailedFundNeeds = []
  
  for (const subProject of subProjects) {
    // 获取项目信息
    const projectInfo = await prisma.project.findUnique({
      where: { id: subProject.projectId },
      select: { id: true, categoryId: true }
    })
    
    if (!projectInfo) {
      console.log(`警告: 找不到子项目 ${subProject.name} 的项目信息，跳过创建关联`)
      continue
    }
    
    // 随机选择一个组织
    const allOrganizations = await prisma.organization.findMany();
    if (allOrganizations.length === 0) {
      console.log(`警告: 没有组织数据，跳过创建关联`);
      continue;
    }
    
    // 随机选择一个组织
    const randomOrg = allOrganizations[Math.floor(Math.random() * allOrganizations.length)];
    
    const orgDepartments = departments.filter(d => d.organizationId === randomOrg.id);
    if (orgDepartments.length === 0) {
      console.log(`警告: 组织 ${randomOrg.id} 没有部门，跳过创建关联`);
      continue;
    }
    
    // 为每个子项目随机选择2-3个资金类型
    const typeCount = Math.floor(Math.random() * 2) + 2 // 2-3个资金类型
    const usedTypeIndexes = new Set()
    
    for (let i = 0; i < typeCount && i < fundTypes.length; i++) {
      let randomTypeIndex
      do {
        randomTypeIndex = Math.floor(Math.random() * fundTypes.length)
      } while (usedTypeIndexes.has(randomTypeIndex))
      
      usedTypeIndexes.add(randomTypeIndex)
      const fundType = fundTypes[randomTypeIndex]
      
      // 随机选择1-2个部门
      const deptCount = Math.floor(Math.random() * 2) + 1 // 1-2个部门
      const usedDeptIndexes = new Set()
      
      for (let j = 0; j < deptCount && j < orgDepartments.length; j++) {
        let randomDeptIndex
        do {
          randomDeptIndex = Math.floor(Math.random() * orgDepartments.length)
        } while (usedDeptIndexes.has(randomDeptIndex))
        
        usedDeptIndexes.add(randomDeptIndex)
        const department = orgDepartments[randomDeptIndex]
        
        // 创建DetailedFundNeed记录
        const detailedFundNeed = await prisma.detailedFundNeed.create({
          data: {
            subProjectId: subProject.id,
            departmentId: department.id,
            fundTypeId: fundType.id,
            organizationId: randomOrg.id,
            isActive: true
          }
        })
        
        detailedFundNeeds.push(detailedFundNeed)
        console.log(`创建资金需求明细: 子项目 ${subProject.name} - 部门 ${department.name} - 资金类型 ${fundType.name}`)
      }
    }
  }
  
  return detailedFundNeeds
}

// 创建预测记录
async function createPredictRecords(subProjects: any[], users: any[], detailedFundNeeds: any[]) {
  console.log('创建预测记录...')
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // 使用DetailedFundNeed记录创建预测记录
  for (const detailedFundNeed of detailedFundNeeds) {
    // 创建过去3个月的记录
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      let month = currentMonth - monthOffset
      let year = currentYear
      
      if (month <= 0) {
        month += 12
        year -= 1
      }
      
      // 随机选择一个用户
      const user = users[Math.floor(Math.random() * users.length)]
      
      try {
        await prisma.predictRecord.create({
          data: {
            detailedFundNeedId: detailedFundNeed.id,
            subProjectId: detailedFundNeed.subProjectId,
            fundTypeId: detailedFundNeed.fundTypeId,
            departmentId: detailedFundNeed.departmentId,
            year,
            month,
            amount: Math.floor(Math.random() * 1000000) / 100, // 随机金额
            status: 'SUBMITTED',
            remark: `${year}年${month}月预测`,
            submittedBy: user.id,
            submittedAt: new Date()
          }
        })
        
        console.log(`创建预测记录: ${year}年${month}月 - 金额: ${Math.floor(Math.random() * 1000000) / 100}`)
      } catch (error) {
        console.error(`创建预测记录失败:`, error)
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