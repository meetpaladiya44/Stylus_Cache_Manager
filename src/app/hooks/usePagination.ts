"use client";

import { useState, useCallback, useEffect } from "react";

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrev: boolean;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  onPageChange?: (page: number) => void | Promise<void>;
  resetOnDependencyChange?: boolean;
}

interface UsePaginationReturn {
  pagination: PaginationState;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  goToPage: (page: number) => Promise<void>;
  goToNextPage: () => Promise<void>;
  goToPrevPage: () => Promise<void>;
  goToFirstPage: () => Promise<void>;
  goToLastPage: () => Promise<void>;
  setPaginationData: (data: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePagination = (
  options: UsePaginationOptions = {}
): UsePaginationReturn => {
  const {
    initialPage = 1,
    initialLimit = 50,
    onPageChange,
    resetOnDependencyChange = true,
  } = options;

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasMore: false,
    hasPrev: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const setPaginationData = useCallback((data: Partial<PaginationState>) => {
    setPagination((prev) => ({
      ...prev,
      ...data,
      hasMore: data.page
        ? data.page < (data.totalPages || prev.totalPages)
        : prev.hasMore,
      hasPrev: data.page ? data.page > 1 : prev.hasPrev,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  const goToPage = useCallback(
    async (page: number) => {
      if (
        page === pagination.page ||
        isNavigating ||
        page < 1 ||
        page > pagination.totalPages
      ) {
        return;
      }

      setIsNavigating(true);
      setError(null);

      try {
        setPagination((prev) => ({ ...prev, page }));
        if (onPageChange) {
          const result = onPageChange(page);
          // Handle both sync and async onPageChange functions
          if (result && typeof result.then === "function") {
            await result;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to change page");
        // Revert page change on error
        setPagination((prev) => ({ ...prev, page: pagination.page }));
      } finally {
        setIsNavigating(false);
      }
    },
    [pagination.page, pagination.totalPages, isNavigating, onPageChange]
  );

  const goToNextPage = useCallback(async () => {
    if (pagination.hasMore) {
      await goToPage(pagination.page + 1);
    }
  }, [pagination.hasMore, pagination.page, goToPage]);

  const goToPrevPage = useCallback(async () => {
    if (pagination.hasPrev) {
      await goToPage(pagination.page - 1);
    }
  }, [pagination.hasPrev, pagination.page, goToPage]);

  const goToFirstPage = useCallback(async () => {
    await goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(async () => {
    if (pagination.totalPages > 0) {
      await goToPage(pagination.totalPages);
    }
  }, [pagination.totalPages, goToPage]);

  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
      hasMore: false,
      hasPrev: false,
    });
    setIsLoading(false);
    setError(null);
    setIsNavigating(false);
  }, [initialPage, initialLimit]);

  return {
    pagination,
    currentPage: pagination.page,
    isLoading: isLoading || isNavigating,
    error,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    setPaginationData,
    setLoading,
    setError: setErrorState,
    reset,
  };
};
