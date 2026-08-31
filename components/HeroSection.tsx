import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Zap, 
  Gift, 
  Heart, 
  Truck, 
  Flame, 
  Search,
  ArrowRight,
  Menu,
  Package,
  Tv,
  Gamepad2,
  Watch,
  Smartphone,
  Laptop,
  ShoppingBag,
  Star,
  Rocket
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

// Icons matched to Wokiee theme aesthetic (Image 3)
const getCategoryIcon = (name: string, index: number) => {
  const lower = name.toLowerCase();
  if (lower.includes('toy') || lower.includes('lego')) return <Gamepad2 size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('bike')) return <Car size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('doll')) return <Smile size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('care') || lower.includes('hygiene') || lower.includes('bath') || lower.includes('skin')) return <ShieldCheck size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('feed') || lower.includes('bottle') || lower.includes('food')) return <ShoppingBag size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('gear') || lower.includes('travel') || lower.includes('stroller')) return <Truck size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('block') || lower.includes('puzzle')) return <Box size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('apparel') || lower.includes('shoe')) return <Shirt size={20} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('furniture') || lower.includes('bed')) return <Layers size={20} className="text-[#556885]" strokeWidth={1.8} />;
  
  const fallbackIcons = [
    <ShoppingBag size={20} className="text-[#556885]" strokeWidth={1.8} />,
    <Tv size={20} className="text-[#556885]" strokeWidth={1.8} />,
    <Smartphone size={20} className="text-[#556885]" strokeWidth={1.8} />,
    <Laptop size={20} className="text-[#556885]" strokeWidth={1.8} />,
    <Watch size={20} className="text-[#556885]" strokeWidth={1.8} />
  ];
  return fallbackIcons[index % fallbackIcons.length];
};

export const HeroSection: React.FC = () => {
  const { categories, searchQuery, setSearchQuery, products } = useStore();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryNode | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  const displayCategories = useMemo(() => {
    return categoryTree.slice(0, 9);
  }, [categoryTree]);

  // Crystal Clear, High-Impact Banners with exact Wokiee layout
  const heroBanners = useMemo(() => [
    {
      id: 1,
      badge: '-20%',
      badgeColor: 'bg-[#FFE600] text-black',
      tag: 'Premium coffee machines with',
      discountSub: 'UP TO 20% OFF',
      title: 'Your Daily Coffee Upgrade',
      btnText: 'Shop Coffee Machines',
      btnColor: 'bg-white text-gray-900 hover:bg-gray-100',
      link: '/category/gear-travel',
      textColor: 'text-white',
      image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#c85a32]'
    },
    {
      id: 2,
      badge: null,
      badgeColor: '',
      tag: null,
      discountSub: null,
      title: 'Smart TVs for Smart Living',
      subDesc: 'Stunning 4K quality. Endless streaming. Total control.',
      btnText: 'Explore Collection',
      btnColor: 'bg-[#0072CE] text-white hover:bg-[#005ba3]',
      link: '/category/vehicles',
      textColor: 'text-white',
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#5b6574]'
    },
    {
      id: 3,
      badge: '-20%',
      badgeColor: 'bg-[#00A3E0] text-white',
      tag: 'Upgrade your kitchen with seamless built-in design',
      discountSub: null,
      title: '20% Off Built-In Refrigerators',
      btnText: 'Shop Now!',
      btnColor: 'bg-[#00A3E0] text-white hover:bg-[#008cc0]',
      link: '/category/dolls-accessories',
      textColor: 'text-white',
      image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#4a5568]'
    },
    {
      id: 4,
      badge: '-15%',
      badgeColor: 'bg-[#FFE600] text-black',
      tag: 'Enjoy 15% OFF efficient and quiet washing machines',
      discountSub: null,
      title: 'Laundry Made Easy',
      btnText: 'Shop Washers!',
      btnColor: 'bg-white text-gray-900 hover:bg-gray-100',
      link: '/category/feeding-nursing',
      textColor: 'text-white',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#0066cc]'
    },
    {
      id: 5,
      badge: '-35%',
      badgeColor: 'bg-[#E65100] text-white',
      tag: 'Stylish toasters with fast, even toasting',
      discountSub: null,
      title: 'Hurry! Save 35% Today',
      btnText: 'Shop Toasters!',
      btnColor: 'bg-white text-gray-900 hover:bg-gray-100',
      link: '/category/blocks',
      textColor: 'text-white',
      image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=95',
      bgColor: 'bg-[#4b5563]'
    }
  ], []);

  const totalBanners = heroBanners.length;

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalBanners);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalBanners) % totalBanners);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, totalBanners]);

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
    <section className="w-full bg-[#f8f9fa] pt-4 pb-8 md:pb-12 font-sans overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">

        {/* Top Header Row: "Shop by" Header + Large Search Input (Image 1 & 2) */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-4">
          
          {/* "Shop by" Header Box (#F0264C Background as requested) */}
          <div className="hidden lg:flex w-[270px] min-w-[270px] items-center justify-between bg-[#F0264C] text-white px-5 py-3.5 rounded-t-md font-bold tracking-tight shadow-sm flex-shrink-0">
            <span className="text-base font-bold tracking-wide">Shop by</span>
            <Menu size={22} className="text-white" strokeWidth={2.5} />
          </div>

          {/* Search Bar matching Wokiee aesthetic */}
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

        {/* Hero Body: Shop by Category Sidebar on Left + 423x535 Slider on Right */}
        <div 
          className="relative flex gap-4 items-start"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          {/* 1. Left Side: "Shop by" Menu (Image 3 Style with #556885 outline icons and clean dividers) */}
          <div className="hidden lg:block w-[270px] min-w-[270px] bg-white rounded-b-md border border-gray-200 shadow-sm z-30 flex-shrink-0 relative">
            <nav className="divide-y divide-gray-100">
              {displayCategories.map((cat, idx) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const isHovered = activeCategory?.id === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="relative group/menuitem"
                    onMouseEnter={() => setActiveCategory(cat)}
                    onMouseLeave={() => setActiveCategory(null)}
                  >
                    <Link
                      to={`/category/${cat.slug || encodeURIComponent(cat.name)}`}
                      className={`flex items-center justify-between px-4 py-3.5 text-[14px] transition-colors ${
                        isHovered 
                          ? 'text-[#0072CE] font-bold bg-blue-50/50' 
                          : 'text-[#1d293f] font-semibold hover:text-[#0072CE]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {getCategoryIcon(cat.name, idx)}
                        <span className="truncate">{cat.name.replace(/&amp;/g, '&')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {idx === 2 && (
                          <span className="bg-[#FF4D15] text-white text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-[4px]">
                            Hot
                          </span>
                        )}
                        {idx === 0 && (
                          <span className="bg-[#FFCC00] text-black text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-[4px]">
                            New
                          </span>
                        )}
                        {hasChildren && (
                          <ChevronRight size={15} className={`transition-transform text-gray-400 ${isHovered ? 'text-[#0072CE] translate-x-0.5' : ''}`} />
                        )}
                      </div>
                    </Link>

                    {/* Flyout MegaMenu on Hover */}
                    {hasChildren && isHovered && (
                      <div 
                        className="absolute left-full top-0 ml-1.5 w-[540px] bg-white border border-gray-200 rounded-lg shadow-2xl p-6 z-50 animate-in fade-in duration-150 min-h-[380px]"
                        onMouseEnter={() => setActiveCategory(cat)}
                        onMouseLeave={() => setActiveCategory(null)}
                      >
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                          <h3 className="font-extrabold text-base text-[#1d293f] flex items-center gap-2">
                            {getCategoryIcon(cat.name, idx)}
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
                                className="font-bold text-sm text-[#1d293f] hover:text-[#0072CE] transition-colors block border-b border-gray-100 pb-1.5"
                              >
                                {subCat.name.replace(/&amp;/g, '&')}
                              </Link>

                              {subCat.children && subCat.children.length > 0 && (
                                <ul className="space-y-1.5 pl-1">
                                  {subCat.children.map(subSubCat => (
                                    <li key={subSubCat.id}>
                                      <Link
                                        to={`/category/${subSubCat.slug || encodeURIComponent(subSubCat.name)}`}
                                        className="text-xs text-gray-600 hover:text-[#0072CE] transition-colors flex items-center gap-1.5"
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

              {/* New Arrivals & Best Sellers with clean Wokiee icons */}
              <Link
                to="/products?filter=new"
                className="flex items-center justify-between px-4 py-3.5 text-[14px] font-semibold text-[#1d293f] hover:text-[#0072CE] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Rocket size={20} className="text-[#556885]" strokeWidth={1.8} />
                  <span>New Arrivals</span>
                </div>
              </Link>
              <Link
                to="/products?filter=bestseller"
                className="flex items-center justify-between px-4 py-3.5 text-[14px] font-semibold text-[#1d293f] hover:text-[#0072CE] hover:bg-gray-50 transition-colors rounded-b-md"
              >
                <div className="flex items-center gap-3.5">
                  <Star size={20} className="text-[#556885]" strokeWidth={1.8} />
                  <span>Best Sellers</span>
                </div>
              </Link>
            </nav>
          </div>

          {/* 2. Right Side: Banner Slider (Exact Dimensions: 423px width x 535px height, Crystal Clear Photography) */}
          <div className="flex-1 overflow-hidden relative">
            
            {/* Sliding Track: translates by (423px + 16px gap) = 439px per slide */}
            <div 
              className="flex transition-transform duration-700 ease-in-out gap-4"
              style={{
                transform: `translateX(-${currentSlide * 439}px)`
              }}
            >
              {heroBanners.concat(heroBanners).map((banner, index) => (
                <div
                  key={`${banner.id}-${index}`}
                  className="w-[423px] min-w-[423px] max-w-[423px] h-[535px] flex-shrink-0"
                >
                  <div className={`relative w-full h-full rounded-[20px] overflow-hidden shadow-sm group select-none ${banner.bgColor}`}>
                    
                    {/* CRYSTAL CLEAR Background Image (NO dark overlay, clean & vibrant) */}
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                    />

                    {/* Round Sticker Badge (Top / Middle Right like Image 2) */}
                    {banner.badge && (
                      <div className="absolute top-7 right-7 z-20">
                        <div className={`w-[90px] h-[90px] rounded-full flex items-center justify-center font-black text-[32px] shadow-2xl tracking-tighter ${banner.badgeColor}`}>
                          {banner.badge}
                        </div>
                      </div>
                    )}

                    {/* Card Content & Text placed cleanly at the bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end text-white z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent pt-24">
                      
                      {banner.tag && (
                        <p className="text-[13px] font-medium text-white/95 drop-shadow-md mb-0.5 leading-snug">
                          {banner.tag}
                        </p>
                      )}

                      {banner.discountSub && (
                        <p className="text-xs font-black uppercase tracking-wider text-amber-300 drop-shadow-md mb-1.5">
                          {banner.discountSub}
                        </p>
                      )}

                      <h3 className="text-[28px] font-black leading-[1.15] tracking-tight mb-3 text-white drop-shadow-lg">
                        {banner.title}
                      </h3>

                      {banner.subDesc && (
                        <p className="text-[13px] text-gray-200 line-clamp-2 mb-4 leading-relaxed drop-shadow-md">
                          {banner.subDesc}
                        </p>
                      )}

                      <div className="mt-2">
                        <Link
                          to={banner.link}
                          className={`inline-block px-6 py-3.5 rounded-md font-extrabold text-[13px] tracking-tight shadow-lg active:scale-95 transition-all duration-200 ${banner.btnColor}`}
                        >
                          {banner.btnText}
                        </Link>
                      </div>

                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Slider Bottom Controls: Left/Right Arrow Buttons + Dot Indicators (Image 2 & 3) */}
            <div className="flex items-center justify-between mt-4 px-1">
              
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {heroBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentSlide % totalBanners === idx
                        ? 'w-7 bg-[#F0264C]'
                        : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={`Slide ${idx + 1}`}
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

      </div>
    </section>
  );
};

export default HeroSection;
