import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Car, 
  Smile, 
  ShieldCheck, 
  Box, 
  Shirt, 
  Layers, 
  Search,
  ArrowRight,
  Menu,
  ShoppingBag,
  Rocket,
  Star,
  BookOpen,
  Heart,
  Package,
  Award
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Category } from '../types';

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

const buildCategoryTree = (categories: Category[], parentId: string | null = null, level: number = 0): CategoryNode[] => {
  return categories
    .filter(cat => {
      if (parentId === null || parentId === '0') {
        return cat.parentId === null || cat.parentId === undefined || cat.parentId === '0' || cat.parentId === '';
      }
      return String(cat.parentId) === String(parentId);
    })
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, String(cat.id), level + 1),
      level
    }));
};

// Icons for the 8 Main Parent Categories
const getMainCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('apparel') || lower.includes('cloth') || lower.includes('fashion')) return <Shirt size={19} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('toy') || lower.includes('lego')) return <Sparkles size={19} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('gear') || lower.includes('travel') || lower.includes('stroller')) return <Car size={19} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('care & hygiene') || lower.includes('hygiene') || lower.includes('bath') || lower.includes('skin')) return <ShieldCheck size={19} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('furniture') || lower.includes('bed')) return <Layers size={19} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('stationery')) return <BookOpen size={19} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('mother')) return <Heart size={19} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('other')) return <Package size={19} className="text-[#556885]" strokeWidth={1.8} />;
  return <ShoppingBag size={19} className="text-[#556885]" strokeWidth={1.8} />;
};

// Roll-Down Text Animation Button
const SlideDownButton: React.FC<{
  to: string;
  text: string;
  bgClass: string;
}> = ({ to, text, bgClass }) => {
  return (
    <Link
      to={to}
      className={`group/btn relative inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-colors duration-300 overflow-hidden ${bgClass} hover:bg-black active:scale-95`}
    >
      <div className="relative overflow-hidden h-[16px] flex flex-col justify-center">
        {/* 1st Text that slides down on hover */}
        <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] group-hover/btn:translate-y-full">
          {text}
        </span>
        {/* 2nd Text that rolls down from top into place on hover */}
        <span className="absolute inset-0 inline-block -translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.2,1,0.3,1)] group-hover/btn:translate-y-0">
          {text}
        </span>
      </div>
    </Link>
  );
};

export const HeroSection: React.FC = () => {
  const { categories, searchQuery, setSearchQuery, products, brands } = useStore();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryNode | null>(null);
  const [isHoveringBrands, setIsHoveringBrands] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Order parent categories: 1. Apparels, 2. Toys, 3. Gear & Travel, 4. Care & Hygiene, 5. Furniture & Bedding, 6. Stationery, 7. Mother Care, 8. Others
  const orderedParentCategories = useMemo(() => {
    const order = [
      'apparels',
      'toys',
      'gear & travel',
      'care & hygiene',
      'furniture & bedding',
      'stationery',
      'mother care',
      'others'
    ];

    const parents = categoryTree.filter(c => c.parentId === null || c.parentId === '0' || c.parentId === undefined || c.parentId === '');
    
    return [...parents].sort((a, b) => {
      const idxA = order.indexOf(a.name.toLowerCase());
      const idxB = order.indexOf(b.name.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [categoryTree]);

  const activeBrands = useMemo(() => {
    return (brands || []).slice(0, 16);
  }, [brands]);

  // 5 Kids Paradise Curated Banners matching exact 423x535px dimension
  const heroBanners = useMemo(() => [
    {
      id: 1,
      badgeText: 'HOT',
      badgeColor: 'bg-[#FFE600] text-black',
      tag: 'Premium Strollers & Prams',
      subtitle: 'Smooth Suspension & Certified Safety',
      title: "Your Baby's Dream Ride",
      btnText: 'Shop Strollers',
      btnBg: 'bg-[#F0264C]',
      link: '/category/gear-travel',
      image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#c85a32]'
    },
    {
      id: 2,
      badgeText: 'NEW',
      badgeColor: 'bg-[#0072CE] text-white',
      tag: 'Electric Ride-on Supercars',
      subtitle: 'Wireless Remote, LED Lights & Music',
      title: 'Smart Cars for Smart Kids',
      btnText: 'Explore Cars',
      btnBg: 'bg-[#B81432]',
      link: '/category/vehicles',
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#5b6574]'
    },
    {
      id: 3,
      badgeText: 'POPULAR',
      badgeColor: 'bg-[#F0264C] text-white',
      tag: 'Super Soft Plushies & Dolls',
      subtitle: '100% Non-Toxic Organic Cotton',
      title: 'Cuddle & Play Friends',
      btnText: 'Explore Dolls',
      btnBg: 'bg-[#F0264C]',
      link: '/category/dolls-accessories',
      image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#4a5568]'
    },
    {
      id: 4,
      badgeText: 'PREMIUM',
      badgeColor: 'bg-[#FFE600] text-black',
      tag: 'Newborn Feeding Essentials',
      subtitle: 'BPA-Free Bottles & Mother Care Picks',
      title: 'Baby Care Made Easy',
      btnText: 'Shop Baby Care',
      btnBg: 'bg-[#B81432]',
      link: '/category/feeding-nursing',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#0066cc]'
    },
    {
      id: 5,
      badgeText: 'BEST VALUE',
      badgeColor: 'bg-emerald-500 text-white',
      tag: 'Early Learning STEM Sets',
      subtitle: 'Inspire Creativity & Brain Development',
      title: 'Smart Learning Blocks',
      btnText: 'Explore Blocks',
      btnBg: 'bg-[#F0264C]',
      link: '/category/blocks',
      image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#4b5563]'
    }
  ], []);

  // Card dimensions: exactly 423px width x 535px height, 16px gap
  const cardWidth = 423;
  const cardGap = 16;
  const slideStep = cardWidth + cardGap; // 439px

  // Maximum slide steps (e.g. 0 to 2)
  const maxSlide = 2;

  const nextSlide = () => {
    setCurrentSlide(prev => (prev >= maxSlide ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev <= 0 ? maxSlide : prev - 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, maxSlide]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [products, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
    }
  };

  return (
    <section className="w-full bg-[#f8f9fa] pt-4 pb-8 md:pb-12 font-sans overflow-x-clip">
      <div className="container mx-auto px-4 md:px-8">

        {/* Top Header Row: "Shop by" Header (#F0264C) + Search Input */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-4">
          
          {/* "Shop by" Header Box */}
          <div className="hidden lg:flex w-[270px] min-w-[270px] items-center justify-between bg-[#F0264C] text-white px-5 py-3.5 rounded-t-md font-bold tracking-tight shadow-sm flex-shrink-0">
            <span className="text-base font-bold tracking-wide">Shop by</span>
            <Menu size={22} className="text-white" strokeWidth={2.5} />
          </div>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full h-[52px] bg-[#f0f2f5] rounded-md border border-gray-200/90 overflow-hidden focus-within:border-gray-400 focus-within:bg-white transition-all">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full px-5 py-3 text-gray-800 text-sm outline-none placeholder-gray-500 bg-transparent"
              />
              <button
                type="submit"
                className="px-5 text-gray-500 hover:text-black transition-colors flex items-center justify-center cursor-pointer"
                title="Search"
              >
                <Search size={18} strokeWidth={2.2} />
              </button>
            </form>

            {/* Live Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-md mt-1 border border-gray-200 divide-y divide-gray-100 z-50 overflow-hidden max-h-[380px] overflow-y-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {searchResults.map(product => (
                  <div 
                    key={product.id} 
                    className="flex items-center gap-4 p-3.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      navigate(`/product/${product.slug || product.id}`);
                    }}
                  >
                    <img 
                      src={product.images[0] || 'https://via.placeholder.com/80'} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#F0264C] transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[#F0264C] font-bold text-sm">৳{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-gray-400 text-xs line-through">৳{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#F0264C] transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hero Body: Unified Viewport where Cards Slide UNDER the "Shop by" Menu (Image 2 & 4) */}
        <div 
          className="relative min-h-[560px] overflow-visible"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          {/* 1. Left Side: Full Sidebar Menu (8 Categories + New Arrivals + Best Sellers + Brands) with High Z-Index */}
          <div className="hidden lg:block absolute left-0 top-0 w-[270px] min-w-[270px] bg-white rounded-b-md border border-gray-200 shadow-md z-30">
            <nav className="divide-y divide-gray-100">
              
              {/* 8 Main Parent Categories */}
              {orderedParentCategories.map((cat, idx) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const isHovered = activeCategory?.id === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="relative group/menuitem"
                    onMouseEnter={() => {
                      setActiveCategory(cat);
                      setIsHoveringBrands(false);
                    }}
                    onMouseLeave={() => setActiveCategory(null)}
                  >
                    <Link
                      to={`/category/${cat.slug || encodeURIComponent(cat.name)}`}
                      className={`flex items-center justify-between px-4 py-3 text-[14px] transition-colors ${
                        isHovered 
                          ? 'text-[#0072CE] font-bold bg-blue-50/50' 
                          : 'text-[#1d293f] font-semibold hover:text-[#0072CE]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {getMainCategoryIcon(cat.name)}
                        <span className="truncate">{cat.name.replace(/&amp;/g, '&')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {idx === 3 && (
                          <span className="bg-[#FF4D15] text-white text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-[4px]">
                            Hot
                          </span>
                        )}
                        {idx === 0 && (
                          <span className="bg-[#FFCC00] text-black text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-[4px]">
                            New
                          </span>
                        )}
                        <ChevronRight size={15} className={`transition-transform text-gray-400 ${isHovered ? 'text-[#0072CE] translate-x-0.5' : ''}`} />
                      </div>
                    </Link>

                    {/* Multi-Level Flyout Submenu on Hover */}
                    {hasChildren && isHovered && (
                      <div 
                        className="absolute left-full top-0 ml-1 w-[560px] bg-white border border-gray-200 rounded-lg shadow-2xl p-6 z-50 animate-in fade-in duration-150 min-h-[420px]"
                        onMouseEnter={() => setActiveCategory(cat)}
                        onMouseLeave={() => setActiveCategory(null)}
                      >
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                          <h3 className="font-extrabold text-base text-[#1d293f] flex items-center gap-2">
                            {getMainCategoryIcon(cat.name)}
                            {cat.name.replace(/&amp;/g, '&')}
                          </h3>
                          <Link 
                            to={`/category/${cat.slug || encodeURIComponent(cat.name)}`}
                            className="text-xs font-bold text-[#F0264C] hover:underline flex items-center gap-1"
                          >
                            View All <ArrowRight size={12} />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {cat.children.map(subCat => (
                            <div key={subCat.id} className="space-y-2">
                              <Link
                                to={`/category/${subCat.slug || encodeURIComponent(subCat.name)}`}
                                className="font-bold text-sm text-[#1d293f] hover:text-[#0072CE] transition-colors flex items-center justify-between border-b border-gray-100 pb-1.5 group/sub"
                              >
                                <span>{subCat.name.replace(/&amp;/g, '&')}</span>
                                {subCat.children && subCat.children.length > 0 && (
                                  <span className="text-[10px] text-gray-400 group-hover/sub:text-[#0072CE]">({subCat.children.length})</span>
                                )}
                              </Link>

                              {subCat.children && subCat.children.length > 0 && (
                                <ul className="space-y-1.5 pl-1">
                                  {subCat.children.map(subSubCat => (
                                    <li key={subSubCat.id}>
                                      <Link
                                        to={`/category/${subSubCat.slug || encodeURIComponent(subSubCat.name)}`}
                                        className="text-xs text-gray-600 hover:text-[#0072CE] transition-colors flex items-center gap-1.5 hover:translate-x-1 duration-150"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                        {subSubCat.name.replace(/&amp;/g, '&')}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 9. New Arrivals */}
              <Link
                to="/products?filter=new"
                onMouseEnter={() => { setActiveCategory(null); setIsHoveringBrands(false); }}
                className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-[#1d293f] hover:text-[#0072CE] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Rocket size={19} className="text-[#556885]" strokeWidth={1.8} />
                  <span>New Arrivals</span>
                </div>
              </Link>

              {/* 10. Best Sellers */}
              <Link
                to="/products?filter=bestseller"
                onMouseEnter={() => { setActiveCategory(null); setIsHoveringBrands(false); }}
                className="flex items-center justify-between px-4 py-3 text-[14px] font-semibold text-[#1d293f] hover:text-[#0072CE] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Star size={19} className="text-[#556885]" strokeWidth={1.8} />
                  <span>Best Sellers</span>
                </div>
              </Link>

              {/* 11. Brands (With Flyout on Hover) */}
              <div
                className="relative group/menuitem"
                onMouseEnter={() => {
                  setIsHoveringBrands(true);
                  setActiveCategory(null);
                }}
                onMouseLeave={() => setIsHoveringBrands(false)}
              >
                <Link
                  to="/products"
                  className={`flex items-center justify-between px-4 py-3 text-[14px] transition-colors rounded-b-md ${
                    isHoveringBrands 
                      ? 'text-[#0072CE] font-bold bg-blue-50/50' 
                      : 'text-[#1d293f] font-semibold hover:text-[#0072CE]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Award size={19} className="text-[#556885]" strokeWidth={1.8} />
                    <span>Brands</span>
                  </div>
                  <ChevronRight size={15} className={`transition-transform text-gray-400 ${isHoveringBrands ? 'text-[#0072CE] translate-x-0.5' : ''}`} />
                </Link>

                {/* Brands Flyout on Hover */}
                {isHoveringBrands && (
                  <div 
                    className="absolute left-full top-0 ml-1 w-[480px] bg-white border border-gray-200 rounded-lg shadow-2xl p-6 z-50 animate-in fade-in duration-150"
                    onMouseEnter={() => setIsHoveringBrands(true)}
                    onMouseLeave={() => setIsHoveringBrands(false)}
                  >
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                      <h3 className="font-extrabold text-base text-[#1d293f] flex items-center gap-2">
                        <Award size={18} className="text-[#F0264C]" />
                        Official Brands
                      </h3>
                      <Link 
                        to="/products" 
                        className="text-xs font-bold text-[#F0264C] hover:underline flex items-center gap-1"
                      >
                        All Brands <ArrowRight size={12} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {activeBrands.map(b => (
                        <Link
                          key={b.id}
                          to={`/products?brand=${b.slug || b.name}`}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm font-semibold text-gray-700 hover:text-[#0072CE] transition-colors border border-gray-100"
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span className="truncate">{b.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* 2. Sliding Track: Starts next to the menu (left: 286px) and slides UNDER the menu when currentSlide > 0 */}
          <div className="w-full lg:pl-[286px] overflow-visible">
            <div 
              className="flex transition-transform duration-700 ease-in-out gap-4 z-10"
              style={{
                transform: `translateX(-${currentSlide * slideStep}px)`
              }}
            >
              {heroBanners.map((banner) => (
                <div
                  key={banner.id}
                  style={{ width: `${cardWidth}px` }}
                  className="h-[535px] flex-shrink-0"
                >
                  <div className={`relative w-full h-full rounded-[20px] overflow-hidden shadow-sm group select-none ${banner.bgColor}`}>
                    
                    {/* CRYSTAL CLEAR Background Image */}
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                    />

                    {/* Feature Badge (Top Right) */}
                    {banner.badgeText && (
                      <div className="absolute top-7 right-7 z-20">
                        <div className={`px-4 py-2 rounded-full flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-xl ${banner.badgeColor}`}>
                          {banner.badgeText}
                        </div>
                      </div>
                    )}

                    {/* Card Content with Roll-Down Button */}
                    <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end text-white z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent pt-24">
                      
                      {banner.tag && (
                        <p className="text-[13px] font-medium text-white/95 drop-shadow-md mb-0.5 leading-snug">
                          {banner.tag}
                        </p>
                      )}

                      <h3 className="text-[28px] font-black leading-[1.15] tracking-tight mb-2 text-white drop-shadow-lg">
                        {banner.title}
                      </h3>

                      {banner.subtitle && (
                        <p className="text-[13px] text-gray-200 line-clamp-2 mb-5 leading-relaxed drop-shadow-md">
                          {banner.subtitle}
                        </p>
                      )}

                      {/* Animated Roll-Down Button */}
                      <div className="mt-1">
                        <SlideDownButton
                          to={banner.link}
                          text={banner.btnText}
                          bgClass={banner.btnBg}
                        />
                      </div>

                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Slider Bottom Controls: Left/Right Arrow Buttons + Dot Indicators */}
          <div className="flex items-center justify-between mt-4 px-1 lg:pl-[286px]">
            
            {/* Pagination Dots (0 to maxSlide) */}
            <div className="flex items-center gap-2">
              {Array.from({ length: maxSlide + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx
                      ? 'w-7 bg-[#F0264C]'
                      : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Slide Position ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Circular Arrow Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:bg-[#F0264C] hover:text-white hover:border-[#F0264C] transition-all active:scale-95"
                title="Previous Slide"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextSlide}
                className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:bg-[#F0264C] hover:text-white hover:border-[#F0264C] transition-all active:scale-95"
                title="Next Slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default HeroSection;
