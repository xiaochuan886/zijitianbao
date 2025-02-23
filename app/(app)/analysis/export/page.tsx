export default function ExportPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">数据导出</h1>
      <div className="grid gap-6">
        {/* 数据导出的具体内容将在这里实现 */}
        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">导出选项</h2>
            {/* 导出选项内容 */}
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">导出历史</h2>
            {/* 导出历史内容 */}
          </div>
        </div>
      </div>
    </div>
  )
} 