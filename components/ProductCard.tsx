
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, ZoomIn } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import { ImageZoomModal } from './ImageZoom';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const navigate = useNavigate();
  const { addToCart, wishlist, toggleWishlist, user } = useStore();
  const isInWishlist = wishlist.includes(product.id);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isHovered && product.images && product.images.length > 1) {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
      }, 1000); // 1 second interval
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(intervalId);
  }, [isHovered, product.images]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to use wishlist");
      return;
    }
    toggleWishlist(product.id);
  };

  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : '';
  
  let optimizedImage = primaryImage;
  if (optimizedImage && optimizedImage.includes('ik.imagekit.io') && !optimizedImage.includes('tr=')) {
    optimizedImage += (optimizedImage.includes('?') ? '&' : '?') + 'tr=w-400';
  }
  
  // Refined Discount Logic: Selling price is product.price. Original price is product.originalPrice.
  // A discount ONLY exists if originalPrice is valid and greater than price.
  const isDiscounted = product.originalPrice !== undefined && product.originalPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <div className={`group border border-gray-100 rounded-xl bg-white overflow-hidden hover:shadow-lg transition-all duration-300 relative flex flex-col ${className}`}>
      {/* Top Left: Heart Icon */}
      <button 
        onClick={handleToggleWishlist}
        className={`absolute top-4 left-4 p-1.5 transition-all z-10 hover:scale-110 active:scale-95 ${isInWishlist ? 'text-red-500' : 'text-rose-500'}`}
      >
        <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
      </button>

      {/* Top Right: Discount Badge - Only if there's an ACTUAL discount */}
      {(product.badge || (isDiscounted && discountPercent > 0)) && (
        <span className="absolute top-4 right-4 bg-[#e92c5d] text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-sm tracking-widest">
          {product.badge || `${discountPercent}%`}
        </span>
      )}

      {/* Image Area */}
      <div 
        className="aspect-square w-full p-4 bg-transparent group-hover:bg-gray-50/50 transition-colors relative cursor-pointer overflow-hidden" 
        onClick={() => setIsZoomOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full relative flex items-center justify-center">
          {product.images && product.images.length > 0 ? (
            product.images.map((img, index) => {
              let optImg = img;
              if (optImg && optImg.includes('ik.imagekit.io') && !optImg.includes('tr=')) {
                optImg += (optImg.includes('?') ? '&' : '?') + 'tr=w-400';
              }
              return (
                <img 
                  key={index}
                  src={optImg} 
                  alt={`${product.name} - image ${index + 1}`} 
                  loading={index === 0 ? "lazy" : "eager"}
                  className={`absolute max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-all duration-700 ${
                    index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`} 
                />
              );
            })
          ) : (
            <img 
              src={optimizedImage} 
              alt={product.name} 
              loading="lazy"
              className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 absolute" 
            />
          )}
        </div>
        {/* Zoom indicator on hover */}
        <div className="absolute bottom-2 right-2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          <ZoomIn size={14} />
        </div>
      </div>
      {/* Zoom Modal */}
      <ImageZoomModal
        imageUrl={primaryImage}
        altText={product.name}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />

      {/* Content Area */}
      <div className="p-4 pt-0">
        {/* Price & Cart Row */}
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0">
            <span className="font-bold text-[#e92c5d] text-sm md:text-base flex items-baseline gap-0.5 leading-tight">
              <span className="text-xs md:text-sm font-medium">৳</span>{product.price.toFixed(2)}
            </span>
            {/* PERMANENT FIX: Strikethrough price only renders if it is strictly greater than the current selling price */}
            {isDiscounted && (
              <span className="text-[10px] md:text-xs text-gray-400 line-through leading-tight">
                ৳{product.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (product.variants && product.variants.length > 0) {
                navigate(`/product/${product.slug}`);
                return;
              }
              addToCart(product);
              const imgElement = e.currentTarget.closest('.group')?.querySelector('img');
              if (imgElement) {
                const startRect = imgElement.getBoundingClientRect();
                window.dispatchEvent(new CustomEvent('fly-to-cart', { 
                  detail: { startRect, imageUrl: primaryImage } 
                }));
              }
            }}
            className="relative z-20 w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-full border border-gray-200 flex items-center justify-center text-[#e92c5d] hover:bg-[#e92c5d] hover:text-white hover:border-[#e92c5d] transition-all before:absolute before:-inset-3 before:content-[''] touch-manipulation"
          >
            <ShoppingCart size={16} className="pointer-events-none" />
          </button>
        </div>

        {/* Product Name Below Price */}
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="text-[13px] font-medium text-gray-700 leading-tight hover:text-[#e92c5d] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
