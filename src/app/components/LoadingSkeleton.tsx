"use client";

import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  showStats?: boolean;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  rows = 10, 
  showStats = true,
  className = "" 
}) => {
  return (
    <div className={`${className}`}>
      {/* Stats Cards Skeleton */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-zinc-800/30 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-3 animate-pulse"></div>
                  <div className="h-8 bg-gray-600 rounded w-16 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Skeleton */}
      <div className="bg-zinc-800/30 border border-gray-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-zinc-800/50 border-b border-gray-700 px-6 py-4">
          <div className="grid grid-cols-7 gap-4">
            {['Rank', 'Contract', 'Deployer', 'Deployed Via', 'Network', 'Gas Saved', 'Bid Amount'].map((_, index) => (
              <div key={index} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-700/50">
          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="grid grid-cols-7 gap-4 items-center">
                {/* Rank */}
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                {/* Contract Address */}
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                {/* Deployer */}
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                {/* Deployed Via */}
                <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
                
                {/* Network */}
                <div className="h-6 bg-gray-700 rounded w-20 animate-pulse"></div>
                
                {/* Gas Saved */}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
                
                {/* Bid Amount */}
                <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="px-6 py-8 bg-gradient-to-r from-zinc-800/30 via-zinc-800/20 to-zinc-800/30 border-t border-gray-700/50">
          <div className="flex flex-col gap-6">
            {/* Results summary skeleton */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
            
            {/* Progress bar skeleton */}
            <div className="w-full h-1 bg-gray-700 rounded-full"></div>
            
            {/* Pagination buttons skeleton */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
              
              <div className="flex gap-1">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;