import React from 'react';

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-4 animate-pulse shadow-sm h-full">
    <div className="w-full aspect-square bg-gray-200 rounded-2xl"></div>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

interface PageSkeletonProps {
  type: 'products' | 'category' | 'product-details';
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({ type }) => {
  if (type === 'product-details') {
    return (
      <div className="bg-white min-h-screen pb-20 animate-pulse pt-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
            <div className="w-full md:w-1/2 aspect-square bg-gray-100 rounded-3xl border border-gray-50"></div>
            <div className="w-full md:w-1/2 space-y-6 pt-4">
              <div className="h-6 bg-gray-100 w-24 rounded-full"></div>
              <div className="h-10 bg-gray-100 w-3/4 rounded-lg"></div>
              <div className="flex gap-4 items-center">
                 <div className="h-8 bg-gray-100 w-1/4 rounded-lg"></div>
                 <div className="h-8 bg-gray-100 w-1/4 rounded-lg"></div>
              </div>
              <div className="space-y-3 py-6 border-t border-gray-100 mt-6">
                <div className="h-4 bg-gray-100 w-full rounded"></div>
                <div className="h-4 bg-gray-100 w-full rounded"></div>
                <div className="h-4 bg-gray-100 w-5/6 rounded"></div>
              </div>
              <div className="flex gap-4">
                 <div className="h-14 bg-gray-100 w-1/3 rounded-full"></div>
                 <div className="h-14 bg-gray-100 w-2/3 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Common Grid for Products & Category
  const GridContent = () => (
    <div className="flex-1 w-full">
      <div className="flex justify-between items-center mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 w-1/4 rounded"></div>
        <div className="h-10 bg-gray-200 w-32 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {[...Array(12)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  const SidebarSkeleton = () => (
    <aside className="hidden lg:block lg:w-72 shrink-0 self-start animate-pulse">
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-[320px]">
           <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
           <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                 <div key={i} className="h-4 bg-gray-100 rounded w-full"></div>
              ))}
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-[220px]">
           <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
           <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                 <div key={i} className="h-4 bg-gray-100 rounded w-full"></div>
              ))}
           </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {type === 'category' && (
        <div className="h-[250px] md:h-[350px] w-full bg-gray-200 animate-pulse"></div>
      )}
      <div className={`container mx-auto px-4 md:px-8 ${type === 'category' ? 'py-8' : 'pt-8'}`}>
         <div className="flex flex-col lg:flex-row gap-8">
           <SidebarSkeleton />
           <GridContent />
         </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
