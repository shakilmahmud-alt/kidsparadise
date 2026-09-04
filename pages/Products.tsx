
import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import PageSkeleton from '../components/PageSkeleton';
import { Filter, SlidersHorizontal, ChevronRight, ChevronDown, Search, RotateCcw, Check, Star, Coins, X } from 'lucide-react';
import { Category } from '../types';
import { scoreProductSearch } from '../lib/search';
import { findCategoryBySlugOrName, getCategoryFamily, isProductInCategory, cleanCategoryString, slugify } from '../lib/category';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

const buildCategoryTree = (categories: Category[], parentId: string | null = null, level: number = 0): CategoryNode[] => {
  return categories
    .filter(cat => cat.parentId == parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id, level + 1),
      level
    }));
};

const CategorySidebarItem: React.FC<{
  category: CategoryNode;
  selectedCategory: string;
  onSelect: (name: string) => void;
  selectedCategoryFamily: string[];
}> = ({ category, selectedCategory, onSelect, selectedCategoryFamily }) => {
  // Auto-expand if this category or any child is selected, or if it's a top-level parent of the selection
  const isSelected = selectedCategory === category.name;
  const isPathActive = selectedCategoryFamily.includes(category.name);

  const [isExpanded, setIsExpanded] = useState(isPathActive);

  // Update expansion when selection changes
  useEffect(() => {
    if (isPathActive) setIsExpanded(true);
  }, [isPathActive]);

  const hasChildren = category.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isSelected ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`}
        onClick={() => onSelect(category.name)}
        style={{ paddingLeft: `${(category.level * 12) + 12}px` }}
      >
        <div className="flex items-center gap-2">
          {/* Only show leaf indicator if it's a child */}
          {category.level > 0 && !hasChildren && <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>}
          <span className={`${isSelected ? 'font-bold' : ''}`}>{category.name}</span>
        </div>

        {hasChildren && (
          <button
            onClick={handleToggle}
            className={`p-1 rounded-md hover:bg-gray-200 transition-colors ${isSelected ? 'text-rose-600' : 'text-gray-400'}`}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.children.map(child => (
            <CategorySidebarItem
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              onSelect={onSelect}
              selectedCategoryFamily={selectedCategoryFamily}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-4 animate-pulse shadow-sm">
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
};

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { products, frontendProducts, categories, searchQuery, brands, reviews, loading, isStoreLoaded } = useStore();
  const sourceProducts = frontendProducts || products;
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const selectedCategory = searchParams.get('category') || 'All';
  const currentOrderBy = searchParams.get('orderby') || (searchParams.get('search') ? 'relevance' : 'default');

  // Derived state from URL
  const selectedBrands = useMemo(() => {
    const brandsParam = searchParams.get('brands') || searchParams.get('brand') || searchParams.get('attr_Brands');
    return brandsParam ? brandsParam.split(',').filter(Boolean) as string[] : [];
  }, [searchParams]);
  const selectedMinRating = searchParams.get('rating') ? Number(searchParams.get('rating')) : null;
  const selectedAttributes = useMemo(() => {
    const attrs: Record<string, string[]> = {};
    searchParams.forEach((val: string, key: string) => {
      if (key.startsWith('attr_')) {
        attrs[key.substring(5)] = val.split(',').filter(Boolean);
      }
    });
    return attrs;
  }, [searchParams]);

  // Helper to update URL params cleanly
  const updateUrlParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    }, { replace: true });
  };

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Helper to find all descendant category names for a given parent name
  const selectedCategoryFamily = useMemo(() => {
    if (selectedCategory === 'All') return [];

    const targetCat = findCategoryBySlugOrName(categories, selectedCategory);
    if (!targetCat) return [selectedCategory];

    const family = getCategoryFamily(categories, targetCat).allCategories.map(c => c.name);

    // Add ancestors
    let curr: Category | undefined = targetCat;
    while (curr && curr.parentId) {
      const parent = categories.find(c => String(c.id) === String(curr!.parentId));
      if (parent) {
        family.push(parent.name);
        curr = parent;
      } else {
        break;
      }
    }

    return family;
  }, [selectedCategory, categories]);

  // Sync URL category param with state (Now derived directly, so no need for useEffect)

  // Get all descendant categories for filtering products
  const categoryProducts = useMemo(() => {
    if (selectedCategory === 'All') return sourceProducts;

    const targetCat = findCategoryBySlugOrName(categories, selectedCategory);
    if (!targetCat) {
      const clean = cleanCategoryString(selectedCategory);
      return sourceProducts.filter(p => {
        const cats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
        return cats.some(c => cleanCategoryString(String(c)) === clean);
      });
    }

    const family = getCategoryFamily(categories, targetCat);
    return sourceProducts.filter(p => isProductInCategory(p, family, targetCat));
  }, [sourceProducts, categories, selectedCategory]);

  // Price Range Logic
  const [minMax, setMinMax] = useState<[number, number]>([0, 10000]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // Initialize price range based on current category products and URL
  useEffect(() => {
    if (categoryProducts.length > 0) {
      const prices = categoryProducts.map(p => p.price);
      const min = Math.floor(Math.min(...prices));
      const max = Math.ceil(Math.max(...prices));
      setMinMax([min, max]);
      
      const minParam = searchParams.get('minPrice');
      const maxParam = searchParams.get('maxPrice');
      if (!minParam && !maxParam) {
        setPriceRange([min, max]); // Initialize selection to active category range only if no URL params
      }
    } else {
      setMinMax([0, 10000]);
      if (!searchParams.get('minPrice') && !searchParams.get('maxPrice')) {
        setPriceRange([0, 10000]);
      }
    }
  }, [categoryProducts]);

  // Sync priceRange from URL if it changes (e.g. back navigation)
  useEffect(() => {
    const minParam = searchParams.get('minPrice');
    const maxParam = searchParams.get('maxPrice');
    if (minParam || maxParam) {
      setPriceRange([
        minParam ? Number(minParam) : minMax[0],
        maxParam ? Number(maxParam) : minMax[1]
      ]);
    }
  }, [searchParams, minMax]);

  // Debounced URL update for priceRange
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only update URL if price range differs from minMax default
      if (priceRange[0] !== minMax[0] || priceRange[1] !== minMax[1]) {
        updateUrlParams({ minPrice: priceRange[0].toString(), maxPrice: priceRange[1].toString() });
      } else {
        updateUrlParams({ minPrice: null, maxPrice: null });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [priceRange, minMax]);

  // Reset attributes and brands when category changes to avoid stale filters
  useEffect(() => {
    // Only reset if category ACTUALLY changed to a new value in URL, but wait,
    // since we're using URL state, let's reset them by clearing the params.
    // However, if we're on load and URL already has brands + category, we shouldn't wipe them.
    // Instead of auto-wiping on category change here, we will wipe them when the user CLICKS a category!
  }, [selectedCategory]);

  // Available attributes for filter sidebar inside selected category
  const availableAttributes = useMemo(() => {
    const attrs: Record<string, Set<string>> = {};
    categoryProducts.forEach(p => {
      // Collect from variants
      if (p.variants) {
        p.variants.forEach(v => {
          Object.entries(v.attributeValues).forEach(([key, val]) => {
            if (!attrs[key]) attrs[key] = new Set();
            attrs[key].add(val);
          });
        });
      }
      // Also collect from filterAttributes (attributes without variants)
      if (p.filterAttributes) {
        p.filterAttributes.forEach(fa => {
          if (!attrs[fa.name]) attrs[fa.name] = new Set();
          fa.options.forEach(opt => attrs[fa.name].add(opt));
        });
      }
    });

    return Object.entries(attrs).reduce((acc, [key, valSet]) => {
      acc[key] = Array.from(valSet).sort();
      return acc;
    }, {} as Record<string, string[]>);
  }, [categoryProducts]);

  // Compute available brands based on the active category products
  const availableBrands = useMemo(() => {
    const activeBrandNames = new Set(
      categoryProducts
        .map(p => p.brand)
        .filter((b): b is string => !!b)
    );
    return brands.filter(brand => activeBrandNames.has(brand.name));
  }, [brands, categoryProducts]);

  const toggleAttribute = (attrName: string, value: string) => {
    const currentValues = selectedAttributes[attrName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateUrlParams({ [`attr_${attrName}`]: newValues.length > 0 ? newValues.join(',') : null });
    setIsFilterOpen(false);
  };

  const searchParamVal = (searchParams.get('search') || searchParams.get('q') || searchQuery || '').trim();

  // Compute word-sensitive search scores for all products in category
  const searchScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!searchParamVal) return map;
    for (const p of categoryProducts) {
      const res = scoreProductSearch(p, searchParamVal);
      if (res.matches) {
        map.set(p.id, res.score);
      }
    }
    return map;
  }, [categoryProducts, searchParamVal]);

  const filteredProducts = useMemo(() => {
    const showSaleOnly = searchParams.get('filter') === 'sale';

    return categoryProducts.filter(p => {
      const searchMatch = !searchParamVal || searchScoreMap.has(p.id);

      const brandMatch = selectedBrands.length === 0 || selectedBrands.some(b => {
        const lowerB = b.toLowerCase();
        return (
          (p.brand && p.brand.toLowerCase() === lowerB) ||
          p.name.toLowerCase().includes(lowerB) ||
          p.description.toLowerCase().includes(lowerB) ||
          (p.filterAttributes && p.filterAttributes.some(fa => fa.name.toLowerCase().includes('brand') && fa.options.some(opt => opt.toLowerCase() === lowerB))) ||
          (p.variants && p.variants.some(v => Object.entries(v.attributeValues).some(([k, val]) => k.toLowerCase().includes('brand') && val.toLowerCase() === lowerB)))
        );
      });

      let ratingMatch = true;
      if (selectedMinRating !== null) {
        const prodReviews = reviews.filter(r => r.productId === p.id);
        const avg = prodReviews.length > 0 ? prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length : 0;
        ratingMatch = avg >= selectedMinRating;
      }

      const saleMatch = !showSaleOnly || (p.originalPrice !== undefined && p.originalPrice > p.price);

      // Price Match Logic
      const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1];

      // Attribute Match Logic - checks both variants and filterAttributes
      const attributeMatch = Object.entries(selectedAttributes).every(([attrName, selectedValues]) => {
        // Check in variants first
        if (p.variants && p.variants.some(v =>
          v.attributeValues[attrName] && selectedValues.includes(v.attributeValues[attrName])
        )) return true;
        // Check in filterAttributes (attributes without variants)
        if (p.filterAttributes) {
          const fa = p.filterAttributes.find(a => a.name === attrName);
          if (fa && fa.options.some(opt => selectedValues.includes(opt))) return true;
        }
        return false;
      });

      return searchMatch && brandMatch && ratingMatch && saleMatch && attributeMatch && priceMatch;
    });
  }, [categoryProducts, searchParamVal, searchScoreMap, selectedBrands, selectedMinRating, reviews, selectedAttributes, priceRange]);

  const sortedProducts = useMemo(() => {
    const order = currentOrderBy || 'default';

    // If there is an active search query and sorting by default/relevance, sort by relevance score descending
    if (searchParamVal && (order === 'default' || order === 'relevance')) {
      return [...filteredProducts].sort((a, b) => {
        const scoreA = searchScoreMap.get(a.id) || 0;
        const scoreB = searchScoreMap.get(b.id) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      });
    }

    const sorted = [...filteredProducts].sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : Number(a.price) || 0;
      const priceB = typeof b.price === 'number' ? b.price : Number(b.price) || 0;
      const pA = isNaN(priceA) ? 0 : priceA;
      const pB = isNaN(priceB) ? 0 : priceB;

      if (order === 'price-desc') return pA < pB ? 1 : (pA > pB ? -1 : 0);
      if (order === 'price' || order === 'default') return pA < pB ? -1 : (pA > pB ? 1 : 0);
      
      if (order === 'rating') {
        const avgA = reviews.filter(r => r.productId === a.id).reduce((sum, r, _, arr) => sum + r.rating / arr.length, 0);
        const avgB = reviews.filter(r => r.productId === b.id).reduce((sum, r, _, arr) => sum + r.rating / arr.length, 0);
        return avgA < avgB ? 1 : (avgA > avgB ? -1 : 0);
      }
      if (order === 'date') {
        const dateA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
        const dateB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
        return dateA < dateB ? 1 : (dateA > dateB ? -1 : 0);
      }
      return pA < pB ? -1 : (pA > pB ? 1 : 0); // Default: Price Low to High
    });
    
    return sorted;
  }, [filteredProducts, currentOrderBy, reviews, searchParamVal, searchScoreMap]);

  useEffect(() => {
    setVisibleCount(12);
  }, [filteredProducts, currentOrderBy]);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < sortedProducts.length) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + 12);
          setIsLoadingMore(false);
        }, 500);
      }
    }, { rootMargin: "400px" });

    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, visibleCount, sortedProducts.length]);

  const productsToShow = useMemo(() => {
    return sortedProducts.slice(0, visibleCount);
  }, [sortedProducts, visibleCount]);


  const toggleBrand = (brandName: string) => {
    const newBrands = selectedBrands.includes(brandName) 
      ? selectedBrands.filter((b: string) => b !== brandName) 
      : [...selectedBrands, brandName];
    updateUrlParams({ brands: newBrands.length > 0 ? newBrands.join(',') : null });
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    const newParams = new URLSearchParams();
    if (selectedCategory !== 'All') {
      newParams.set('category', selectedCategory);
    }
    if (currentOrderBy && currentOrderBy !== 'default') {
       newParams.set('orderby', currentOrderBy);
    }
    setSearchParams(newParams, { replace: true });
    if (products.length > 0) {
      setPriceRange(minMax);
    } else {
      setPriceRange([0, 10000]);
    }
  };

  if ((loading || !isStoreLoaded) && products.length === 0) {
    return <PageSkeleton type="products" />;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Filters */}
          <aside className="hidden lg:block lg:w-72 shrink-0 sticky top-[120px] self-start">
            <div 
              data-lenis-prevent
              className="max-h-[calc(100vh-160px)] overflow-y-auto pr-2 space-y-8"
            >
              {/* Category Filter */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Filter size={18} className="text-rose-500" />
                  Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => navigate('/products')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'All' ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Categories
                  </button>
                  {categoryTree.map(cat => (
                    <CategorySidebarItem
                      key={cat.id}
                      category={cat}
                      selectedCategory={selectedCategory}
                      onSelect={(catName) => {
                         const clickedCat = categories.find(c => c.name === catName);
                         if (clickedCat) {
                           navigate(`/category/${clickedCat.slug || slugify(clickedCat.name)}`);
                         }
                      }}
                      selectedCategoryFamily={selectedCategoryFamily}
                    />
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-rose-500" />
                    Price Range
                  </div>
                  <span className="text-xs font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    ৳{priceRange[0]} - ৳{priceRange[1]}
                  </span>
                </h3>

                <div className="relative h-2 w-full bg-gray-100 rounded-full mb-6">
                  {/* Track Fill */}
                  <div
                    className="absolute h-full bg-rose-500 rounded-full"
                    style={{
                      left: `${((priceRange[0] - minMax[0]) / (minMax[1] - minMax[0])) * 100}%`,
                      right: `${100 - ((priceRange[1] - minMax[0]) / (minMax[1] - minMax[0])) * 100}%`
                    }}
                  ></div>

                  {/* Range Inputs */}
                  <input
                    type="range"
                    min={minMax[0]}
                    max={minMax[1]}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), priceRange[1] - 1);
                      setPriceRange([val, priceRange[1]]);
                    }}
                    className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-rose-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-rose-500 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-pointer outline-none z-30"
                  />
                  <input
                    type="range"
                    min={minMax[0]}
                    max={minMax[1]}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), priceRange[0] + 1);
                      setPriceRange([priceRange[0], val]);
                    }}
                    className="absolute w-full h-full top-0 left-0 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-rose-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-rose-500 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-pointer outline-none z-40"
                  />
                </div>

                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>৳{minMax[0]}</span>
                  <span>৳{minMax[1]}</span>
                </div>
              </div>

              {/* Brand Filter */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-rose-500" />
                  Brands
                </h3>
                <div className="space-y-2">
                  {availableBrands.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No brands found</p>
                  ) : (
                    availableBrands.map(brand => (
                      <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand.name)}
                            onChange={() => toggleBrand(brand.name)}
                            className="peer h-5 w-5 appearance-none rounded border-2 border-gray-200 checked:bg-rose-500 checked:border-rose-500 transition-all"
                          />
                          <Check size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-rose-500 transition-colors">{brand.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Attribute Filter */}
              {Object.entries(availableAttributes).map(([attrName, values]) => (
                <div key={attrName} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-500">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    {attrName}
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {values.map(val => (
                      <label key={val} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedAttributes[attrName]?.includes(val) || false}
                            onChange={() => toggleAttribute(attrName, val)}
                            className="peer h-5 w-5 appearance-none rounded border-2 border-gray-200 checked:bg-rose-500 checked:border-rose-500 transition-all"
                          />
                          <Check size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-rose-500 transition-colors">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Rating Filter */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">Customer Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(stars => (
                    <button
                      key={stars}
                      onClick={() => updateUrlParams({ rating: selectedMinRating === stars ? null : stars.toString() })}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedMinRating === stars ? 'bg-amber-50 text-amber-700' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < stars ? "currentColor" : "none"} className={i < stars ? "" : "text-gray-200"} />
                        ))}
                      </div>
                      <span className="font-medium">& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Action */}
              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-gray-400 hover:text-rose-500 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <RotateCcw size={16} />
                Reset All Filters
              </button>
            </div>
          </aside>

          {/* Product Listing Main Area */}
          <main className="flex-1 space-y-6">
            {/* Desktop Header Layout */}
            <div className="hidden lg:flex bg-white p-4 rounded-2xl border border-gray-100 shadow-sm justify-between items-center gap-4 w-full">
              <p className="text-xs md:text-sm font-medium text-gray-500">
                Showing <span className="font-bold text-gray-800">{filteredProducts.length}</span> results 

                {selectedCategory !== 'All' && <span className="hidden sm:inline"> in <span className="text-rose-500 font-bold">{selectedCategory}</span></span>}
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                  <span className="text-gray-400 font-medium hidden sm:inline">Sort by:</span>
                  <select 
                    value={currentOrderBy}
                    onChange={(e) => {
                      const params = new URLSearchParams(location.search);
                      if (e.target.value === 'default') params.delete('orderby');
                      else params.set('orderby', e.target.value);
                      navigate(`${location.pathname}?${params.toString()}`);
                    }}
                    className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 md:px-3 md:py-1.5 font-bold text-gray-700 outline-none focus:border-rose-500 text-xs md:text-sm"
                  >
                    {searchParamVal && <option value="relevance">Relevance</option>}
                    <option value="default">Default Sorting</option>
                    <option value="price">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Average Rating</option>
                    <option value="date">Newest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Header Layout */}
            <div className="flex lg:hidden bg-white p-4 rounded-2xl border border-gray-100 shadow-sm justify-between items-center gap-3 w-full">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <p className="text-xs font-bold text-gray-500 shrink-0">
                  Showing <span className="text-gray-800 font-black">{filteredProducts.length}</span>
                </p>
                <div className="h-4 w-[1px] bg-gray-200 shrink-0"></div>
                <select 
                  value={currentOrderBy}
                  onChange={(e) => {
                    const params = new URLSearchParams(location.search);
                    if (e.target.value === 'default') params.delete('orderby');
                    else params.set('orderby', e.target.value);
                    navigate(`${location.pathname}?${params.toString()}`);
                  }}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 font-bold text-gray-700 outline-none focus:border-rose-500 text-xs truncate max-w-[130px] flex-1"
                >
                  <option value="default">Default Sorting</option>
                  <option value="price">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Average Rating</option>
                  <option value="date">Newest First</option>
                </select>
              </div>

              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-[#e92c5d] hover:bg-[#c81d4a] text-white px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 shadow-sm"
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
            </div>


            {loading || !isStoreLoaded || sourceProducts.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Search size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 max-w-xs">We couldn't find any products matching your current filters. Try adjusting your selection!</p>
                <button onClick={resetFilters} className="mt-8 bg-rose-500 text-white px-8 py-3 rounded-full font-bold hover:bg-rose-600 transition-all">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {productsToShow.map((product, index) => {
                  const isLastElement = index === productsToShow.length - 1;
                  return (
                    <div
                      ref={isLastElement ? lastElementRef : null}
                      key={product.id}
                      className="product-card-container h-full animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-6"
                    >
                      <ProductCard product={product} className="h-full" />
                    </div>
                  );
                })}
                
                {isLoadingMore && Array.from({ length: 6 }).map((_, idx) => (
                  <ProductCardSkeleton key={`skeleton-${idx}`} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer Filter Overlay */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[200] flex lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsFilterOpen(false)}
          ></div>
          
          {/* Drawer content */}
          <div className="relative flex-grow flex flex-col max-w-xs w-full bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 z-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-rose-500" /> Filters
              </h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-8 pb-10">
              {/* Reset Action */}
              <button
                onClick={() => { resetFilters(); setIsFilterOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider text-gray-400 hover:text-rose-500 bg-white border border-gray-100 rounded-xl shadow-sm transition-all"
              >
                <RotateCcw size={14} />
                Reset All
              </button>

              {/* Category Filter */}
              <div className="space-y-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Filter size={14} className="text-rose-500" /> Categories
                </h3>
                <button
                  onClick={() => navigate('/products')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'All' ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categoryTree.map(cat => (
                  <CategorySidebarItem
                    key={cat.id}
                    category={cat}
                    selectedCategory={selectedCategory}
                     onSelect={(catName) => {
                        const clickedCat = categories.find(c => c.name === catName);
                        if (clickedCat) {
                          navigate(`/category/${clickedCat.slug || slugify(clickedCat.name)}`);
                        }
                     }}
                    selectedCategoryFamily={selectedCategoryFamily}
                  />
                ))}
              </div>

              {/* Price Range Filter */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2"><Coins size={14} className="text-rose-500" /> Price Range</span>
                  <span className="bg-gray-50 px-2 py-0.5 rounded text-[10px] text-rose-600 font-black">
                    ৳{priceRange[0]} - ৳{priceRange[1]}
                  </span>
                </h3>
                <div className="relative h-2 w-full bg-gray-100 rounded-full mb-4">
                  <div
                    className="absolute h-full bg-rose-500 rounded-full"
                    style={{
                      left: `${((priceRange[0] - minMax[0]) / Math.max(1, minMax[1] - minMax[0])) * 100}%`,
                      right: `${100 - ((priceRange[1] - minMax[0]) / Math.max(1, minMax[1] - minMax[0])) * 100}%`
                    }}
                  ></div>
                  <input
                    type="range"
                    min={minMax[0]}
                    max={minMax[1]}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), priceRange[1] - 1);
                      setPriceRange([val, priceRange[1]]);
                    }}
                    className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-rose-500 [&::-webkit-slider-thumb]:appearance-none outline-none z-30"
                  />
                  <input
                    type="range"
                    min={minMax[0]}
                    max={minMax[1]}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), priceRange[0] + 1);
                      setPriceRange([priceRange[0], val]);
                    }}
                    className="absolute w-full h-full top-0 left-0 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-rose-500 [&::-webkit-slider-thumb]:appearance-none outline-none z-40"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>৳{minMax[0]}</span>
                  <span>৳{minMax[1]}</span>
                </div>
              </div>

              {/* Brand Filter */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-rose-500" /> Brands
                </h3>
                <div className="space-y-2">
                  {availableBrands.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">No brands found</p>
                  ) : (
                    availableBrands.map(brand => (
                      <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand.name)}
                            onChange={() => toggleBrand(brand.name)}
                            className="peer h-4.5 w-4.5 appearance-none rounded border-2 border-gray-200 checked:bg-rose-500 checked:border-rose-500 transition-all"
                          />
                          <Check size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{brand.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Attribute Filter */}
              {Object.entries(availableAttributes).map(([attrName, values]) => (
                <div key={attrName} className="space-y-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    {attrName}
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {values.map(val => (
                      <label key={val} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedAttributes[attrName]?.includes(val) || false}
                            onChange={() => toggleAttribute(attrName, val)}
                            className="peer h-4.5 w-4.5 appearance-none rounded border-2 border-gray-200 checked:bg-rose-500 checked:border-rose-500 transition-all"
                          />
                          <Check size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Rating Filter */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Rating</h3>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map(stars => (
                    <button
                      key={stars}
                      onClick={() => { updateUrlParams({ rating: selectedMinRating === stars ? null : stars.toString() }); setIsFilterOpen(false); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${selectedMinRating === stars ? 'bg-amber-50 text-amber-700' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < stars ? "currentColor" : "none"} className={i < stars ? "" : "text-gray-200"} />
                        ))}
                      </div>
                      <span className="font-medium">& Up</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
