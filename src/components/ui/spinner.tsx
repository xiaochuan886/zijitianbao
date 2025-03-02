import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full", className)}
      {...props}
    >
      <span className="sr-only">加载中...</span>
    </div>
  );
} 