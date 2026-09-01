import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface CategoryBanner {
  id: string;
  name: string;
  slug: string;
  bgColor: string;
  image: string;
}

export const CategorySlider: React.FC = () => {
  const { categories } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // 8 Parent Categories with KidsParadise brand color scheme (#F0264C and #000000)
  const parentCategories: CategoryBanner[] = useMemo(() => [
    {
      id: 'apparels',
      name: 'Apparels',
      slug: 'apparels',
      bgColor: 'bg-[#F0264C]', // Main brand red
      image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=500&q=90'
    },
    {
      id: 'toys',
      name: 'Toys',
      slug: 'toys',
      bgColor: 'bg-[#000000]', // Black
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=500&q=90'
    },
    {
      id: 'gear-travel',
      name: 'Gear & Travel',
      slug: 'gear-travel',
      bgColor: 'bg-[#B81432]', // Deep red
      image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=500&q=90'
    },
    {
      id: 'care-hygiene',
      name: 'Care & Hygiene',
      slug: 'baby-care-hygiene',
      bgColor: 'bg-[#111827]', // Charcoal / Dark Slate
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=500&q=90'
    },
    {
      id: 'furniture-bedding',
      name: 'Furniture & Bedding',
      slug: 'furniture-bedding',
      bgColor: 'bg-[#F0264C]', // Main brand red
      image: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=500&q=90'
    },
    {
      id: 'stationery',
      name: 'Stationery',
      slug: 'baby-stationery',
      bgColor: 'bg-[#000000]', // Black
      image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=500&q=90'
    },
    {
      id: 'mother-care',
      name: 'Mother Care',
      slug: 'mother-care',
      bgColor: 'bg-[#B81432]', // Deep red
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=500&q=90'
    },
    {
      id: 'others',
      name: 'Others',
      slug: 'others',
      bgColor: 'bg-[#111827]', // Charcoal
      image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=500&q=90'
    }
  ], []);

  // Card dimensions: width 220px, gap 16px
  const cardWidth = 220;
  const cardGap = 16;
  const slideStep = cardWidth + cardGap; // 236px

  // Number of cards visible simultaneously on desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Maximum slide step: 2 positions (Slide 0: Default full to right, Slide 1: Slid to left, right empty)
  const maxSlide = 1;

  const nextSlide = () => {
    setCurrentSlide(prev => (prev >= maxSlide ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev <= 0 ? maxSlide : prev - 1));
  };

  // How far the track shifts on slide:
  // On Slide 1: Shifts so the trailing cards move to left, leaving the right side empty!
  const shiftAmount = isDesktop ? 4 * slideStep : 2 * slideStep;

  return (
    <section className="w-full bg-white py-8 md:py-12 overflow-x-clip font-sans">
      <div className="max-w-[1680px] mx-auto px-4 md:px-8" ref={containerRef}>
        
        {/* Header Title: "Find your products" */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1d293f] tracking-tight">
              Find your products
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Browse top categories crafted for your baby and kids
            </p>
          </div>

          <Link 
            to="/products"
            className="text-xs md:text-sm font-bold text-[#F0264C] hover:underline flex items-center gap-1.5 transition-all group"
          >
            All Categories <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Carousel Viewport: By default fills to right margin, on slide moves to left margin leaving right side empty */}
        <div 
          className="relative overflow-visible"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className="flex transition-transform duration-700 ease-in-out gap-4 z-10"
            style={{
              transform: `translateX(-${currentSlide * shiftAmount}px)`
            }}
          >
            {parentCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                style={{ width: `${cardWidth}px` }}
                className={`h-[285px] flex-shrink-0 rounded-[18px] overflow-hidden ${cat.bgColor} shadow-sm group select-none relative flex flex-col justify-between p-4 cursor-pointer hover:shadow-md transition-all active:scale-98`}
              >
                {/* Clean Product Cut-out Photo */}
                <div className="w-full flex-1 flex items-center justify-center pt-2 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-[180px] object-cover rounded-xl group-hover:scale-106 transition-transform duration-500 pointer-events-none drop-shadow-md"
                  />
                </div>

                {/* Bottom Category Label (Matching reference Image 4 & 5) */}
                <div className="pt-3 pb-1 flex items-center justify-between">
                  <span className="text-white font-extrabold text-[15px] tracking-tight truncate group-hover:underline">
                    {cat.name}
                  </span>
                  <ChevronRight size={16} className="text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          {/* Controls: Pagination Dots + Navigation Arrows */}
          <div className="flex items-center gap-4 mt-6">
            {/* Dots */}
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
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevSlide}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-[#F0264C] hover:text-white text-gray-700 flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-xs"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextSlide}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-[#F0264C] hover:text-white text-gray-700 flex items-center justify-center transition-colors active:scale-95 cursor-pointer shadow-xs"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default CategorySlider;
