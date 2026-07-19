import React from 'react';

const PageSkeleton: React.FC = () => {
  return (
    <div className="w-full p-4 md:p-8 animate-pulse mx-auto container">
      {/* Top Banner Skeleton */}
      <div className="w-full h-40 md:h-72 bg-gray-200 rounded-2xl mb-8 md:mb-12"></div>
      
      {/* Section Title Skeleton */}
      <div className="w-48 md:w-64 h-8 bg-gray-200 rounded-lg mb-6"></div>
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            {/* Image Placeholder */}
            <div className="w-full aspect-square bg-gray-200 rounded-xl"></div>
            {/* Title Placeholder */}
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            {/* Price Placeholder */}
            <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageSkeleton;
