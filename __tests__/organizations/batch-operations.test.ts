import { describe, expect, test, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TableToolbar } from '@/components/organizations/TableToolbar'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('批量操作工具栏测试', () => {
  const mockOnSearch = jest.fn()
  const mockOnImport = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('应该能正确渲染搜索框和导入按钮', () => {
    render(
      <TableToolbar
        onSearch={mockOnSearch}
        onImport={mockOnImport}
        templateUrl="/templates/organizations.csv"
      />
    )

    expect(screen.getByPlaceholderText('搜索机构名称或编码')).toBeInTheDocument()
    expect(screen.getByText('导入')).toBeInTheDocument()
  })

  test('搜索功能应该正常工作', async () => {
    render(
      <TableToolbar
        onSearch={mockOnSearch}
        onImport={mockOnImport}
        templateUrl="/templates/organizations.csv"
      />
    )

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText('搜索机构名称或编码')
    
    await user.type(searchInput, '测试')
    expect(mockOnSearch).toHaveBeenCalledWith('测试')
  })

  test('导入功能应该正常工作', async () => {
    render(
      <TableToolbar
        onSearch={mockOnSearch}
        onImport={mockOnImport}
        templateUrl="/templates/organizations.csv"
      />
    )

    const user = userEvent.setup()
    const importButton = screen.getByText('导入')
    
    await user.click(importButton)
    expect(mockOnImport).toHaveBeenCalled()
  })

  describe('CSV导入功能', () => {
    const file = new File(
      ['机构名称,机构编码\n测试机构1,TEST1\n测试机构2,TEST2'],
      'organizations.csv',
      { type: 'text/csv' }
    )

    test('应该能成功导入CSV文件', async () => {
      mockOnImport.mockResolvedValueOnce({ success: true })

      render(
        <TableToolbar
          onSearch={jest.fn()}
          onImport={mockOnImport}
          templateUrl="/templates/organizations.csv"
        />
      )

      // 上传文件
      const input = screen.getByAcceptingFiles()
      await userEvent.upload(input, file)

      // 验证进度条显示
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // 验证导入调用
      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(file)
      })
    })

    test('应该正确处理导入错误', async () => {
      const errors = ['第2行：机构编码已存在', '第3行：机构名称不能为空']
      mockOnImport.mockResolvedValueOnce({ success: false, errors })

      render(
        <TableToolbar
          onSearch={jest.fn()}
          onImport={mockOnImport}
        />
      )

      // 上传文件
      const input = screen.getByAcceptingFiles()
      await userEvent.upload(input, file)

      // 验证错误显示
      await waitFor(() => {
        errors.forEach(error => {
          expect(screen.getByText(error)).toBeInTheDocument()
        })
      })
    })

    test('应该能下载CSV模板', async () => {
      const templateUrl = '/templates/organizations.csv'
      
      render(
        <TableToolbar
          onSearch={jest.fn()}
          templateUrl={templateUrl}
        />
      )

      const downloadButton = screen.getByText('下载模板')
      expect(downloadButton).toHaveAttribute('href', templateUrl)
    })
  })

  describe('导入进度提示', () => {
    test('应该显示导入进度', async () => {
      const mockOnImport = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ success: true }), 1000)
        })
      })

      render(
        <TableToolbar
          onSearch={jest.fn()}
          onImport={mockOnImport}
        />
      )

      // 上传文件
      const input = screen.getByAcceptingFiles()
      await userEvent.upload(input, new File([''], 'test.csv'))

      // 验证进度条显示
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()

      // 验证进度更新
      await waitFor(() => {
        expect(progressBar).toHaveAttribute('aria-valuenow', '100')
      })
    })
  })

  describe('错误数据反馈', () => {
    test('应该显示详细的错误信息', async () => {
      const errors = [
        '第2行：机构编码 TEST1 已存在',
        '第3行：机构名称不能为空',
        '第4行：机构编码格式不正确',
      ]

      const mockOnImport = jest.fn().mockResolvedValueOnce({
        success: false,
        errors,
      })

      render(
        <TableToolbar
          onSearch={jest.fn()}
          onImport={mockOnImport}
        />
      )

      // 上传文件
      const input = screen.getByAcceptingFiles()
      await userEvent.upload(input, new File([''], 'test.csv'))

      // 验证错误对话框
      await waitFor(() => {
        expect(screen.getByText('导入错误')).toBeInTheDocument()
      })

      // 验证错误列表
      errors.forEach((error, index) => {
        expect(screen.getByText(`错误 ${index + 1}`)).toBeInTheDocument()
        expect(screen.getByText(error)).toBeInTheDocument()
      })

      // 验证关闭按钮
      const closeButton = screen.getByText('关闭')
      await userEvent.click(closeButton)
      expect(screen.queryByText('导入错误')).not.toBeInTheDocument()
    })
  })
}) 