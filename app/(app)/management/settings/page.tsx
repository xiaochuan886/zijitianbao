export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">系统设置</h1>
      <div className="grid gap-6">
        {/* 系统设置的具体内容将在这里实现 */}
        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">基本设置</h2>
            {/* 基本设置内容 */}
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">高级设置</h2>
            {/* 高级设置内容 */}
          </div>
        </div>
      </div>
    </div>
  )
} 