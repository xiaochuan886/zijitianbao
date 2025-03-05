"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  // 如果只有一页，不显示分页
  if (totalPages <= 1) {
    return null;
  }

  // 生成页码数组
  const generatePagination = () => {
    // 总是显示第一页和最后一页
    const firstPage = 1;
    const lastPage = totalPages;

    // 计算当前页附近要显示的页码
    const leftSiblingIndex = Math.max(currentPage - siblingCount, firstPage);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, lastPage);

    // 是否显示左边的省略号
    const shouldShowLeftDots = leftSiblingIndex > firstPage + 1;
    // 是否显示右边的省略号
    const shouldShowRightDots = rightSiblingIndex < lastPage - 1;

    // 初始化页码数组
    const pages: (number | string)[] = [];

    // 添加第一页
    pages.push(firstPage);

    // 添加左边的省略号
    if (shouldShowLeftDots) {
      pages.push("left-dots");
    } else if (firstPage + 1 < leftSiblingIndex) {
      // 如果没有省略号但有空间，添加第二页
      pages.push(firstPage + 1);
    }

    // 添加当前页附近的页码
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== firstPage && i !== lastPage) {
        pages.push(i);
      }
    }

    // 添加右边的省略号
    if (shouldShowRightDots) {
      pages.push("right-dots");
    } else if (rightSiblingIndex < lastPage - 1) {
      // 如果没有省略号但有空间，添加倒数第二页
      pages.push(lastPage - 1);
    }

    // 添加最后一页
    if (lastPage !== firstPage) {
      pages.push(lastPage);
    }

    return pages;
  };

  const pages = generatePagination();

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">上一页</span>
      </Button>

      {pages.map((page, index) => {
        if (page === "left-dots" || page === "right-dots") {
          return (
            <Button
              key={`dots-${index}`}
              variant="outline"
              size="icon"
              disabled
              className="cursor-default"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">更多页面</span>
            </Button>
          );
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page as number)}
            className="h-9 w-9"
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">下一页</span>
      </Button>
    </div>
  );
}
