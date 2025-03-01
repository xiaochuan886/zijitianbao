// 测试项目分类数据的脚本
// 在浏览器控制台中运行

(async function testProjectCategories() {
  console.log('开始测试项目分类数据...');
  
  try {
    // 1. 首先获取分类测试数据
    console.log('获取分类测试数据...');
    const testResponse = await fetch('/api/funding/predict/test-categories');
    
    if (!testResponse.ok) {
      throw new Error(`测试API返回错误: ${testResponse.status}`);
    }
    
    const testData = await testResponse.json();
    console.log('分类测试数据:', testData);
    
    // 2. 获取元数据
    console.log('获取元数据...');
    const metaResponse = await fetch('/api/funding/predict/meta');
    
    if (!metaResponse.ok) {
      throw new Error(`元数据API返回错误: ${metaResponse.status}`);
    }
    
    const metaData = await metaResponse.json();
    console.log('元数据:', {
      organizations: metaData.organizations?.length || 0,
      departments: metaData.departments?.length || 0,
      projectCategories: metaData.projectCategories?.length || 0,
      projects: metaData.projects?.length || 0,
      subProjects: metaData.subProjects?.length || 0,
      fundTypes: metaData.fundTypes?.length || 0,
    });
    
    // 3. 测试项目分类关联
    console.log('测试项目分类关联...');
    
    // 3.1 检查没有分类的项目
    const projectsWithoutCategory = metaData.projects.filter(p => !p.categoryId);
    console.log(`没有分类的项目: ${projectsWithoutCategory.length} / ${metaData.projects.length}`);
    
    if (projectsWithoutCategory.length > 0) {
      console.warn('警告: 仍有项目没有分类ID');
      console.log('示例:', projectsWithoutCategory.slice(0, 3));
    }
    
    // 3.2 检查每个分类下的项目数量
    const categoryProjectCounts = {};
    metaData.projectCategories.forEach(category => {
      const count = metaData.projects.filter(p => p.categoryId === category.id).length;
      categoryProjectCounts[category.name] = count;
    });
    
    console.log('各分类下的项目数量:', categoryProjectCounts);
    
    // 3.3 测试 getProjectsByCategory 函数实现
    // 模拟函数行为
    console.log('模拟 getProjectsByCategory 函数行为...');
    
    function mockGetProjectsByCategory(categoryId) {
      if (!categoryId || categoryId === 'all') {
        return metaData.projects;
      }
      
      // 检查项目数据中是否有正确的categoryId字段
      const hasValidProjectsWithCategory = metaData.projects.some(
        project => project.categoryId === categoryId
      );
      
      if (!hasValidProjectsWithCategory) {
        console.warn(`警告: 没有项目匹配分类ID: ${categoryId}`);
        return metaData.projects;
      }
      
      return metaData.projects.filter(project => project.categoryId === categoryId);
    }
    
    // 测试所有分类
    console.log('测试所有分类下的项目筛选...');
    metaData.projectCategories.forEach(category => {
      const filtered = mockGetProjectsByCategory(category.id);
      console.log(`分类 "${category.name}" 下的项目数量: ${filtered.length}`);
    });
    
    console.log('项目分类数据测试完成!');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
})(); 