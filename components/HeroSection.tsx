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
  SlidersHorizontal,
  Package,
  CheckCircle2
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

// Helper icon mapper for category names
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('toy') || lower.includes('lego')) return <Sparkles size={17} className="text-[#F0264C]" />;
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('bike')) return <Car size={17} className="text-blue-500" />;
  if (lower.includes('doll')) return <Smile size={17} className="text-pink-500" />;
  if (lower.includes('care') || lower.includes('hygiene') || lower.includes('bath') || lower.includes('skin')) return <ShieldCheck size={17} className="text-emerald-500" />;
  if (lower.includes('feed') || lower.includes('bottle') || lower.includes('food')) return <Heart size={17} className="text-rose-400" />;
  if (lower.includes('gear') || lower.includes('travel') || lower.includes('stroller')) return <Truck size={17} className="text-amber-500" />;
  if (lower.includes('block') || lower.includes('puzzle')) return <Box size={17} className="text-indigo-500" />;
  if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('apparel') || lower.includes('shoe')) return <Shirt size={17} className="text-purple-500" />;
  if (lower.includes('furniture') || lower.includes('bed')) return <Layers size={17} className="text-teal-500" />;
  return <Package size={17} className="text-gray-400" />;
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

  // Display top parent categories (up to 10 for clean sidebar)
  const displayCategories = useMemo(() => {
    return categoryTree.slice(0, 9);
  }, [categoryTree]);

  // Kids Paradise Banners tailored for Kids Products
  const heroBanners = useMemo(() => [
    {
      id: 1,
      badge: '-20%',
      badgeColor: 'bg-amber-400 text-black',
      tag: 'Premium Strollers & Prams',
      discountSub: 'UP TO 20% OFF',
      title: "Your Baby's Daily Upgrade",
      desc: 'Ultra-lightweight, ergonomic comfort, maximum safety certified.',
      btnText: 'Shop Strollers',
      btnColor: 'bg-white text-black hover:bg-gray-100',
      link: '/category/gear-travel',
      bgGradient: 'from-[#b43a18] via-[#e25822] to-[#f27a3a]',
      image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 2,
      badge: '-35%',
      badgeColor: 'bg-amber-400 text-black',
      tag: 'Soft Plushies & Giant Dolls',
      discountSub: 'HURRY! SAVE 35% TODAY',
      title: 'Huggable Joy & Sweet Dreams',
      desc: 'Non-toxic organic cotton plush friends for your little ones.',
      btnText: 'Explore Dolls',
      btnColor: 'bg-white text-black hover:bg-gray-100',
      link: '/category/dolls-accessories',
      bgGradient: 'from-[#2c3e50] via-[#3a536b] to-[#4a6984]',
      image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 3,
      badge: '-25%',
      badgeColor: 'bg-[#F0264C] text-white',
      tag: 'Electric Ride-on Cars & Jeeps',
      discountSub: 'BEST VALUE DEALS',
      title: 'Real Electric Supercars',
      desc: 'Parental remote control, LED headlights & music system.',
      btnText: 'Shop Ride-Ons',
      btnColor: 'bg-[#000000] text-white hover:bg-gray-900',
      link: '/category/vehicles',
      bgGradient: 'from-[#1e3c72] via-[#2a5298] to-[#3a7bd5]',
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 4,
      badge: '-15%',
      badgeColor: 'bg-amber-400 text-black',
      tag: 'Newborn Feeding & Care',
      discountSub: 'MOTHER CARE PICKS',
      title: 'Gentle Care Made Easy',
      desc: 'BPA-Free bottles, pacifiers, warmers & sterilizers.',
      btnText: 'Shop Baby Care',
      btnColor: 'bg-[#0072CE] text-white hover:bg-[#005ba3]',
      link: '/category/feeding-nursing',
      bgGradient: 'from-[#005c97] via-[#363795] to-[#4a00e0]',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 5,
      badge: '-30%',
      badgeColor: 'bg-yellow-300 text-black',
      tag: 'Early Learning & STEM Blocks',
      discountSub: 'BRAIN BOOSTER TOYS',
      title: 'Build, Learn & Imagine',
      desc: 'Building blocks, puzzles & creative interactive kits.',
      btnText: 'Explore Blocks',
      btnColor: 'bg-[#F0264C] text-white hover:bg-[#d61e41]',
      link: '/category/blocks',
      bgGradient: 'from-[#8e2de2] via-[#4a00e0] to-[#1f1c2c]',
      image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=900&q=80',
    }
  ], []);

  // Total visible cards in desktop view is 3
  const totalBanners = heroBanners.length;

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalBanners);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalBanners) % totalBanners);
  };

  // Autoplay slider
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);
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
    <section className="w-full bg-[#f8f9fa] pt-4 pb-8 md:pb-12 font-sans border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-8">

        {/* Top Row: "Shop by" Header + Large Search Bar (As in Reference Image 1 & 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center mb-4">
          
          {/* Shop by Header Bar */}
          <div className="hidden lg:flex lg:col-span-3 items-center justify-between bg-[#F0264C] text-white px-5 py-3.5 rounded-t-xl font-bold tracking-wide shadow-sm">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={20} />
              <span className="text-base uppercase font-extrabold tracking-wider">Shop by</span>
            </div>
            <div className="w-6 h-0.5 bg-white/40 rounded-full"></div>
          </div>

          {/* Search Bar matching Wokiee clean aesthetic */}
          <div className="col-span-1 lg:col-span-9 relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full bg-white rounded-xl md:rounded-full border border-gray-200 shadow-sm overflow-hidden focus-within:border-[#F0264C] focus-within:ring-2 focus-within:ring-[#F0264C]/20 transition-all">
              <input
                type="text"
                placeholder="Search products, toys, strollers, dolls, baby care..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full px-5 py-3.5 text-gray-700 text-sm outline-none placeholder-gray-400 bg-transparent"
              />
              <button
                type="submit"
                className="px-6 py-3.5 text-gray-500 hover:text-[#F0264C] transition-colors flex items-center justify-center cursor-pointer"
                title="Search"
              >
                <Search size={20} />
              </button>
            </form>

            {/* Live Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-2xl mt-2 border border-gray-100 divide-y divide-gray-100 z-50 overflow-hidden max-h-[380px] overflow-y-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {searchResults.map(product => (
                  <div 
                    key={product.id} 
                    className="flex items-center gap-4 p-3.5 hover:bg-rose-50/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setShowSearchDropdown(false);
                      navigate(`/product/${product.slug || product.id}`);
                    }}
                  >
                    <img 
                      src={product.images[0] || 'https://via.placeholder.com/80'} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0"
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

        {/* Hero Body Grid: Left Sidebar Categories + Right Multi-Card Animated Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative">

          {/* Left Side: Shop by Category Vertical Menu with Multi-Level MegaMenu Flyout */}
          <div className="hidden lg:block lg:col-span-3 bg-white rounded-b-xl border border-gray-200/80 shadow-sm relative z-40">
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
                      className={`flex items-center justify-between px-5 py-3.5 text-sm font-medium transition-all ${
                        isHovered 
                          ? 'bg-rose-50/70 text-[#F0264C] font-semibold pl-6' 
                          : 'text-gray-700 hover:text-[#F0264C] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(cat.name)}
                        <span className="truncate">{cat.name.replace(/&amp;/g, '&')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {idx === 2 && (
                          <span className="bg-[#F0264C] text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                            Hot
                          </span>
                        )}
                        {idx === 0 && (
                          <span className="bg-amber-400 text-black text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                        {hasChildren && (
                          <ChevronRight size={14} className={`transition-transform ${isHovered ? 'text-[#F0264C] translate-x-1' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </Link>

                    {/* Multi-Column Flyout MegaMenu on Hover */}
                    {hasChildren && isHovered && (
                      <div 
                        className="absolute left-full top-0 ml-1 w-[560px] bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 z-50 animate-in fade-in duration-200 min-h-[380px]"
                        onMouseEnter={() => setActiveCategory(cat)}
                        onMouseLeave={() => setActiveCategory(null)}
                      >
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                          <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                            {getCategoryIcon(cat.name)}
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
                                className="font-bold text-sm text-gray-900 hover:text-[#F0264C] transition-colors block border-b border-gray-100 pb-1.5"
                              >
                                {subCat.name.replace(/&amp;/g, '&')}
                              </Link>

                              {subCat.children && subCat.children.length > 0 && (
                                <ul className="space-y-1.5 pl-1">
                                  {subCat.children.map(subSubCat => (
                                    <li key={subSubCat.id}>
                                      <Link
                                        to={`/category/${subSubCat.slug || encodeURIComponent(subSubCat.name)}`}
                                        className="text-xs text-gray-600 hover:text-[#F0264C] transition-colors flex items-center gap-1.5"
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

              {/* Extra Highlights */}
              <Link
                to="/products?filter=new"
                className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:text-[#F0264C] hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Flame size={17} className="text-[#F0264C]" />
                  <span>New Arrivals</span>
                </div>
              </Link>
              <Link
                to="/products?filter=bestseller"
                className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:text-[#F0264C] hover:bg-gray-50 transition-colors rounded-b-xl"
              >
                <div className="flex items-center gap-3">
                  <Zap size={17} className="text-amber-500" />
                  <span>Best Sellers</span>
                </div>
              </Link>
            </nav>
          </div>

          {/* Right Side: Multi-Card Sliding Hero Carousel (Matching Reference Images 2 & 3) */}
          <div 
            className="col-span-1 lg:col-span-9 relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Carousel Track with smooth translate animation */}
            <div 
              className="flex transition-transform duration-700 ease-out gap-4"
              style={{
                transform: `translateX(-${currentSlide * (100 / (window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3))}%)`
              }}
            >
              {heroBanners.concat(heroBanners).map((banner, index) => (
                <div
                  key={`${banner.id}-${index}`}
                  className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] flex-shrink-0"
                >
                  <div className={`relative h-[480px] md:h-[520px] rounded-2xl overflow-hidden shadow-md group select-none bg-gradient-to-b ${banner.bgGradient}`}>
                    
                    {/* Background Image with Hover Scale */}
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                    />

                    {/* Gradient Overlay for Crisp Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                    {/* Discount Circle Sticker (Top Right or Bottom Right like Reference) */}
                    <div className="absolute top-6 right-6 z-20">
                      <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-black text-xl shadow-xl transform rotate-6 group-hover:rotate-0 transition-transform ${banner.badgeColor}`}>
                        {banner.badge}
                      </div>
                    </div>

                    {/* Card Content (Bottom Positioned) */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
                      <span className="text-xs uppercase tracking-widest font-extrabold text-amber-300 drop-shadow-sm mb-1">
                        {banner.tag}
                      </span>
                      <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-2">
                        {banner.discountSub}
                      </span>

                      <h3 className="text-2xl font-black leading-tight tracking-tight mb-2 group-hover:text-rose-200 transition-colors">
                        {banner.title}
                      </h3>

                      <p className="text-xs text-gray-200 line-clamp-2 mb-5 opacity-90 leading-relaxed font-light">
                        {banner.desc}
                      </p>

                      <Link
                        to={banner.link}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all duration-300 w-fit ${banner.btnColor}`}
                      >
                        <span>{banner.btnText}</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Bottom Controls: Left/Right Arrow Buttons + Dot Indicators (Matching Reference Image 3) */}
            <div className="flex items-center justify-between mt-4 px-2">
              
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {heroBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentSlide % totalBanners === idx
                        ? 'w-8 bg-[#F0264C]'
                        : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Circular Buttons */}
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
