// 项目-部门关联修复脚本
// 此脚本用于修复项目与部门之间的关联关系
// 可以在浏览器控制台中运行

(async function createProjectDepartmentLinks() {
  try {
    console.log('开始创建项目-部门关联关系...');
    
    // 调用API创建关联关系
    const response = await fetch('/api/admin/create-project-dept-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // 可以传递特定参数，例如默认将所有项目关联到特定部门
        defaultDepartmentId: null, // 设置为null将尝试智能匹配，或者可以指定一个部门ID
        forceUpdate: true, // 是否强制更新已有关联
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API响应错误: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('项目-部门关联创建成功！');
    console.log(`创建了 ${result.created} 个新关联，${result.updated} 个已存在关联被更新`);
    console.log('请刷新页面，查看更新后的数据');
    
  } catch (error) {
    console.error('创建项目-部门关联时出错:', error);
    console.log('请联系管理员处理此问题');
  }
})(); 