import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Compass, Shield, Car, Footprints, Heart, 
  LayoutGrid, RefreshCw, Briefcase, ShieldCheck, Sparkles,
  ChevronLeft, ChevronRight, ShoppingBag
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GearTab {
  id: string;
  name: string;
  slug: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const GearTravelShowcase: React.FC = () => {
  const { products, frontendProducts, loading, isStoreLoaded } = useStore();
  const sourceProducts = frontendProducts || products;
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subcategory tabs for Gear & Travel
  const gearTabs: GearTab[] = useMemo(() => [
    { id: 'all', name: 'All Gear & Travel', slug: 'gear-travel', icon: Sparkles },
    { id: 'stroller', name: 'Strollers', slug: 'stroller', icon: Compass },
    { id: 'car-seats', name: 'Car Seats', slug: 'car-seats', icon: Shield },
    { id: 'baby-walker', name: 'Baby Walker', slug: 'baby-walker', icon: Footprints },
    { id: 'baby-carriers', name: 'Baby Carriers', slug: 'baby-carriers', icon: Heart },
    { id: 'gym-playmats', name: 'Gym & Playmats', slug: 'gym-playmats', icon: LayoutGrid },
    { id: 'rocker-bouncer', name: 'Rocker / Bouncer', slug: 'rocker-bouncer', icon: RefreshCw },
    { id: 'backpacks', name: 'Backpacks & Bags', slug: 'backpacks', icon: Briefcase },
    { id: 'protective-gears', name: 'Protective Gears', slug: 'protective-gears', icon: ShieldCheck }
  ], []);

  const [activeTab, setActiveTab] = useState<string>('all');

  // Randomize seed on each reload so products differ on every refresh
  const [randomSeed] = useState(() => Math.random());

  // Filter products for the active gear tab and randomize (max 20)
  const filteredProducts = useMemo(() => {
    // 1. Get all products belonging to Gear & Travel family
    const allGearProducts = sourceProducts.filter(p => {
      const cats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
      return cats.some(c => {
        const clean = String(c).replace(/&amp;/g, '&').toLowerCase();
        return clean.includes('gear') || clean.includes('travel') || clean.includes('stroller') || 
               clean.includes('car seat') || clean.includes('walker') || clean.includes('carrier') ||
               clean.includes('playmat') || clean.includes('bouncer') || clean.includes('backpack');
      });
    });

    // Shuffle helper based on seed + product ID
    const shuffleList = (arr: typeof allGearProducts) => {
      return [...arr].sort((a, b) => {
        const hashA = Math.sin(Number(a.id || 1) * 17.1234 + randomSeed * 91.456);
        const hashB = Math.sin(Number(b.id || 1) * 17.1234 + randomSeed * 91.456);
        return hashA - hashB;
      });
    };

    if (activeTab === 'all') {
      return shuffleList(allGearProducts).slice(0, 20);
    }

    const currentTabObj = gearTabs.find(t => t.id === activeTab);
    if (!currentTabObj) return shuffleList(allGearProducts).slice(0, 20);

    const targetName = currentTabObj.name.toLowerCase().replace(/&amp;/g, '&');
    const targetSlug = currentTabObj.slug.toLowerCase();

    const tabMatched = allGearProducts.filter(p => {
      const pCats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
      const pName = p.name.toLowerCase();
      
      const matchesCategory = pCats.some(c => {
        const clean = String(c).replace(/&amp;/g, '&').toLowerCase();
        return clean === targetName || clean === targetSlug || 
               (targetSlug === 'stroller' && clean.includes('stroller')) ||
               (targetSlug === 'car-seats' && (clean.includes('car seat') || clean.includes('car-seat'))) ||
               (targetSlug === 'baby-walker' && clean.includes('walker')) ||
               (targetSlug === 'baby-carriers' && clean.includes('carrier')) ||
               (targetSlug === 'gym-playmats' && (clean.includes('gym') || clean.includes('playmat'))) ||
               (targetSlug === 'rocker-bouncer' && (clean.includes('rocker') || clean.includes('bouncer')));
      });

      const matchesName = 
        (targetSlug === 'stroller' && (pName.includes('stroller') || pName.includes('pram') || pName.includes('buggy'))) ||
        (targetSlug === 'car-seats' && (pName.includes('car seat') || pName.includes('isofix') || pName.includes('booster'))) ||
        (targetSlug === 'baby-walker' && (pName.includes('walker') || pName.includes('walk'))) ||
        (targetSlug === 'baby-carriers' && (pName.includes('carrier') || pName.includes('wrap') || pName.includes('sling'))) ||
        (targetSlug === 'gym-playmats' && (pName.includes('gym') || pName.includes('playmat') || pName.includes('mat'))) ||
        (targetSlug === 'rocker-bouncer' && (pName.includes('rocker') || pName.includes('bouncer') || pName.includes('swing'))) ||
        (targetSlug === 'backpacks' && (pName.includes('backpack') || pName.includes('bag') || pName.includes('trolly'))) ||
        (targetSlug === 'protective-gears' && (pName.includes('protective') || pName.includes('safety') || pName.includes('helmet') || pName.includes('guard')));

      return matchesCategory || matchesName;
    });

    if (tabMatched.length === 0) {
      return shuffleList(allGearProducts).slice(0, 20);
    }

    return shuffleList(tabMatched).slice(0, 20);
  }, [products, activeTab, gearTabs, randomSeed]);

  // Scroll slider left/right
  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const amount = direction === 'left' ? -320 : 320;
    sliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // GSAP animation on tab change or mount
  useEffect(() => {
    if (!sliderRef.current) return;
    const cards = sliderRef.current.querySelectorAll('.gear-product-card');
    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out', overwrite: 'auto' }
    );
  }, [activeTab, filteredProducts.length]);

  // Dynamic button text and destination link
  const currentTabObj = useMemo(() => {
    return gearTabs.find(t => t.id === activeTab) || gearTabs[0];
  }, [activeTab, gearTabs]);

  const shopAllText = useMemo(() => {
    if (currentTabObj.id === 'all') return 'Shop All Gear & Travel';
    return `Shop All ${currentTabObj.name}`;
  }, [currentTabObj]);

  const shopAllLink = useMemo(() => {
    return `/category/${currentTabObj.slug}`;
  }, [currentTabObj]);

  return (
    <section ref={containerRef} className="w-full max-w-[1680px] mx-auto px-4 md:px-8 mb-12 md:mb-20 font-sans">
      
      {/* Header: Title Left, View all Right */}
      <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1d293f] tracking-tight">
            Gear & Travel
          </h2>
        </div>

        <Link
          to="/category/gear-travel"
          className="text-xs md:text-sm font-bold text-[#F0264C] hover:text-[#d01c3f] flex items-center gap-1.5 transition-all group shrink-0"
        >
          <span>View all</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Sub-Category Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {gearTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer select-none shrink-0 ${
                isActive
                  ? 'bg-[#1d293f] text-white shadow-md scale-[1.02]'
                  : 'bg-[#f3f4f6] text-gray-700 hover:bg-[#e5e7eb] hover:text-gray-900 border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#F0264C]' : 'text-gray-500'} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Layout: Left Banner + Right 1-Row Slider */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        
        {/* Left Side Category Banner */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 rounded-2xl overflow-hidden relative shadow-md bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-between p-6 md:p-8 min-h-[340px] lg:min-h-[420px] group/banner">
          {/* Background Image with Dark Vignette */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/banner:scale-105 opacity-85"
            style={{ backgroundImage: `url('/gear-travel-banner.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

          {/* Top Badge */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-[#F0264C] text-white text-[10px] md:text-xs font-extrabold uppercase px-3 py-1.5 rounded-full shadow-sm">
              <Compass size={13} /> On The Move
            </span>
          </div>

          {/* Bottom Content */}
          <div className="relative z-10 space-y-3">
            <h3 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
              Premium Gear & Travel
            </h3>
            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
              Certified car seats, lightweight strollers & carriers engineered for maximum child safety and comfort.
            </p>
            <Link
              to="/category/gear-travel"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 hover:bg-[#F0264C] hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md group cursor-pointer"
            >
              <span>Explore Gear</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Side: 1-Row Horizontal Slider with Overlay Navigation Arrows */}
        <div className="flex-1 min-w-0 relative group/slider">
          
          {/* Navigation Left Arrow */}
          <button
            onClick={() => scrollSlider('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/95 hover:bg-white text-gray-800 hover:text-[#F0264C] rounded-full shadow-xl flex items-center justify-center transition-all opacity-90 hover:opacity-100 hover:scale-110 border border-gray-100 cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          {/* Slider Container */}
          <div
            ref={sliderRef}
            className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-1 px-1"
          >
            {loading || !isStoreLoaded || sourceProducts.length === 0 ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={`gear-skel-${idx}`} 
                  className="w-[170px] sm:w-[210px] md:w-[230px] lg:w-[250px] shrink-0 h-80 bg-gray-50 border border-gray-100 rounded-3xl p-4 space-y-4 animate-pulse"
                >
                  <div className="w-full aspect-square bg-gray-200 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))
            ) : (
              filteredProducts.map((product) => (
                <div 
                  key={`gear-${product.id}`}
                  className="gear-product-card w-[170px] sm:w-[210px] md:w-[230px] lg:w-[250px] shrink-0 snap-start h-full flex"
                >
                  <ProductCard product={product} className="w-full h-full shadow-xs hover:shadow-lg transition-all" />
                </div>
              ))
            )}
          </div>

          {/* Navigation Right Arrow */}
          <button
            onClick={() => scrollSlider('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/95 hover:bg-white text-gray-800 hover:text-[#F0264C] rounded-full shadow-xl flex items-center justify-center transition-all opacity-90 hover:opacity-100 hover:scale-110 border border-gray-100 cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </div>

      </div>

      {/* Dynamic "Shop All [sub category]" Button */}
      <div className="flex justify-center mt-8 md:mt-10">
        <Link
          to={shopAllLink}
          className="px-8 py-3.5 bg-white hover:bg-[#F0264C] text-gray-800 hover:text-white border-2 border-gray-200 hover:border-[#F0264C] font-extrabold text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-2.5 group cursor-pointer"
        >
          <span>{shopAllText}</span>
          <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform text-[#F0264C] group-hover:text-white" />
        </Link>
      </div>

    </section>
  );
};

export default GearTravelShowcase;
