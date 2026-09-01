import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Baby, GraduationCap, Car, Heart, 
  Puzzle, Zap, Music, Trophy, Palette, Blocks, Box, Shield
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import { Product } from '../types';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ToyTab {
  id: string;
  name: string;
  slug: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const ToysShowcase: React.FC = () => {
  const { products, categories } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Subcategory tabs for Toys with icons
  const toyTabs: ToyTab[] = useMemo(() => [
    { id: 'all', name: 'All Toys', slug: 'toys', icon: Sparkles },
    { id: 'baby-toddler', name: 'Baby & Toddler Toys', slug: 'baby-toddler-toys', icon: Baby },
    { id: 'learning', name: 'Learning & Education', slug: 'learning-education', icon: GraduationCap },
    { id: 'vehicles', name: 'Vehicles', slug: 'vehicles', icon: Car },
    { id: 'dolls', name: 'Dolls & Accessories', slug: 'dolls-accessories', icon: Heart },
    { id: 'puzzle', name: 'Puzzle & Board Games', slug: 'puzzle-board-games', icon: Puzzle },
    { id: 'electronic', name: 'Electronic Toys', slug: 'electronic-toys', icon: Zap },
    { id: 'musical', name: 'Musical Toys', slug: 'musical-toys', icon: Music },
    { id: 'sports', name: 'Sports & Outdoor Play', slug: 'sports-outdoor-play', icon: Trophy },
    { id: 'arts', name: 'Arts & Crafts', slug: 'arts-crafts', icon: Palette }
  ], []);

  const [activeTab, setActiveTab] = useState<string>('all');

  // Filter products for the active toy tab
  const filteredProducts = useMemo(() => {
    // 1. Get all products belonging to Toys family
    const allToyProducts = products.filter(p => {
      const cats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
      return cats.some(c => {
        const clean = String(c).replace(/&amp;/g, '&').toLowerCase();
        return clean.includes('toy') || clean.includes('lego') || clean.includes('puzzle') || 
               clean.includes('doll') || clean.includes('rattle') || clean.includes('game') ||
               clean === 'vehicles';
      });
    });

    if (activeTab === 'all') {
      return allToyProducts.slice(0, 12);
    }

    const currentTabObj = toyTabs.find(t => t.id === activeTab);
    if (!currentTabObj) return allToyProducts.slice(0, 12);

    const targetName = currentTabObj.name.toLowerCase().replace(/&amp;/g, '&');
    const targetSlug = currentTabObj.slug.toLowerCase();

    const tabMatched = allToyProducts.filter(p => {
      const pCats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
      const pName = p.name.toLowerCase();
      
      const matchesCategory = pCats.some(c => {
        const clean = String(c).replace(/&amp;/g, '&').toLowerCase();
        return clean === targetName || clean === targetSlug || 
               (targetSlug === 'vehicles' && clean.includes('vehicle')) ||
               (targetSlug === 'dolls-accessories' && clean.includes('doll')) ||
               (targetSlug === 'puzzle-board-games' && clean.includes('puzzle')) ||
               (targetSlug === 'learning-education' && clean.includes('learning')) ||
               (targetSlug === 'baby-toddler-toys' && (clean.includes('baby') || clean.includes('toddler') || clean.includes('rattle')));
      });

      const matchesName = 
        (targetSlug === 'vehicles' && (pName.includes('car') || pName.includes('truck') || pName.includes('vehicle') || pName.includes('r/c') || pName.includes('rc'))) ||
        (targetSlug === 'dolls-accessories' && (pName.includes('doll') || pName.includes('barbie') || pName.includes('plush'))) ||
        (targetSlug === 'puzzle-board-games' && (pName.includes('puzzle') || pName.includes('board') || pName.includes('game') || pName.includes('chess') || pName.includes('ludo'))) ||
        (targetSlug === 'musical-toys' && (pName.includes('music') || pName.includes('piano') || pName.includes('guitar') || pName.includes('drum'))) ||
        (targetSlug === 'learning-education' && (pName.includes('learn') || pName.includes('book') || pName.includes('study') || pName.includes('telescope') || pName.includes('microscope') || pName.includes('clock'))) ||
        (targetSlug === 'baby-toddler-toys' && (pName.includes('baby') || pName.includes('toddler') || pName.includes('rattle') || pName.includes('teether') || pName.includes('hanging') || pName.includes('squeeze')));

      return matchesCategory || matchesName;
    });

    // If subcategory has few items, fallback to subset of all toys so grid is never empty
    if (tabMatched.length === 0) {
      return allToyProducts.slice(0, 12);
    }

    return tabMatched.slice(0, 12);
  }, [products, activeTab, toyTabs]);

  // GSAP animation on tab change or mount
  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.toy-product-card');
    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'power2.out', overwrite: 'auto' }
    );
  }, [activeTab, filteredProducts.length]);

  return (
    <section className="w-full max-w-[1680px] mx-auto px-4 md:px-8 mb-10 md:mb-16 font-sans">
      
      {/* Header: Title Left, View all Right */}
      <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1d293f] tracking-tight">
            Toys
          </h2>
        </div>

        <Link
          to="/category/toys"
          className="text-xs md:text-sm font-bold text-[#F0264C] hover:text-[#d01c3f] flex items-center gap-1.5 transition-all group shrink-0"
        >
          <span>View all</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Sub-Category Pill Tabs (Matching Reference Image) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {toyTabs.map((tab) => {
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

      {/* Product Grid (6 columns on desktop matching reference layout) */}
      <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {filteredProducts.map((product) => (
          <div key={`toy-${product.id}`} className="toy-product-card h-full flex">
            <ProductCard product={product} className="w-full h-full shadow-xs hover:shadow-lg transition-all" />
          </div>
        ))}
      </div>

    </section>
  );
};

export default ToysShowcase;
