import { PrismaClient, RecordStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // 清空数据库
    await cleanDatabase();
    
    // 创建管理员用户
    const adminUser = await createAdminUser();
    
    // 创建填报用户
    const reporterUsers = await createReporterUsers(5);
    
    // 创建财务用户
    const financeUsers = await createFinanceUsers(3);
    
    // 创建审计用户
    const auditorUsers = await createAuditorUsers(2);
    
    // 创建组织
    const organizations = await createOrganizations(3);
    
    // 创建部门
    const departments = await createDepartments(organizations);
    
    // 创建项目分类
    const categories = await createProjectCategories();
    
    // 创建项目
    const projects = await createProjects(organizations, categories);
    
    // 创建子项目
    const subProjects = await createSubProjects(projects);
    
    // 创建资金类型
    const fundTypes = await createFundTypes();
    
    // 创建DetailedFundNeed关联
    const detailedFundNeeds = await linkSubProjectsToFundTypes(subProjects, fundTypes, departments);
    
    // 创建预测记录
    await createPredictRecords(detailedFundNeeds, reporterUsers);
    
    // 创建实际记录（用户填报和财务填报）
    await createActualRecords(detailedFundNeeds, reporterUsers, financeUsers, auditorUsers);
    
    // 确保添加撤回配置
    await seedWithdrawalConfigs();
    
    console.log('种子数据生成完成！');
  } catch (error) {
    console.error('种子数据生成失败:', error);
    process.exit(1);
  }
}

// 清理数据库
async function cleanDatabase() {
  console.log('清理现有数据...');
  
  // 按照依赖关系顺序删除数据
  await prisma.notification.deleteMany({});
  await prisma.withdrawalRequest.deleteMany({});
  await prisma.recordAudit.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.predictRecord.deleteMany({});
  await prisma.actualUserRecord.deleteMany({});
  await prisma.actualFinRecord.deleteMany({});
  await prisma.auditRecord.deleteMany({});
  await prisma.detailedFundNeed.deleteMany({});
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;
  await prisma.userOrganization.deleteMany({});
  await prisma.userDepartment.deleteMany({});
  await prisma.subProject.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.projectCategory.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.fundType.deleteMany({});
  await prisma.withdrawalConfig.deleteMany({});
  await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
  
  console.log('数据清理完成');
}

// 创建管理员用户
async function createAdminUser() {
  console.log('创建管理员用户...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: '系统管理员',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      active: true
    }
  });
  
  console.log(`创建管理员用户: ${admin.name}`);
  return admin;
}

// 创建填报人用户
async function createReporterUsers(count: number) {
  console.log('创建填报人用户...');
  
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  for (let i = 1; i <= count; i++) {
    const user = await prisma.user.create({
      data: {
        name: `填报人${i}`,
        email: `reporter${i}@example.com`,
        password: hashedPassword,
        role: 'REPORTER',
        active: true
      }
    });
    
    users.push(user);
    console.log(`创建填报人用户: ${user.name}`);
  }
  
  return users;
}

// 创建财务用户
async function createFinanceUsers(count: number) {
  console.log('创建财务用户...');
  
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  for (let i = 1; i <= count; i++) {
    const user = await prisma.user.create({
      data: {
        name: `财务${i}`,
        email: `finance${i}@example.com`,
        password: hashedPassword,
        role: 'FINANCE',
        active: true
      }
    });
    
    users.push(user);
    console.log(`创建财务用户: ${user.name}`);
  }
  
  return users;
}

// 创建审核用户
async function createAuditorUsers(count: number) {
  console.log('创建审核用户...');
  
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  for (let i = 1; i <= count; i++) {
    const user = await prisma.user.create({
      data: {
        name: `审核员${i}`,
        email: `auditor${i}@example.com`,
        password: hashedPassword,
        role: 'AUDITOR',
        active: true
      }
    });
    
    users.push(user);
    console.log(`创建审核用户: ${user.name}`);
  }
  
  return users;
}

// 创建机构
async function createOrganizations(count: number) {
  console.log('创建机构...');
  
  const organizations = [];
  
  const orgNames = ['市政府', '市财政局', '市发改委', '市教育局', '市卫健委'];
  const orgCodes = ['GOV', 'FIN', 'DEV', 'EDU', 'HEALTH'];
  
  for (let i = 0; i < count; i++) {
    const organization = await prisma.organization.create({
      data: {
        name: orgNames[i],
        code: orgCodes[i]
      }
    });
    
    organizations.push(organization);
    console.log(`创建机构: ${organization.name}`);
  }
  
  return organizations;
}

// 创建部门
async function createDepartments(organizations: any[]) {
  console.log('创建部门...');
  
  const departments = [];
  
  // 为每个机构创建2-3个部门
  for (const org of organizations) {
    const deptCount = Math.floor(Math.random() * 2) + 2; // 2-3个部门
    
    for (let i = 1; i <= deptCount; i++) {
      const department = await prisma.department.create({
        data: {
          name: `${org.name}部门${i}`,
          organizationId: org.id
        }
      });
      
      departments.push(department);
      console.log(`创建部门: ${department.name}`);
    }
  }
  
  return departments;
}

// 创建项目分类
async function createProjectCategories() {
  console.log('创建项目分类...');
  
  const categories = [];
  
  const categoryNames = [
    '基础设施建设', '民生工程', '科技创新', 
    '文化教育', '环境保护', '产业发展',
    '城市更新', '乡村振兴', '交通建设'
  ];
  
  const categoryCodes = [
    'INFRA', 'CIVIL', 'TECH', 
    'EDU', 'ENV', 'INDUSTRY',
    'URBAN', 'RURAL', 'TRANS'
  ];
  
  for (let i = 0; i < categoryNames.length; i++) {
    const category = await prisma.projectCategory.create({
      data: {
        name: categoryNames[i],
        code: categoryCodes[i]
      }
    });
    
    categories.push(category);
    console.log(`创建项目分类: ${category.name}`);
  }
  
  return categories;
}

// 创建项目
async function createProjects(organizations: any[], categories: any[]) {
  console.log('创建项目...');
  
  const projects = [];
  
  // 为每个组织创建1-3个项目
  for (const org of organizations) {
    const projectCount = Math.floor(Math.random() * 3) + 1; // 1-3个项目
    
    for (let i = 1; i <= projectCount; i++) {
      // 随机选择一个分类
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      const project = await prisma.project.create({
        data: {
          name: `${org.name}项目${i}`,
          code: `${org.code}-PRJ${i}`,
          status: 'ACTIVE',
          startYear: 2024 + Math.floor(Math.random() * 2), // 2024或2025
          hasRecords: true,
          categoryId: randomCategory.id
        }
      });
      
      projects.push(project);
      console.log(`创建项目: ${project.name}`);
    }
  }
  
  return projects;
}

// 创建子项目
async function createSubProjects(projects: any[]) {
  console.log('创建子项目...');
  
  const subProjects = [];
  
  // 为每个项目创建1-3个子项目
  for (const project of projects) {
    const subProjectCount = Math.floor(Math.random() * 3) + 1; // 1-3个子项目
    
    for (let i = 1; i <= subProjectCount; i++) {
      const subProject = await prisma.subProject.create({
        data: {
          name: `${project.name}子项目${i}`,
          projectId: project.id
        }
      });
      
      subProjects.push(subProject);
      console.log(`创建子项目: ${subProject.name}`);
    }
  }
  
  return subProjects;
}

// 创建资金类型
async function createFundTypes() {
  console.log('创建资金类型...');
  
  const fundTypes = [];
  
  const typeNames = ['设备采购', '工程款', '材料费', '人工费', '咨询费', '管理费'];
  
  for (const name of typeNames) {
    const fundType = await prisma.fundType.create({
      data: {
        name
      }
    });
    
    fundTypes.push(fundType);
    console.log(`创建资金类型: ${fundType.name}`);
  }
  
  return fundTypes;
}

// 关联子项目和资金类型
async function linkSubProjectsToFundTypes(subProjects: any[], fundTypes: any[], departments: any[]) {
  console.log('创建DetailedFundNeed关联...');
  
  const detailedFundNeeds = [];
  
  for (const subProject of subProjects) {
    // 获取项目信息
    const projectInfo = await prisma.project.findUnique({
      where: { id: subProject.projectId },
      include: {
        category: true
      }
    });
    
    if (!projectInfo) {
      console.log(`警告: 找不到子项目 ${subProject.name} 的项目信息，跳过创建关联`);
      continue;
    }
    
    // 获取项目所属组织
    // 这里我们通过项目名称来推断组织，因为项目名称格式为"${org.name}项目${i}"
    const projectNameParts = projectInfo.name.split('项目');
    const orgName = projectNameParts[0];
    
    const organization = await prisma.organization.findFirst({
      where: {
        name: orgName
      }
    });
    
    if (!organization) {
      console.log(`警告: 无法确定项目 ${projectInfo.name} 的所属组织，跳过创建关联`);
      continue;
    }
    
    // 获取该组织的部门
    const orgDepartments = departments.filter(d => d.organizationId === organization.id);
    
    if (orgDepartments.length === 0) {
      console.log(`警告: 组织 ${organization.name} 没有部门，跳过创建关联`);
      continue;
    }
    
    // 为每个子项目随机选择2-3个资金类型
    const typeCount = Math.floor(Math.random() * 2) + 2; // 2-3个资金类型
    const usedTypeIndexes = new Set();
    
    for (let i = 0; i < typeCount && i < fundTypes.length; i++) {
      let randomTypeIndex;
      do {
        randomTypeIndex = Math.floor(Math.random() * fundTypes.length);
      } while (usedTypeIndexes.has(randomTypeIndex));
      
      usedTypeIndexes.add(randomTypeIndex);
      const fundType = fundTypes[randomTypeIndex];
      
      // 随机选择1-2个部门
      const deptCount = Math.floor(Math.random() * 2) + 1; // 1-2个部门
      const usedDeptIndexes = new Set();
      
      for (let j = 0; j < deptCount && j < orgDepartments.length; j++) {
        let randomDeptIndex;
        do {
          randomDeptIndex = Math.floor(Math.random() * orgDepartments.length);
        } while (usedDeptIndexes.has(randomDeptIndex));
        
        usedDeptIndexes.add(randomDeptIndex);
        const department = orgDepartments[randomDeptIndex];
        
        // 创建DetailedFundNeed记录
        const detailedFundNeed = await prisma.detailedFundNeed.create({
          data: {
            subProjectId: subProject.id,
            departmentId: department.id,
            fundTypeId: fundType.id,
            organizationId: organization.id,
            isActive: true
          }
        });
        
        detailedFundNeeds.push(detailedFundNeed);
        console.log(`创建资金需求明细: 子项目 ${subProject.name} - 部门 ${department.name} - 资金类型 ${fundType.name}`);
      }
    }
  }
  
  return detailedFundNeeds;
}

// 创建预测记录
async function createPredictRecords(detailedFundNeeds: any[], users: any[]) {
  console.log('创建预测记录...');
  
  const records = [];
  
  // 为每个DetailedFundNeed创建1-3个月的预测记录
  for (const detailedFundNeed of detailedFundNeeds) {
    // 随机决定是否创建记录（80%的概率）
    if (Math.random() < 0.8) {
      // 随机选择1-3个月创建记录
      const monthCount = Math.floor(Math.random() * 3) + 1; // 1-3个月
      const months = [1, 2, 3]; // 1月、2月、3月
      
      for (let i = 0; i < monthCount; i++) {
        const month = months[i];
        const year = 2025;
        
        // 随机金额：100-10000
        const amount = parseFloat((Math.random() * 9900 + 100).toFixed(2));
        
        // 随机选择一个填报用户
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        try {
          const record = await prisma.predictRecord.create({
            data: {
              detailedFundNeedId: detailedFundNeed.id,
              year,
              month,
              amount,
              status: 'SUBMITTED',
              submittedBy: randomUser.id,
              submittedAt: new Date()
            }
          });
          
          records.push(record);
          console.log(`创建预测记录: ${year}年${month}月 - 金额: ${amount}`);
        } catch (error) {
          console.error(`创建预测记录失败:`, error);
        }
      }
    }
  }
  
  return records;
}

// 创建实际记录（用户填报和财务填报）
async function createActualRecords(detailedFundNeeds: any[], reporterUsers: any[], financeUsers: any[], auditorUsers: any[]) {
  console.log('创建实际记录...');
  
  // 创建从2024年1月到2024年12月的记录
  const startDate = new Date(2024, 0); // 2024年1月
  const endDate = new Date(2024, 11); // 2024年12月

  // 为每个月创建记录
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    const startMonth = year === startDate.getFullYear() ? startDate.getMonth() : 0;
    const endMonth = year === endDate.getFullYear() ? endDate.getMonth() : 11;

    for (let month = startMonth; month <= endMonth; month++) {
      console.log(`创建 ${year}年${month + 1}月 的实际记录...`);

      // 为每个资金需求明细创建记录
      for (const detailedFundNeed of detailedFundNeeds) {
        // 随机决定是否创建记录（60%的概率）
        if (Math.random() < 0.6) {
          // 创建用户填报记录
          const amount = Math.floor(Math.random() * 100000) + 10000; // 10000-110000之间的随机数
          
          // 随机状态：90%已提交，10%草稿
          const userStatus = Math.random() < 0.9 ? RecordStatus.SUBMITTED : RecordStatus.DRAFT;
          
          // 随机选择一个填报用户
          const randomReporter = reporterUsers[Math.floor(Math.random() * reporterUsers.length)];
          
          try {
            const userRecord = await prisma.actualUserRecord.create({
              data: {
                detailedFundNeedId: detailedFundNeed.id,
                year,
                month: month + 1,
                amount,
                status: userStatus,
                submittedBy: randomReporter.id,
                submittedAt: userStatus === RecordStatus.SUBMITTED ? new Date() : null,
              }
            });

            // 只为已提交的用户记录创建财务记录
            if (userStatus === RecordStatus.SUBMITTED) {
              // 随机决定是否创建财务记录（80%的概率）
              if (Math.random() < 0.8) {
                // 财务金额在用户金额的基础上有小幅度浮动
                const financeAmount = Math.round(amount * (0.95 + Math.random() * 0.1)); // 用户金额的95%-105%
                
                // 随机状态：80%已提交，20%草稿
                const financeStatus = Math.random() < 0.8 ? RecordStatus.SUBMITTED : RecordStatus.DRAFT;
                
                // 随机选择一个财务用户
                const randomFinance = financeUsers[Math.floor(Math.random() * financeUsers.length)];
                
                const financeRecord = await prisma.actualFinRecord.create({
                  data: {
                    detailedFundNeedId: detailedFundNeed.id,
                    year,
                    month: month + 1,
                    amount: financeAmount,
                    status: financeStatus,
                    submittedBy: randomFinance.id,
                    submittedAt: financeStatus === RecordStatus.SUBMITTED ? new Date() : null,
                    userRecordId: userRecord.id,
                  }
                });

                // 只为已提交的财务记录创建审核记录（50%的概率）
                if (financeStatus === RecordStatus.SUBMITTED && Math.random() < 0.5) {
                  // 审核金额与财务金额相同
                  const auditAmount = financeAmount;
                  
                  // 随机选择一个审核用户
                  const randomAuditor = auditorUsers[Math.floor(Math.random() * auditorUsers.length)];
                  
                  await prisma.auditRecord.create({
                    data: {
                      detailedFundNeedId: detailedFundNeed.id,
                      year,
                      month: month + 1,
                      amount: auditAmount,
                      status: RecordStatus.APPROVED,
                      submittedBy: randomAuditor.id,
                      submittedAt: new Date(),
                      financeRecordId: financeRecord.id,
                      remark: '自动审核通过',
                    }
                  });
                }
              }
            }
          } catch (error) {
            console.error(`创建实际记录失败:`, error);
          }
        }
      }
    }
  }
  
  console.log('创建实际记录完成');
}

// 创建撤回配置
async function seedWithdrawalConfigs() {
  console.log('Seeding withdrawal configs...');
  
  // 创建预测记录的撤回配置
  await prisma.withdrawalConfig.upsert({
    where: { id: 'predict-config' },
    update: {
      moduleType: 'predict',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 72, // 3天
      maxAttempts: 3,
      requireApproval: false
    },
    create: {
      id: 'predict-config',
      moduleType: 'predict',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 72, // 3天
      maxAttempts: 3,
      requireApproval: false
    }
  });
  
  // 创建实际用户记录的撤回配置
  await prisma.withdrawalConfig.upsert({
    where: { id: 'actual-user-config' },
    update: {
      moduleType: 'actual_user',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 120, // 5天
      maxAttempts: 3,
      requireApproval: true
    },
    create: {
      id: 'actual-user-config',
      moduleType: 'actual_user',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 120, // 5天
      maxAttempts: 3,
      requireApproval: true
    }
  });
  
  // 创建实际财务记录的撤回配置
  await prisma.withdrawalConfig.upsert({
    where: { id: 'actual-fin-config' },
    update: {
      moduleType: 'actual_fin',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 120, // 5天
      maxAttempts: 2,
      requireApproval: true
    },
    create: {
      id: 'actual-fin-config',
      moduleType: 'actual_fin',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 120, // 5天
      maxAttempts: 2,
      requireApproval: true
    }
  });
  
  console.log('Withdrawal configs seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 