// 生成测试数据的脚本 - 更新版
// 在浏览器控制台中运行

(async function generateTestData() {
  console.log('开始生成测试数据...');
  
  try {
    // 发送请求创建测试数据
    const response = await fetch('/api/funding/predict/seed-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        createCategories: true,
        createProjects: true
      })
    });
    
    console.log('API响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API返回错误: ${response.status}, 详情: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('测试数据生成结果:', result);
    
    if (result.success) {
      console.log(`成功创建了 ${result.data.categories.length} 个项目分类和 ${result.data.projects.length} 个项目`);
      
      // 刷新页面以加载新数据
      if (confirm('数据生成成功，是否刷新页面以加载新数据？')) {
        window.location.reload();
      }
    } else {
      console.error('数据生成失败:', result.error);
    }
  } catch (error) {
    console.error('生成测试数据时出错:', error);
  }
})(); 