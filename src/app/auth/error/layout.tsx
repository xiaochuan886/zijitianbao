export default function ErrorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      {children}
    </div>
  )
} 