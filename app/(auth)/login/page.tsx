import { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from '@/app/components/auth/login-form'
import { Card, CardContent, CardHeader } from '@/app/components/ui/card'

// 导入本地图片
import Logo from '@/public/images/logo.svg'
import DashboardPreview from '@/public/images/dashboard-preview.svg'

export const metadata: Metadata = {
  title: '登录 | 资金计划填报系统',
  description: '资金计划填报系统登录页面',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex">
      {/* 左侧展示区 */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-b from-blue-800 to-blue-900 flex-col items-center justify-between p-12">
        {/* Logo和标题 */}
        <div className="w-full">
          <div className="flex items-center">
            <Image
              src={Logo}
              alt="Logo"
              width={48}
              height={48}
              className="mr-4 filter drop-shadow-md"
            />
            <h1 className="text-2xl font-bold text-white drop-shadow-md">资金计划填报系统</h1>
          </div>
          <p className="mt-4 text-blue-100 text-lg">
            高效、便捷的资金计划管理平台
          </p>
        </div>

        {/* 中间的图表和数据展示 */}
        <div className="flex-1 w-full flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            {/* 资金统计图表示意 */}
            <Image
              src={DashboardPreview}
              alt="Dashboard Preview"
              width={600}
              height={400}
              className="rounded-xl shadow-2xl backdrop-blur-sm"
              priority
            />
            {/* 悬浮的数据卡片 */}
            <div className="absolute -right-8 top-1/4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-blue-100/20">
              <div className="text-blue-700 font-semibold">年度预算执行率</div>
              <div className="text-3xl font-bold text-blue-900">98.5%</div>
            </div>
            <div className="absolute -left-8 bottom-1/4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-blue-100/20">
              <div className="text-blue-700 font-semibold">本月资金计划完成度</div>
              <div className="text-3xl font-bold text-blue-900">92.3%</div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="w-full">
          <div className="grid grid-cols-3 gap-4 text-blue-100">
            <div>
              <div className="text-3xl font-bold drop-shadow-md">500+</div>
              <div className="text-sm">注册企业</div>
            </div>
            <div>
              <div className="text-3xl font-bold drop-shadow-md">10000+</div>
              <div className="text-sm">月度计划</div>
            </div>
            <div>
              <div className="text-3xl font-bold drop-shadow-md">99.9%</div>
              <div className="text-sm">系统可用性</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录区 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <CardHeader className="pb-2">
            <div className="flex flex-col space-y-1.5 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-800">欢迎登录</h2>
              <p className="text-sm text-gray-500">
                请输入您的账号和密码
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 