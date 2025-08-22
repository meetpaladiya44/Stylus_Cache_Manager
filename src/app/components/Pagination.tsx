"use client";

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Loader2,
  MoreHorizontal
} from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isSpecificLoading?: boolean;
}

const PaginationButton: React.FC<PaginationButtonProps> = ({
  onClick,
  disabled = false,
  active = false,
  loading = false,
  children,
  title,
  variant = 'default',
  size = 'md',
  isSpecificLoading = false
}) => {
  // ✅ FIXED: Simplified CSS with specific transitions to prevent conflicts
  const baseClasses = "relative inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900";
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs rounded-md min-w-[28px] min-h-[28px]",
    md: "px-3 py-2 text-sm rounded-lg min-w-[36px] min-h-[36px]",
    lg: "px-4 py-2.5 text-base rounded-xl min-w-[44px] min-h-[44px]"
  };

  // ✅ FIXED: Ensured buttons are always visible with opacity >= 0.4
  const variantClasses = {
    default: active 
      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border border-blue-500 shadow-lg shadow-blue-500/25 opacity-100" 
      : "bg-zinc-800/60 text-gray-300 border border-gray-600/50 hover:bg-zinc-700/80 hover:text-white hover:border-gray-500 opacity-100",
    outline: active
      ? "bg-blue-600 text-white border-2 border-blue-500 opacity-100"
      : "bg-transparent text-gray-300 border-2 border-gray-600/50 hover:border-blue-500/60 hover:text-blue-300 opacity-100",
    ghost: active
      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 opacity-100"
      : "bg-transparent text-gray-400 hover:bg-zinc-700/40 hover:text-white border border-transparent opacity-100"
  };

  // ✅ FIXED: Disabled state with minimum visibility
  const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";
  
  // ✅ FIXED: Specific transitions only for colors, no transform or opacity transitions
  const transitionClasses = "transition-colors duration-150 ease-in-out";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading || isSpecificLoading}
      title={title}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${transitionClasses}
        ${disabled || isSpecificLoading ? disabledClasses : variantClasses[variant]}
      `.replace(/\s+/g, ' ').trim()}
      style={{
        // ✅ FIXED: Force minimum opacity to prevent invisible buttons
        opacity: disabled || isSpecificLoading ? 0.5 : 1,
        visibility: 'visible',
        display: 'inline-flex'
      }}
    >
      {isSpecificLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
  disabled = false,
  showFirstLast = true,
  showPageNumbers = true,
  maxVisiblePages = 7,
  className = ""
}) => {
  const [loadingPage, setLoadingPage] = React.useState<number | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const lastClickTime = React.useRef<number>(0);
  const currentRequest = React.useRef<Promise<any> | null>(null);

  // ✅ FIXED: Debounced page change with race condition prevention
  const handlePageChange = async (page: number) => {
    const now = Date.now();
    
    // Prevent rapid clicks (debounce with 200ms)
    if (now - lastClickTime.current < 200) {
      console.log('⏸️ Pagination click ignored - too fast');
      return;
    }
    
    // Prevent duplicate page changes
    if (page === currentPage || disabled || loading || isProcessing || loadingPage !== null) {
      return;
    }
    
    lastClickTime.current = now;
    setLoadingPage(page);
    setIsProcessing(true);
    
    try {
      // Cancel any existing request
      if (currentRequest.current) {
        console.log('🚫 Cancelling previous pagination request');
      }
      
      // Create new request
      const request = onPageChange(page);
      currentRequest.current = typeof request?.then === 'function' ? request : Promise.resolve();
      
      if (request && typeof request.then === 'function') {
        await request;
      }
      
      // Only clear loading if this is still the current request
      if (currentRequest.current === request) {
        setLoadingPage(null);
        setIsProcessing(false);
        currentRequest.current = null;
      }
    } catch (error) {
      console.error('❌ Pagination error:', error);
      setLoadingPage(null);
      setIsProcessing(false);
      currentRequest.current = null;
    }
  };

  // Calculate visible page range
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    pages.push(1);

    let startPage = Math.max(2, currentPage - halfVisible);
    let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

    if (currentPage <= halfVisible + 1) {
      endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
    } else if (currentPage >= totalPages - halfVisible) {
      startPage = Math.max(2, totalPages - maxVisiblePages + 2);
    }

    if (startPage > 2) {
      pages.push('ellipsis');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300 font-medium">
            Showing{' '}
            <span className="text-blue-400 font-semibold">{startItem.toLocaleString()}</span>
            {' '}to{' '}
            <span className="text-blue-400 font-semibold">{endItem.toLocaleString()}</span>
            {' '}of{' '}
            <span className="text-purple-400 font-semibold">{totalItems.toLocaleString()}</span>
            {' '}results
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
          <span>{Math.ceil((currentPage / totalPages) * 100)}% complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-700/30 rounded-full h-1 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>

      {/* ✅ FIXED: Pagination Controls with forced visibility */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Navigation Buttons - Left */}
        <div className="flex items-center gap-2" style={{ opacity: 1, visibility: 'visible' }}>
          {showFirstLast && (
            <PaginationButton
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || disabled}
              isSpecificLoading={loadingPage === 1}
              title="First page"
              variant="outline"
            >
              <ChevronsLeft className="w-4 h-4" />
            </PaginationButton>
          )}
          
          <PaginationButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
            isSpecificLoading={loadingPage === (currentPage - 1)}
            title="Previous page"
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4" />
          </PaginationButton>
        </div>

        {/* ✅ FIXED: Page Numbers with guaranteed visibility */}
        {showPageNumbers && (
          <div 
            className="flex items-center gap-1 px-2" 
            style={{ opacity: 1, visibility: 'visible', minHeight: '36px' }}
          >
            {visiblePages.map((page, index) => (
              page === 'ellipsis' ? (
                <div key={`ellipsis-${index}`} className="flex items-center gap-1 px-2 opacity-100">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <PaginationButton
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={disabled}
                  isSpecificLoading={loadingPage === page}
                  active={page === currentPage}
                  title={`Go to page ${page}`}
                  variant="default"
                >
                  {page}
                </PaginationButton>
              )
            ))}
          </div>
        )}

        {/* Navigation Buttons - Right */}
        <div className="flex items-center gap-2" style={{ opacity: 1, visibility: 'visible' }}>
          <PaginationButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
            isSpecificLoading={loadingPage === currentPage + 1}
            title="Next page"
            variant="outline"
          >
            <ChevronRight className="w-4 h-4" />
          </PaginationButton>
          
          {showFirstLast && (
            <PaginationButton
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || disabled}
              isSpecificLoading={loadingPage === totalPages}
              title="Last page"
              variant="outline"
            >
              <ChevronsRight className="w-4 h-4" />
            </PaginationButton>
          )}
        </div>
      </div>

      {/* Mobile-friendly page input */}
      <div className="sm:hidden flex items-center justify-center gap-2 pt-2 border-t border-gray-700/50">
        <span className="text-xs text-gray-400">Jump to page:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
              handlePageChange(page);
            }
          }}
          disabled={disabled || loading || loadingPage !== null}
          className="w-16 px-2 py-1 text-xs bg-zinc-800 border border-gray-600 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">of {totalPages}</span>
      </div>
    </div>
  );
};

export default Pagination;