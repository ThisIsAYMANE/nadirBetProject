'use client';

import { ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  // Calculate which page numbers to show (max 5 visible pages)
  const getVisiblePages = () => {
    const maxVisible = 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        end = Math.min(5, totalPages - 1);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 4);
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* First Page Button */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || isLoading}
        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
        aria-label="First page"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      {/* Previous Page Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page Number Buttons */}
      {visiblePages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="w-10 h-10 flex items-center justify-center text-gray-500"
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
              isActive
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next Page Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Last Page Button */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages || isLoading}
        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
        aria-label="Last page"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );
}
