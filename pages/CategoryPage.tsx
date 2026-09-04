import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import PageSkeleton from '../components/PageSkeleton';
import { 
  Filter, 
  SlidersHorizontal, 
  ChevronRight, 
  Search, 
  RotateCcw, 
  Check, 
  Star, 
  Home, 
  Grid, 
  X,
  Minus,
  Plus
} from 'lucide-react';
import { Category } from '../types';

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

const getColorHex = (colorName: string): string => {
  const c = colorName.toLowerCase().trim();
  const colorMap: Record<string, string> = {
    black: '#111827',
    white: '#FFFFFF',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#FBBF24',
    pink: '#EC4899',
    purple: '#8B5CF6',
    orange: '#F97316',
    gray: '#6B7280',
    grey: '#6B7280',
    navy: '#1E3A8A',
    brown: '#78350F',
    beige: '#F5F5DC',
    maroon: '#800000',
    gold: '#FFD700',
    silver: '#C0C0C0',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    violet: '#7C3AED',
    rose: '#F43F5E',
    coral: '#FF7F50',
    cream: '#FFFDD0',
    khaki: '#F0E68C',
    olive: '#808000',
    charcoal: '#36454F',
    magenta: '#D946EF',
    indigo: '#6366F1'
  };
  return colorMap[c] || '#E5E7EB';
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

const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { products, frontendProducts, categories, reviews, loading, isStoreLoaded } = useStore();
  const sourceProducts = frontendProducts || products;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentOrderBy = searchParams.get('orderby') || 'price';

  // Toggle collapsible section
  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
  
  // Find current category
  const currentCategory = useMemo(() => {
    if (!categorySlug) return null;
    const cleanSlug = decodeURIComponent(categorySlug).toLowerCase().trim().replace(/&amp;/g, '&');
    return categories.find(c => {
      const cSlug = (c.slug || '').toLowerCase().trim();
      const cName = c.name.toLowerCase().trim().replace(/&amp;/g, '&');
      return (
        cSlug === cleanSlug || 
        cName === cleanSlug ||
        encodeURIComponent(c.name).toLowerCase() === cleanSlug ||
        (cleanSlug === 'gear-travel' && (cSlug === 'gear-travel' || cName === 'gear & travel')) ||
        (cleanSlug === 'baby-stationery' && (cSlug === 'baby-stationery' || cName === 'stationery')) ||
        (cleanSlug === 'stationery' && (cSlug === 'baby-stationery' || cName === 'stationery')) ||
        (cleanSlug === 'baby-care-hygiene' && (cSlug === 'baby-care-hygiene' || cName === 'care & hygiene'))
      );
    });
  }, [categorySlug, categories]);

  // Set page title for SEO
  useEffect(() => {
    if (currentCategory) {
      document.title = `${currentCategory.name} | Kids Paradise`;
    } else {
      document.title = 'Category | Kids Paradise';
    }

    return () => {
      document.title = 'Kids Paradise - A Branded Dream World for your Children';
    };
  }, [currentCategory]);

  // Derived state from URL
  const selectedAvailability = searchParams.get('availability');
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

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [minMax, setMinMax] = useState<[number, number]>([0, 10000]);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Helper to find all descendants of the current category (to include child category products)
  const descendantCategories = useMemo(() => {
    if (!currentCategory) return [];

    const getDescendants = (catId: string): Category[] => {
      let result: Category[] = [];
      const children = categories.filter(c => c.parentId == catId);
      children.forEach(child => {
        result.push(child);
        result = [...result, ...getDescendants(child.id)];
      });
      return result;
    };

    return [currentCategory, ...getDescendants(currentCategory.id)];
  }, [currentCategory, categories]);

  // Filter products that belong to the active category family
  const categoryProducts = useMemo(() => {
    if (!currentCategory) return [];

    const targetNames = new Set(
      descendantCategories.flatMap(c => {
        const n = c.name.replace(/&amp;/g, '&').toLowerCase().trim();
        const s = (c.slug || '').toLowerCase().trim();
        const list = [n, s];
        if (n === 'stationery' || s === 'baby-stationery') list.push('baby stationery', 'stationery');
        if (n === 'care & hygiene' || s === 'baby-care-hygiene') list.push('baby care & hygiene', 'care & hygiene', 'baby care and hygiene');
        if (n === 'gear & travel' || s === 'gear-travel') list.push('gear & travel', 'gear &amp; travel', 'gear and travel');
        if (n === 'furniture & bedding' || s === 'furniture-bedding') list.push('furniture & bedding', 'furniture &amp; bedding', 'furniture and bedding');
        if (n === 'apparels' || s === 'apparels') list.push("boy's fashion", "girl's fashion", "baby's fashion", 'apparels');
        return list;
      })
    );

    return sourceProducts.filter(p => {
      const prodCats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
      return prodCats.some(cat => {
        const cleanCat = String(cat).replace(/&amp;/g, '&').toLowerCase().trim();
        return targetNames.has(cleanCat);
      });
    });
  }, [sourceProducts, descendantCategories, currentCategory]);

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
        setPriceRange([min, max]);
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
      if (priceRange[0] !== minMax[0] || priceRange[1] !== minMax[1]) {
        updateUrlParams({ minPrice: priceRange[0].toString(), maxPrice: priceRange[1].toString() });
      } else {
        updateUrlParams({ minPrice: null, maxPrice: null });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [priceRange, minMax]);

  // Build category tree inside the active category to display subcategory navigation
  const subcategoryTree = useMemo(() => {
    if (!currentCategory) return [];
    return buildCategoryTree(categories, currentCategory.id);
  }, [categories, currentCategory]);

  // Get active parent ancestors for breadcrumb trail
  const breadcrumbs = useMemo(() => {
    if (!currentCategory) return [];
    const trail: Category[] = [currentCategory];
    let parentId = currentCategory.parentId;

    while (parentId) {
      const parent = categories.find(c => c.id === parentId);
      if (parent) {
        trail.unshift(parent);
        parentId = parent.parentId;
      } else {
        break;
      }
    }
    return trail;
  }, [currentCategory, categories]);

  // Extract all available attributes (Brands, Color, Size, etc.)
  const availableAttributes = useMemo(() => {
    const attrs: Record<string, Set<string>> = {};
    categoryProducts.forEach(p => {
      // If product has brand field, add to Brands attribute
      if (p.brand && p.brand.trim()) {
        const brandKey = 'Brand';
        if (!attrs[brandKey]) attrs[brandKey] = new Set();
        attrs[brandKey].add(p.brand.trim());
      }
      // Collect from variants
      if (p.variants) {
        p.variants.forEach(v => {
          if (v.attributeValues) {
            Object.entries(v.attributeValues).forEach(([key, val]) => {
              if (val && val.trim()) {
                const normKey = key.trim();
                if (!attrs[normKey]) attrs[normKey] = new Set();
                attrs[normKey].add(val.trim());
              }
            });
          }
        });
      }
      // Also collect from filterAttributes (attributes without variants)
      if (p.filterAttributes) {
        p.filterAttributes.forEach(fa => {
          if (fa.name && fa.options) {
            const normKey = fa.name.trim();
            if (!attrs[normKey]) attrs[normKey] = new Set();
            fa.options.forEach(opt => {
              if (opt && opt.trim()) attrs[normKey].add(opt.trim());
            });
          }
        });
      }
    });

    return Object.entries(attrs).reduce((acc, [key, valSet]) => {
      acc[key] = Array.from(valSet).sort((a, b) => a.localeCompare(b));
      return acc;
    }, {} as Record<string, string[]>);
  }, [categoryProducts]);

  // Availability counts
  const inStockCount = useMemo(() => {
    return categoryProducts.filter(p => {
      if (p.variants && p.variants.length > 0) {
        return p.variants.some(v => v.stock > 0);
      }
      return p.stock === undefined || p.stock > 0;
    }).length;
  }, [categoryProducts]);

  const outOfStockCount = useMemo(() => {
    return categoryProducts.filter(p => {
      if (p.variants && p.variants.length > 0) {
        return p.variants.every(v => v.stock <= 0);
      }
      return p.stock !== undefined && p.stock <= 0;
    }).length;
  }, [categoryProducts]);

  // Subcategory counts
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    subcategoryTree.forEach(sub => {
      const cleanSubName = sub.name.replace(/&amp;/g, '&').toLowerCase().trim();
      const cleanSubSlug = (sub.slug || '').toLowerCase().trim();
      counts[sub.id] = categoryProducts.filter(p => {
        const prodCats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
        return prodCats.some(cat => {
          const c = String(cat).replace(/&amp;/g, '&').toLowerCase().trim();
          return c === cleanSubName || c === cleanSubSlug;
        });
      }).length;
    });
    return counts;
  }, [subcategoryTree, categoryProducts]);

  // Attribute option count helper
  const getAttributeCount = useCallback((attrName: string, value: string): number => {
    const cleanVal = value.toLowerCase().trim();
    return categoryProducts.filter(p => {
      if ((attrName.toLowerCase() === 'brand' || attrName.toLowerCase() === 'brands') && p.brand && p.brand.toLowerCase().trim() === cleanVal) {
        return true;
      }
      if (p.variants && p.variants.some(v => v.attributeValues && Object.entries(v.attributeValues).some(([k, vVal]) => k.toLowerCase() === attrName.toLowerCase() && vVal.toLowerCase().trim() === cleanVal))) {
        return true;
      }
      if (p.filterAttributes && p.filterAttributes.some(fa => fa.name.toLowerCase() === attrName.toLowerCase() && fa.options.some(opt => opt.toLowerCase().trim() === cleanVal))) {
        return true;
      }
      return false;
    }).length;
  }, [categoryProducts]);

  const toggleAttribute = (attrName: string, value: string) => {
    const currentValues = selectedAttributes[attrName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    updateUrlParams({ [`attr_${attrName}`]: newValues.length > 0 ? newValues.join(',') : null });
  };

  const toggleAvailability = (type: 'in-stock' | 'out-of-stock') => {
    if (selectedAvailability === type) {
      updateUrlParams({ availability: null });
    } else {
      updateUrlParams({ availability: type });
    }
  };

  // Main Filtered Products list
  const filteredProducts = useMemo(() => {
    const showSaleOnly = searchParams.get('filter') === 'sale';
    return categoryProducts.filter(p => {
      // Availability filter
      if (selectedAvailability === 'in-stock') {
        const inStock = p.variants && p.variants.length > 0
          ? p.variants.some(v => v.stock > 0)
          : (p.stock === undefined || p.stock > 0);
        if (!inStock) return false;
      } else if (selectedAvailability === 'out-of-stock') {
        const outOfStock = p.variants && p.variants.length > 0
          ? p.variants.every(v => v.stock <= 0)
          : (p.stock !== undefined && p.stock <= 0);
        if (!outOfStock) return false;
      }

      // Rating filter
      if (selectedMinRating !== null) {
        const prodReviews = reviews.filter(r => r.productId === p.id);
        const avg = prodReviews.length > 0 ? prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length : 0;
        if (avg < selectedMinRating) return false;
      }

      // Price filter
      if (p.price < priceRange[0] || p.price > priceRange[1]) {
        return false;
      }

      // Attributes filter (including Brands, Color, Size, etc.)
      const attributeMatch = Object.entries(selectedAttributes).every(([attrName, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) return true;
        const normAttrName = attrName.toLowerCase();
        
        // Brand check
        if ((normAttrName === 'brand' || normAttrName === 'brands') && p.brand && selectedValues.some(sv => sv.toLowerCase() === p.brand?.toLowerCase())) {
          return true;
        }

        // Check in variants
        if (p.variants && p.variants.some(v => {
          if (!v.attributeValues) return false;
          return Object.entries(v.attributeValues).some(([k, vVal]) => {
            if (k.toLowerCase() === normAttrName || ((normAttrName === 'brand' || normAttrName === 'brands') && (k.toLowerCase() === 'brand' || k.toLowerCase() === 'brands'))) {
              return selectedValues.some(sv => sv.toLowerCase() === vVal.toLowerCase());
            }
            return false;
          });
        })) return true;

        // Check in filterAttributes
        if (p.filterAttributes) {
          const fa = p.filterAttributes.find(a => 
            a.name.toLowerCase() === normAttrName ||
            ((normAttrName === 'brand' || normAttrName === 'brands') && (a.name.toLowerCase() === 'brand' || a.name.toLowerCase() === 'brands'))
          );
          if (fa && fa.options.some(opt => selectedValues.some(sv => sv.toLowerCase() === opt.toLowerCase()))) return true;
        }

        return false;
      });

      if (!attributeMatch) return false;

      const saleMatch = !showSaleOnly || (p.originalPrice !== undefined && p.originalPrice > p.price);
      return saleMatch;
    });
  }, [categoryProducts, selectedAvailability, selectedMinRating, reviews, priceRange, selectedAttributes, searchParams]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts].sort((a, b) => {
      const order = currentOrderBy || 'price';
      
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
  }, [filteredProducts, currentOrderBy, reviews]);

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

  const resetFilters = () => {
    const newParams = new URLSearchParams();
    if (currentOrderBy && currentOrderBy !== 'default') {
       newParams.set('orderby', currentOrderBy);
    }
    setSearchParams(newParams, { replace: true });
    
    if (categoryProducts.length > 0) {
      setPriceRange(minMax);
    } else {
      setPriceRange([0, 10000]);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedAvailability) count++;
    if (selectedMinRating !== null) count++;
    if (priceRange[0] !== minMax[0] || priceRange[1] !== minMax[1]) count++;
    Object.values(selectedAttributes).forEach(v => { count += v.length; });
    return count;
  }, [selectedAvailability, selectedMinRating, priceRange, minMax, selectedAttributes]);

  if ((loading || !isStoreLoaded) && (products.length === 0 || categories.length === 0)) {
    return <PageSkeleton type="category" />;
  }

  if (!currentCategory) {
    if (!isStoreLoaded || loading || categories.length === 0) {
      return <PageSkeleton type="category" />;
    }
    return (
      <div className="bg-gray-50 min-h-screen py-20 flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-rose-50 text-[#F0264C] rounded-full flex items-center justify-center mx-auto mb-6">
            <Grid size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Category Not Found</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">The category you are looking for does not exist or has been moved.</p>
          <Link to="/" className="inline-block bg-[#F0264C] hover:bg-[#d01c3f] text-white px-8 py-3 rounded-full font-bold transition-all shadow-md">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Common Filter Content Component for Desktop Sidebar & Mobile Drawer
  const renderFilterSections = (isMobile: boolean = false) => {
    return (
      <div className="divide-y divide-gray-200">
        
        {/* 1. Availability Filter */}
        <div className="py-4">
          <div 
            onClick={() => toggleSection('availability')}
            className="flex items-center justify-between cursor-pointer select-none text-[#1d293f] font-bold text-sm tracking-tight hover:text-[#F0264C] transition-colors"
          >
            <span>Availability</span>
            {collapsedSections['availability'] ? (
              <Plus size={16} className="text-gray-600" />
            ) : (
              <Minus size={16} className="text-gray-600" />
            )}
          </div>

          {!collapsedSections['availability'] && (
            <div className="pt-3 space-y-2.5">
              {/* In stock */}
              <label 
                className="flex items-center justify-between cursor-pointer select-none group"
                onClick={() => {
                  toggleAvailability('in-stock');
                  if (isMobile) setIsFilterOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedAvailability === 'in-stock'}
                      onChange={() => {}}
                      className="peer sr-only"
                    />
                    <div className={`w-4.5 h-4.5 rounded-[4px] border flex items-center justify-center transition-all ${
                      selectedAvailability === 'in-stock' 
                        ? 'bg-[#F0264C] border-[#F0264C]' 
                        : 'bg-gray-100 border-gray-200 group-hover:border-gray-300'
                    }`}>
                      {selectedAvailability === 'in-stock' && (
                        <Check size={12} strokeWidth={3} className="text-white" />
                      )}
                    </div>
                  </div>
                  <span className={`text-[13px] transition-colors ${
                    selectedAvailability === 'in-stock' 
                      ? 'text-[#F0264C] font-bold' 
                      : 'text-gray-700 font-medium group-hover:text-[#F0264C]'
                  }`}>
                    In stock
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{inStockCount}</span>
              </label>

              {/* Out of stock */}
              <label 
                className="flex items-center justify-between cursor-pointer select-none group"
                onClick={() => {
                  toggleAvailability('out-of-stock');
                  if (isMobile) setIsFilterOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedAvailability === 'out-of-stock'}
                      onChange={() => {}}
                      className="peer sr-only"
                    />
                    <div className={`w-4.5 h-4.5 rounded-[4px] border flex items-center justify-center transition-all ${
                      selectedAvailability === 'out-of-stock' 
                        ? 'bg-[#F0264C] border-[#F0264C]' 
                        : 'bg-gray-100 border-gray-200 group-hover:border-gray-300'
                    }`}>
                      {selectedAvailability === 'out-of-stock' && (
                        <Check size={12} strokeWidth={3} className="text-white" />
                      )}
                    </div>
                  </div>
                  <span className={`text-[13px] transition-colors ${
                    selectedAvailability === 'out-of-stock' 
                      ? 'text-[#F0264C] font-bold' 
                      : 'text-gray-400 font-medium group-hover:text-[#F0264C]'
                  }`}>
                    Out of stock
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{outOfStockCount}</span>
              </label>
            </div>
          )}
        </div>

        {/* 2. Subcategory Filter (if applicable) */}
        {subcategoryTree.length > 0 && (
          <div className="py-4">
            <div 
              onClick={() => toggleSection('category')}
              className="flex items-center justify-between cursor-pointer select-none text-[#1d293f] font-bold text-sm tracking-tight hover:text-[#F0264C] transition-colors"
            >
              <span>Category</span>
              {collapsedSections['category'] ? (
                <Plus size={16} className="text-gray-600" />
              ) : (
                <Minus size={16} className="text-gray-600" />
              )}
            </div>

            {!collapsedSections['category'] && (
              <div data-lenis-prevent="true" className="pt-3 space-y-2 max-h-52 overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
                {subcategoryTree.map(sub => {
                  const count = subcategoryCounts[sub.id] || 0;
                  return (
                    <Link
                      key={sub.id}
                      to={`/category/${sub.slug || encodeURIComponent(sub.name)}`}
                      onClick={() => isMobile && setIsFilterOpen(false)}
                      className="flex items-center justify-between cursor-pointer select-none group py-1 px-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-[4px] border border-gray-300 bg-gray-100 group-hover:border-[#F0264C] flex items-center justify-center transition-all"></div>
                        <span className="text-[13px] text-gray-700 font-medium group-hover:text-[#F0264C] transition-colors truncate max-w-[180px]">
                          {sub.name.replace(/&amp;/g, '&')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{count}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Attributes (Brands, Color, Size, Product Type, etc.) */}
        {Object.entries(availableAttributes).map(([attrName, values]) => {
          const isColor = attrName.toLowerCase() === 'color' || attrName.toLowerCase() === 'colors';
          const isBrand = attrName.toLowerCase() === 'brand' || attrName.toLowerCase() === 'brands';
          const title = isBrand ? 'Brand' : attrName;
          const isCollapsed = collapsedSections[attrName];

          return (
            <div key={attrName} className="py-4">
              <div 
                onClick={() => toggleSection(attrName)}
                className="flex items-center justify-between cursor-pointer select-none text-[#1d293f] font-bold text-sm tracking-tight hover:text-[#F0264C] transition-colors"
              >
                <span>{title}</span>
                {isCollapsed ? (
                  <Plus size={16} className="text-gray-600" />
                ) : (
                  <Minus size={16} className="text-gray-600" />
                )}
              </div>

              {!isCollapsed && (
                <div className="pt-3">
                  {isColor ? (
                    /* Color Swatches matching Reference Image */
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {values.map(val => {
                        const isChecked = selectedAttributes[attrName]?.includes(val) || false;
                        const hex = getColorHex(val);
                        const isLight = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fffdd0' || hex.toLowerCase() === '#f5f5dc';

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              toggleAttribute(attrName, val);
                              if (isMobile) setIsFilterOpen(false);
                            }}
                            title={val}
                            style={{ backgroundColor: hex }}
                            className={`w-7 h-7 rounded-lg border transition-all relative flex items-center justify-center shadow-2xs hover:scale-110 cursor-pointer ${
                              isLight ? 'border-gray-300' : 'border-black/10'
                            } ${
                              isChecked ? 'ring-2 ring-offset-2 ring-[#F0264C]' : ''
                            }`}
                          >
                            {isChecked && (
                              <Check size={13} strokeWidth={3} className={isLight ? 'text-gray-800' : 'text-white'} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Standard Checkbox List with Lenis Prevent Scrolling */
                    <div data-lenis-prevent="true" className="space-y-2 max-h-52 overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
                      {values.map(val => {
                        const isChecked = selectedAttributes[attrName]?.includes(val) || false;
                        const count = getAttributeCount(attrName, val);

                        return (
                          <label 
                            key={val}
                            className="flex items-center justify-between cursor-pointer select-none group py-1 px-1 rounded hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              toggleAttribute(attrName, val);
                              if (isMobile) setIsFilterOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="peer sr-only"
                                />
                                <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
                                  isChecked 
                                    ? 'bg-[#F0264C] border-[#F0264C]' 
                                    : 'bg-gray-100 border-gray-300 group-hover:border-gray-400'
                                }`}>
                                  {isChecked && (
                                    <Check size={11} strokeWidth={3} className="text-white" />
                                  )}
                                </div>
                              </div>
                              <span className={`text-[13px] transition-colors truncate max-w-[180px] ${
                                isChecked 
                                  ? 'text-[#F0264C] font-bold' 
                                  : 'text-gray-700 font-medium group-hover:text-[#F0264C]'
                              }`}>
                                {val}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{count}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 4. Price Filter */}
        <div className="py-4">
          <div 
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between cursor-pointer select-none text-[#1d293f] font-bold text-sm tracking-tight hover:text-[#F0264C] transition-colors"
          >
            <span>Price</span>
            {collapsedSections['price'] ? (
              <Plus size={16} className="text-gray-600" />
            ) : (
              <Minus size={16} className="text-gray-600" />
            )}
          </div>

          {!collapsedSections['price'] && (
            <div className="pt-3 space-y-3">
              <p className="text-xs text-gray-500 font-medium">
                The highest price is ৳{minMax[1].toLocaleString()}
              </p>

              {/* Price Range Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">৳</span>
                  <input
                    type="number"
                    placeholder="From"
                    value={priceRange[0]}
                    min={minMax[0]}
                    max={priceRange[1]}
                    onChange={(e) => {
                      const val = Math.max(minMax[0], Math.min(Number(e.target.value), priceRange[1]));
                      setPriceRange([val, priceRange[1]]);
                    }}
                    className="w-full pl-6 pr-2 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-[#F0264C] focus:bg-white transition-all font-semibold"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">৳</span>
                  <input
                    type="number"
                    placeholder="To"
                    value={priceRange[1]}
                    min={priceRange[0]}
                    max={minMax[1]}
                    onChange={(e) => {
                      const val = Math.min(minMax[1], Math.max(Number(e.target.value), priceRange[0]));
                      setPriceRange([priceRange[0], val]);
                    }}
                    className="w-full pl-6 pr-2 py-2 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-[#F0264C] focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Range Slider Track */}
              <div className="relative h-1.5 w-full bg-gray-200 rounded-full my-3">
                <div
                  className="absolute h-full bg-[#F0264C] rounded-full"
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
                  className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#F0264C] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer outline-none z-30"
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
                  className="absolute w-full h-full top-0 left-0 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#F0264C] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer outline-none z-40"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Rating Filter */}
        <div className="py-4">
          <div 
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between cursor-pointer select-none text-[#1d293f] font-bold text-sm tracking-tight hover:text-[#F0264C] transition-colors"
          >
            <span>Customer Rating</span>
            {collapsedSections['rating'] ? (
              <Plus size={16} className="text-gray-600" />
            ) : (
              <Minus size={16} className="text-gray-600" />
            )}
          </div>

          {!collapsedSections['rating'] && (
            <div className="pt-3 space-y-2">
              {[4, 3, 2, 1].map(stars => (
                <button
                  key={stars}
                  onClick={() => {
                    updateUrlParams({ rating: selectedMinRating === stars ? null : stars.toString() });
                    if (isMobile) setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    selectedMinRating === stars 
                      ? 'bg-rose-50 text-[#F0264C] font-bold' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill={i < stars ? "currentColor" : "none"} className={i < stars ? "" : "text-gray-200"} />
                      ))}
                    </div>
                    <span className="font-medium">& Up</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      
      {/* Clean Top Header & Breadcrumb Bar (No Large Banner) */}
      <div className="bg-white border-b border-gray-200/80 py-4 mb-6 shadow-2xs">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Breadcrumb Trail */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-500">
              <Link to="/" className="hover:text-[#F0264C] transition-colors flex items-center gap-1">
                <Home size={13} /> Home
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight size={12} className="text-gray-400" />
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="text-[#F0264C] font-bold">{crumb.name.replace(/&amp;/g, '&')}</span>
                  ) : (
                    <Link to={`/category/${crumb.slug || encodeURIComponent(crumb.name)}`} className="hover:text-[#F0264C] transition-colors">
                      {crumb.name.replace(/&amp;/g, '&')}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Product count summary */}
            <div className="text-xs text-gray-500">
              Showing <span className="font-bold text-[#1d293f]">{filteredProducts.length}</span> products
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-2xl md:text-3xl font-black text-[#1d293f] tracking-tight">
              {currentCategory.name.replace(/&amp;/g, '&')}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-8">

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Desktop Sidebar Filters (Exact Layout of Reference Image 2) */}
          <aside className="hidden lg:block lg:w-64 space-y-4 shrink-0">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
              
              {/* Header Title with Reset Action */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
                <h3 className="font-extrabold text-base text-[#1d293f] flex items-center gap-2">
                  <Filter size={16} className="text-[#F0264C]" />
                  Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-[#F0264C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    Reset
                  </button>
                )}
              </div>

              {/* Accordion Filter Sections */}
              {renderFilterSections(false)}

              {/* Full Reset Button at bottom */}
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="w-full mt-4 py-2.5 text-xs font-bold text-[#F0264C] bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Clear All Filters ({activeFilterCount})
                </button>
              )}
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="flex-1 space-y-6">
            
            {/* Desktop Top Sorting Bar */}
            <div className="hidden lg:flex bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs justify-between items-center gap-4 w-full">
              <p className="text-xs md:text-sm font-medium text-gray-600">
                Found <span className="font-bold text-[#1d293f]">{filteredProducts.length}</span> items in <span className="text-[#F0264C] font-bold">{currentCategory?.name.replace(/&amp;/g, '&')}</span>
              </p>
              
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-medium text-xs">Sort by:</span>
                <select 
                  value={currentOrderBy}
                  onChange={(e) => {
                    const params = new URLSearchParams(location.search);
                    if (e.target.value === 'default') params.delete('orderby');
                    else params.set('orderby', e.target.value);
                    navigate(`${location.pathname}?${params.toString()}`);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-bold text-gray-700 outline-none focus:border-[#F0264C] text-xs cursor-pointer"
                >
                  <option value="default">Default Sorting</option>
                  <option value="price">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Average Rating</option>
                  <option value="date">Newest First</option>
                </select>
              </div>
            </div>

            {/* Mobile Header Layout */}
            <div className="flex lg:hidden bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs justify-between items-center gap-3 w-full">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <p className="text-xs font-bold text-gray-500 shrink-0">
                  <span className="text-[#1d293f] font-black">{filteredProducts.length}</span> items
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
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-bold text-gray-700 outline-none focus:border-[#F0264C] text-xs truncate max-w-[130px] flex-1 cursor-pointer"
                >
                  <option value="default">Default</option>
                  <option value="price">Price: Low</option>
                  <option value="price-desc">Price: High</option>
                  <option value="rating">Rating</option>
                  <option value="date">Newest</option>
                </select>
              </div>

              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-[#F0264C] hover:bg-[#d01c3f] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>

            {/* Products Grid */}
            {loading || !isStoreLoaded || sourceProducts.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-gray-200/80 shadow-2xs">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-[#F0264C]">
                  <Search size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">No products found</h3>
                <p className="text-gray-500 text-xs max-w-xs mb-6">We couldn't find any products in this category matching your filters.</p>
                <button onClick={resetFilters} className="bg-[#F0264C] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#d01c3f] transition-all cursor-pointer">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 animate-fade-in">
                {productsToShow.map((product, index) => {
                  const isLastElement = index === productsToShow.length - 1;
                  return (
                    <div ref={isLastElement ? lastElementRef : null} key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  );
                })}
                
                {isLoadingMore && Array.from({ length: 4 }).map((_, idx) => (
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
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-base font-extrabold text-[#1d293f] flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#F0264C]" /> Filters
              </h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="pb-10">
              {renderFilterSections(true)}

              {activeFilterCount > 0 && (
                <button
                  onClick={() => { resetFilters(); setIsFilterOpen(false); }}
                  className="w-full mt-6 flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#F0264C] bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Reset All Filters ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
