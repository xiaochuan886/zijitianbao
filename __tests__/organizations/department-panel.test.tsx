import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { DepartmentPanel } from "@/app/management/organizations/components/DepartmentPanel"
import userEvent from "@testing-library/user-event"
import {
  createMockResponse,
  createErrorResponse,
  waitForDialog,
  waitForDialogContent,
  waitForLoadingToFinish,
  findButtonByName,
  waitForErrorMessage,
  waitForFormError,
  generateTestData
} from "../utils/test-utils"
import { Organization } from "@/app/management/organizations/columns"
import { toast } from "sonner"

const mockOrganization: Organization = {
  id: 1,
  name: "测试机构",
  code: "TEST",
  departments: 2,
  projects: 0
}

const mockDepartments = [
  {
    id: 1,
    name: "部门1",
    parentId: null,
    order: 0,
    organizationId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "部门2",
    parentId: null,
    order: 1,
    organizationId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe("部门管理面板测试", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.endsWith("/departments")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDepartments)
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("应该能够创建部门", async () => {
    const onSuccess = jest.fn()
    render(
      <DepartmentPanel
        organization={mockOrganization}
        onSuccess={onSuccess}
        trigger={<button>打开部门管理</button>}
      />
    )

    // 打开面板
    await userEvent.click(screen.getByText("打开部门管理"))

    // 等待面板加载
    await waitForDialog()

    // 输入部门名称
    await userEvent.type(screen.getByPlaceholderText("请输入部门名称"), "新部门")

    // 点击添加按钮
    await userEvent.click(screen.getByRole("button", { name: "新建部门" }))

    // 验证API调用和成功回调
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/organizations/${mockOrganization.id}/departments`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "新部门",
            parentId: null,
          }),
        })
      )
      expect(toast.success).toHaveBeenCalledWith("部门创建成功")
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it("应该能够编辑部门", async () => {
    const onSuccess = jest.fn()

    // 模拟 API 响应
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: "部门1", parentId: null, order: 0, organizationId: "1" },
          { id: 2, name: "部门2", parentId: null, order: 1, organizationId: "1" }
        ])
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: "部门1修改", parentId: null })
      }))

    render(
      <DepartmentPanel
        organization={mockOrganization}
        onSuccess={onSuccess}
        trigger={<button>打开部门管理</button>}
      />
    )

    // 打开面板
    await userEvent.click(screen.getByText("打开部门管理"))

    // 等待部门列表加载
    await waitForLoadingToFinish()

    // 等待部门1出现
    await waitFor(() => {
      const departmentSpan = screen.getAllByText("部门1").find(el => el.tagName === "SPAN")
      expect(departmentSpan).toBeInTheDocument()
    })

    // 点击编辑按钮
    const editButton = screen.getByLabelText("编辑部门1")
    fireEvent.click(editButton)

    // 等待表单值更新
    await waitFor(() => {
      const input = screen.getByPlaceholderText("请输入部门名称")
      expect(input).toHaveValue("部门1")
    }, { timeout: 2000 })

    // 修改部门名称
    const input = screen.getByPlaceholderText("请输入部门名称")
    fireEvent.change(input, { target: { value: "部门1修改" } })

    // 点击保存按钮
    const saveButton = screen.getByLabelText("保存部门")
    fireEvent.click(saveButton)

    // 验证API调用和成功回调
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/organizations/${mockOrganization.id}/departments/1`,
        expect.objectContaining({
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "部门1修改",
            parentId: null,
          }),
        })
      )
      expect(toast.success).toHaveBeenCalledWith("部门更新成功")
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it("应该能够删除部门", async () => {
    const onSuccess = jest.fn()

    // 模拟 API 响应
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: "部门1", parentId: null, order: 0, organizationId: "1" },
          { id: 2, name: "部门2", parentId: null, order: 1, organizationId: "1" }
        ])
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }))

    render(
      <DepartmentPanel
        organization={mockOrganization}
        onSuccess={onSuccess}
        trigger={<button>打开部门管理</button>}
      />
    )

    // 打开面板
    await userEvent.click(screen.getByText("打开部门管理"))

    // 等待部门列表加载
    await waitForLoadingToFinish()

    // 等待部门1出现
    await waitFor(() => {
      const departmentSpan = screen.getAllByText("部门1").find(el => el.tagName === "SPAN")
      expect(departmentSpan).toBeInTheDocument()
    })

    // 点击删除按钮
    const deleteButton = screen.getByLabelText("删除部门1")
    fireEvent.click(deleteButton)

    // 等待确认对话框出现
    await waitFor(() => {
      const dialog = screen.getByRole("alertdialog")
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveTextContent("部门1")
    })

    // 点击确认按钮
    const confirmButton = screen.getByLabelText("确认删除部门1")
    fireEvent.click(confirmButton)

    // 验证API调用和成功回调
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/organizations/${mockOrganization.id}/departments/1`,
        expect.objectContaining({
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
      expect(toast.success).toHaveBeenCalledWith("部门删除成功")
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  describe("错误处理", () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test("不应该允许创建同名部门", async () => {
      const onSuccess = jest.fn()

      // 模拟 API 响应
      global.fetch = jest.fn()
        .mockImplementationOnce(() => createMockResponse([]))
        .mockImplementationOnce(() => createErrorResponse("部门名称已存在"))

      render(
        <DepartmentPanel
          organization={{ id: 1, name: "测试机构", code: "TEST", departments: 0, projects: 0 }}
          onSuccess={onSuccess}
          trigger={<button>打开部门管理</button>}
        />
      )

      // 打开面板
      await userEvent.click(screen.getByText("打开部门管理"))

      // 等待面板加载
      await waitForDialog()

      // 输入部门名称
      await userEvent.type(screen.getByPlaceholderText("请输入部门名称"), "部门1")

      // 点击添加按钮
      await userEvent.click(screen.getByRole("button", { name: /新建部门/ }))

      // 验证错误提示
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("部门名称已存在")
      })
      expect(onSuccess).not.toHaveBeenCalled()
    })

    test("不应该允许删除有子部门的部门", async () => {
      const onSuccess = jest.fn()

      // 模拟 API 响应
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, name: "部门1", parentId: null, order: 0 },
            { id: 2, name: "子部门1", parentId: 1, order: 0 }
          ])
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "无法删除：该部门包含子部门" })
        }))

      render(
        <DepartmentPanel
          organization={{ id: 1, name: "测试机构", code: "TEST", departments: 0, projects: 0 }}
          onSuccess={onSuccess}
          trigger={<button>打开部门管理</button>}
        />
      )

      // 打开面板
      await userEvent.click(screen.getByText("打开部门管理"))

      // 等待部门列表加载
      await waitForLoadingToFinish()

      // 等待部门1出现
      await waitFor(() => {
        const departmentSpan = screen.getAllByText("部门1").find(el => el.tagName === "SPAN")
        expect(departmentSpan).toBeInTheDocument()
      })

      // 点击删除按钮
      const deleteButton = screen.getByLabelText("删除部门1")
      fireEvent.click(deleteButton)

      // 等待确认对话框出现
      await waitFor(() => {
        const dialog = screen.getByRole("alertdialog")
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveTextContent("部门1")
      })

      // 点击确认按钮
      const confirmButton = screen.getByLabelText("确认删除部门1")
      fireEvent.click(confirmButton)

      // 验证错误提示
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("无法删除：该部门包含子部门")
      })
      expect(onSuccess).not.toHaveBeenCalled()
    })

    test("应该验证部门名称长度", async () => {
      const onSuccess = jest.fn()

      render(
        <DepartmentPanel
          organization={{ id: 1, name: "测试机构", code: "TEST", departments: 0, projects: 0 }}
          onSuccess={onSuccess}
          trigger={<button>打开部门管理</button>}
        />
      )

      // 打开面板
      await userEvent.click(screen.getByText("打开部门管理"))

      // 等待面板加载
      await waitForDialog()

      // 输入无效的部门名称
      await userEvent.type(screen.getByPlaceholderText("请输入部门名称"), "a")

      // 点击添加按钮
      await userEvent.click(screen.getByRole("button", { name: /新建部门/ }))

      // 验证错误提示
      await waitForFormError("部门名称至少2个字符")
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })
}) 