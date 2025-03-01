// 定义基础项目类型
export interface BaseProject {
  id: string;
  projectId?: string;
  organization: string;
  department: string;
  project: string;
}

// 定义分组项的类型
export interface GroupHeader {
  id: string;
  organization: string;
  department: string;
  project: string;
  projectId: string;
  subProjects: any[];
  isGroupHeader: boolean;
}

// 定义分组后的子项目类型
export interface GroupedItem {
  isGroupItem: boolean;
  groupId: string;
  [key: string]: any;
}

/**
 * 将项目数据按机构和项目进行分组
 * @param projects 原始项目数据
 * @returns 分组后的数据
 */
export function groupProjects<T extends BaseProject>(projects: T[]): (GroupHeader | (T & GroupedItem))[] {
  if (!projects.length) return [];

  // 按机构和项目进行分组
  const groupsByOrgAndProject: Record<string, GroupHeader> = {};
  
  // 先按组织和项目进行分组
  projects.forEach(item => {
    // 创建唯一键：机构 + 项目ID
    const projectId = item.projectId || item.id;
    const key = `${item.organization}_${projectId}`;
    
    if (!groupsByOrgAndProject[key]) {
      groupsByOrgAndProject[key] = {
        id: `group_${projectId}`,
        organization: item.organization,
        department: item.department,
        project: item.project,
        projectId: projectId,
        subProjects: [],
        isGroupHeader: true
      };
    }
    
    // 添加子项目到对应的组
    groupsByOrgAndProject[key].subProjects.push(item);
  });

  // 生成分组后的列表，每个组的后面跟着它的子项目
  const result: (GroupHeader | (T & GroupedItem))[] = [];
  
  Object.values(groupsByOrgAndProject).forEach((group) => {
    // 添加分组标题行
    result.push(group);
    
    // 添加该组下的所有子项目行
    group.subProjects.forEach((subProject) => {
      result.push({
        ...subProject,
        isGroupItem: true,
        groupId: group.id
      } as T & GroupedItem);
    });
  });

  return result;
}

/**
 * 检查项目是否可编辑
 * @param status 项目状态
 * @returns 是否可编辑
 */
export function isProjectEditable(status?: string): boolean {
  return status === "草稿" || status === "未填写" || status === "draft" || status === "unfilled";
}

/**
 * 检查项目是否可提交
 * @param status 项目状态
 * @returns 是否可提交
 */
export function isProjectSubmittable(status?: string): boolean {
  return status === "草稿" || status === "draft";
} 