import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PageTitleProps {
  title: string
  showBackButton?: boolean
  backUrl?: string
}

export function PageTitle({ title, showBackButton = true, backUrl }: PageTitleProps) {
  const router = useRouter()
  
  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }
  
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
    </div>
  )
} 