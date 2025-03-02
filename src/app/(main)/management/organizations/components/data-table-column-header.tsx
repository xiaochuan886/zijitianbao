import { Column } from "@tanstack/react-table"
import { ChevronsUpDown, ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort?.() ?? false

  if (!canSort) {
    return <div className={cn("text-sm font-medium text-muted-foreground", className)}>{title}</div>
  }

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting()}
      className={cn(
        "group flex items-center gap-1 hover:bg-transparent p-0 font-medium",
        className
      )}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-1 h-4 w-4 text-muted-foreground" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-1 h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronsUpDown className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
      )}
    </Button>
  )
}