import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  ShoppingCart, 
  MessageCircle, 
  Star, 
  Plus, 
  Minus, 
  ChevronRight, 
  Info, 
  ChevronLeft,
  Heart,
  Share2,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Home
} from 'lucide-react';
import { Variant, Review } from '../types';
import ProductCard from '../components/ProductCard';
import { InlineImageZoom, ImageZoomModal } from '../components/ImageZoom';
import PageSkeleton from '../components/PageSkeleton';

const ProductDetails: React.FC = () => {
  const { slug } = useParams() as { slug: string };
  const navigate = useNavigate();
  const { products, addToCart, reviews, addReview, userProfile, wishlist, toggleWishlist, openCart, closeCart, categories, loading, isStoreLoaded } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedAttrValues, setSelectedAttrValues] = useState<Record<string, string>>({});
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string>('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
  const [shareCopied, setShareCopied] = useState(false);

  // Review state
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const product = products.find(p => p.slug === slug || p.id === slug);
  const productReviews = useMemo(() => reviews.filter(r => r.productId === product?.id), [reviews, product]);

  const isWishlisted = product ? wishlist.includes(product.id) : false;

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category.some(cat => product.category.includes(cat)) && p.id !== product.id)
      .slice(0, 4);
  }, [products, product]);

  const ratingStats = useMemo(() => {
    if (productReviews.length === 0) return { average: '0.0', total: 0, recommendedPercent: 0, starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number> };
    const total = productReviews.length;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageVal = sum / total;
    const average = averageVal.toFixed(1);
    const recommendedPercent = Math.round((averageVal / 5) * 100);

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(r => {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) {
        counts[rating]++;
      }
    });

    return { average, total, recommendedPercent, starCounts: counts };
  }, [productReviews]);

  // Group attributes for dynamic selection
  const attributeList = useMemo(() => {
    if (!product?.variants) return [];
    const attrs: Record<string, Set<string>> = {};
    product.variants.forEach(v => {
      if (v.attributeValues) {
        Object.entries(v.attributeValues as Record<string, string>).forEach(([name, val]) => {
          if (!attrs[name]) attrs[name] = new Set<string>();
          attrs[name].add(val);
        });
      }
    });
    return Object.entries(attrs).map(([name, values]) => ({ name, values: Array.from(values) }));
  }, [product]);

  const currentVariant = useMemo(() => {
    if (!product?.variants || Object.keys(selectedAttrValues).length === 0) return null;
    return product.variants.find(v =>
      Object.entries(selectedAttrValues).every(([name, val]) => v.attributeValues && v.attributeValues[name] === val)
    ) || null;
  }, [selectedAttrValues, product]);

  // Collect all unique gallery images (primary product images + all variant images)
  const allGalleryImages = useMemo<{ url: string; variant?: Variant; label?: string }[]>(() => {
    if (!product) return [];

    const items: { url: string; variant?: Variant; label?: string }[] = [];
    const seenUrls = new Set<string>();

    // 1. Primary product images
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img, idx) => {
        const cleanUrl = img?.trim();
        if (cleanUrl && !seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          items.push({
            url: cleanUrl,
            label: `Image ${idx + 1}`
          });
        }
      });
    }

    // 2. Variant images
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(v => {
        const cleanUrl = v.image?.trim();
        if (cleanUrl && !seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          const attrLabel = v.attributeValues ? Object.values(v.attributeValues).join(', ') : '';
          items.push({
            url: cleanUrl,
            variant: v,
            label: attrLabel || 'Variant'
          });
        }
      });
    }

    // Fallback placeholder if no image exists
    if (items.length === 0) {
      items.push({
        url: 'https://placehold.co/600x600?text=No+Image',
        label: 'Default'
      });
    }

    return items;
  }, [product]);

  // Synchronize activeImageUrl with product or selected variant
  useEffect(() => {
    if (currentVariant?.image) {
      setActiveImageUrl(currentVariant.image);
    } else if (allGalleryImages.length > 0) {
      setActiveImageUrl(prev => {
        if (prev && allGalleryImages.some(img => img.url === prev)) return prev;
        return allGalleryImages[0].url;
      });
    }
  }, [product?.id, currentVariant?.id, currentVariant?.image, allGalleryImages]);

  const activeImageIndex = useMemo(() => {
    const idx = allGalleryImages.findIndex(img => img.url === activeImageUrl);
    return idx >= 0 ? idx : 0;
  }, [allGalleryImages, activeImageUrl]);

  const handleSelectThumbnail = (item: { url: string; variant?: Variant; label?: string }) => {
    setActiveImageUrl(item.url);
    if (item.variant && item.variant.attributeValues) {
      setSelectedAttrValues(prev => ({
        ...prev,
        ...item.variant!.attributeValues
      }));
      setSelectionError(null);
    }
  };

  const handlePrevImage = () => {
    const prevIdx = activeImageIndex === 0 ? allGalleryImages.length - 1 : activeImageIndex - 1;
    handleSelectThumbnail(allGalleryImages[prevIdx]);
  };

  const handleNextImage = () => {
    const nextIdx = activeImageIndex === allGalleryImages.length - 1 ? 0 : activeImageIndex + 1;
    handleSelectThumbnail(allGalleryImages[nextIdx]);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (product?.variants?.length === 1) {
      setSelectedAttrValues(product.variants[0].attributeValues);
    }
  }, [product]);

  if ((loading || !isStoreLoaded || products.length === 0) && !product) {
    return <PageSkeleton type="product-details" />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
        <Link to="/" className="text-[#F0264C] font-bold hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.variants && product.variants.length > 0 && !currentVariant) {
      setSelectionError("Please select a variant first.");
      return;
    }
    setSelectionError(null);
    addToCart(product, currentVariant || undefined, quantity);

    const imgElement = document.querySelector('.product-gallery-main-image') as HTMLImageElement;
    if (imgElement) {
      const startRect = imgElement.getBoundingClientRect();
      const imageUrl = imgElement.src;
      window.dispatchEvent(new CustomEvent('fly-to-cart', {
        detail: { startRect, imageUrl }
      }));
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.variants && product.variants.length > 0 && !currentVariant) {
      setSelectionError("Please select a variant first.");
      return;
    }
    setSelectionError(null);
    addToCart(product, currentVariant || undefined, quantity, false);
    closeCart();
    navigate('/checkout');
  };

  const handleAttrSelect = (name: string, value: string) => {
    const newSelected = { ...selectedAttrValues, [name]: value };
    setSelectedAttrValues(newSelected);
    setSelectionError(null);

    // If there is a variant matching this attribute selection that has an image, switch active image
    if (product?.variants) {
      const matchedVariant = product.variants.find(v =>
        v.attributeValues && Object.entries(newSelected).every(([k, val]) => v.attributeValues[k] === val)
      );
      if (matchedVariant?.image) {
        setActiveImageUrl(matchedVariant.image);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      alert("Please select a star rating.");
      return;
    }
    if (!reviewComment.trim()) {
      alert("Please write a comment.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await addReview({
        productId: product.id,
        productName: product.name,
        authorName: userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Guest User',
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewComment('');
      setReviewRating(0);
      alert("Review submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayOriginalPrice = currentVariant ? currentVariant.originalPrice : product.originalPrice;

  // Primary Category Breadcrumb link
  const primaryCategoryName = product.category && product.category.length > 0 ? product.category[0] : '';
  const primaryCategory = categories.find(c => c.name.toLowerCase() === primaryCategoryName.toLowerCase());

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      
      {/* 1. Breadcrumbs Trail */}
      <div className="bg-white border-b border-gray-200/80 py-3 shadow-2xs">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-500">
            <Link to="/" className="hover:text-[#F0264C] transition-colors flex items-center gap-1">
              <Home size={13} /> Home
            </Link>
            {primaryCategoryName && (
              <>
                <ChevronRight size={12} className="text-gray-400" />
                <Link 
                  to={primaryCategory ? `/category/${primaryCategory.slug || encodeURIComponent(primaryCategory.name)}` : `/products?category=${encodeURIComponent(primaryCategoryName)}`} 
                  className="hover:text-[#F0264C] transition-colors"
                >
                  {primaryCategoryName.replace(/&amp;/g, '&')}
                </Link>
              </>
            )}
            <ChevronRight size={12} className="text-gray-400" />
            <span className="text-gray-800 font-semibold truncate max-w-[200px] sm:max-w-md">{product.name}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Product Hero Section (Matching Image 1) */}
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 md:p-10 shadow-2xs">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            
            {/* Gallery Section with Vertical Left Thumbnails (Matching User Reference Image 2) */}
            <div className="lg:w-1/2 flex flex-col-reverse md:flex-row gap-3 md:gap-4 items-start">
              
              {/* Left Column: Vertical Thumbnails (Image 2 style) */}
              {allGalleryImages.length > 1 && (
                <div 
                  data-lenis-prevent="true"
                  className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[520px] xl:max-h-[580px] pb-2 md:pb-0 md:pr-1 custom-scrollbar shrink-0 w-full md:w-20"
                >
                  {allGalleryImages.map((item, idx) => {
                    const isActive = activeImageIndex === idx;
                    return (
                      <button
                        key={`${item.url}-${idx}`}
                        onClick={() => handleSelectThumbnail(item)}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 shrink-0 p-1.5 bg-white transition-all cursor-pointer relative overflow-hidden group flex items-center justify-center ${
                          isActive 
                            ? 'border-gray-900 ring-2 ring-gray-900/20 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        title={item.label}
                      >
                        <img 
                          src={item.url} 
                          alt={item.label || product.name} 
                          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105" 
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main Image Container */}
              <div className="flex-1 min-w-0 w-full">
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs aspect-square flex items-center justify-center relative group">
                  <InlineImageZoom
                    imageUrl={activeImageUrl || allGalleryImages[0]?.url || ''}
                    altText={product.name}
                    onOpenModal={() => setIsZoomOpen(true)}
                  />
                  {allGalleryImages.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrevImage} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-[#F0264C] z-20 cursor-pointer"
                        title="Previous image"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={handleNextImage} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-[#F0264C] z-20 cursor-pointer"
                        title="Next image"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                {/* Fullscreen Zoom Modal */}
                <ImageZoomModal
                  imageUrl={activeImageUrl || allGalleryImages[0]?.url || ''}
                  altText={product.name}
                  isOpen={isZoomOpen}
                  onClose={() => setIsZoomOpen(false)}
                />
              </div>

            </div>

            {/* Product Summary / Purchase Column (Image 1 Layout) */}
            <div className="lg:w-1/2 space-y-4">
              
              {/* Title */}
              <h1 className="text-xl md:text-3xl font-extrabold text-[#1d293f] leading-snug tracking-tight">
                {product.name}
                {currentVariant && (
                  <span className="text-[#F0264C] font-bold text-lg md:text-2xl ml-2">
                    ({Object.values(currentVariant.attributeValues).join(', ')})
                  </span>
                )}
              </h1>

              {/* Price Display */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl md:text-4xl font-extrabold text-[#F0264C] tracking-tight">
                  ৳ {displayPrice.toLocaleString()}
                </span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <>
                    <span className="text-base md:text-xl text-gray-400 line-through font-medium">
                      ৳ {displayOriginalPrice.toLocaleString()}
                    </span>
                    <span className="bg-[#F0264C]/10 text-[#F0264C] text-xs font-black px-2 py-0.5 rounded-full uppercase">
                      Save {Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <div 
                  className="text-gray-600 text-sm md:text-[14.5px] leading-relaxed py-1.5"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              )}

              {/* Stock Status Pill Badge */}
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EAF7EE] text-[#1E8E3E] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#1E8E3E] animate-pulse"></span>
                  {currentVariant ? (currentVariant.stock > 0 ? `${currentVariant.stock} in stock` : 'Out of stock') : (product.stock ? `${product.stock} in stock` : 'In stock')}
                </span>
              </div>

              {/* Action Buttons: Wishlist & Share */}
              <div className="flex items-center gap-6 py-2 border-y border-gray-100">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    isWishlisted ? 'text-[#F0264C]' : 'text-gray-600 hover:text-[#F0264C]'
                  }`}
                >
                  <Heart size={16} className={isWishlisted ? 'fill-[#F0264C] text-[#F0264C]' : ''} />
                  <span>{isWishlisted ? 'WISHLISTED' : 'WISHLIST'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#F0264C] transition-colors cursor-pointer"
                >
                  <Share2 size={16} />
                  <span>{shareCopied ? 'LINK COPIED!' : 'SHARE'}</span>
                </button>
              </div>

              {/* Delivery & Perks highlights */}
              <div className="space-y-1.5 text-xs font-medium text-gray-600 py-1">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#1d293f]" strokeWidth={2.5} />
                  <span>Estimated Delivery : Up to 2-3 business days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#1d293f]" strokeWidth={2.5} />
                  <span>First Order : Get 10% Discount</span>
                </div>
              </div>

              {/* Guaranteed Safe And Secure Checkout Card */}
              <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200/80 text-center my-3">
                <p className="text-[11.5px] font-bold text-gray-700 mb-2">
                  Guaranteed Safe And Secure Checkout
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 opacity-90">
                  <span className="bg-[#1A1F71] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">VISA</span>
                  <span className="bg-[#EB001B] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">Mastercard</span>
                  <span className="bg-[#0079BE] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">AMEX</span>
                  <span className="bg-[#FF6600] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">Discover</span>
                  <span className="bg-[#003087] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">PayPal</span>
                  <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">Apple Pay</span>
                  <span className="bg-[#E2136E] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">bKash</span>
                  <span className="bg-[#F7941D] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">Nagad</span>
                </div>
              </div>

              {/* Attribute / Variant Selectors */}
              {attributeList.map(attr => (
                <div key={attr.name} className="space-y-2 py-1">
                  <span className="text-xs font-bold text-[#1d293f] uppercase tracking-wider block">
                    {attr.name}: <span className="text-[#F0264C] font-semibold">{selectedAttrValues[attr.name] || 'Select'}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((val) => {
                      const isActive = selectedAttrValues[attr.name] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => handleAttrSelect(attr.name, val)}
                          className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#F0264C] border-[#F0264C] text-white shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-[#F0264C]'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectionError && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in duration-200">
                  <Info size={16} />
                  {selectionError}
                </div>
              )}

              {/* Quantity & CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-3">
                {/* Quantity */}
                <div className="flex items-center justify-between border border-gray-200 rounded-xl overflow-hidden h-12 bg-gray-50/60 shrink-0 px-1">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))} 
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#F0264C] transition-colors cursor-pointer"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-800 text-sm">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(prev => prev + 1)} 
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#F0264C] transition-colors cursor-pointer"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 h-12 uppercase tracking-wide text-xs cursor-pointer ${
                    product.variants && product.variants.length > 0 && !currentVariant
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-white border-2 border-[#F0264C] text-[#F0264C] hover:bg-rose-50 shadow-2xs active:scale-98'
                  }`}
                >
                  <ShoppingCart size={16} />
                  Add To Cart
                </button>

                {/* Buy Now */}
                <button
                  onClick={handleBuyNow}
                  className={`flex-1 font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 h-12 uppercase tracking-wide text-xs text-white cursor-pointer ${
                    product.variants && product.variants.length > 0 && !currentVariant
                      ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-[#F0264C] hover:bg-[#d01c3f] shadow-xs active:scale-98'
                  }`}
                >
                  Buy Now
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* 3. Lower Description / Tabs Section (Matching Image 2) */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200/80 p-6 md:p-10 shadow-2xs">
          
          {/* Tab Navigation Header (Image 2 style) */}
          <div className="flex items-center justify-center gap-8 border-b border-gray-200 mb-8 pb-1">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-sm md:text-base font-bold transition-all relative cursor-pointer ${
                activeTab === 'description' 
                  ? 'text-[#1d293f] font-extrabold' 
                  : 'text-gray-500 hover:text-[#1d293f]'
              }`}
            >
              Description
              {activeTab === 'description' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0264C] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm md:text-base font-bold transition-all relative cursor-pointer ${
                activeTab === 'reviews' 
                  ? 'text-[#1d293f] font-extrabold' 
                  : 'text-gray-500 hover:text-[#1d293f]'
              }`}
            >
              Reviews ({productReviews.length})
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0264C] rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 text-sm md:text-base font-bold transition-all relative cursor-pointer ${
                activeTab === 'shipping' 
                  ? 'text-[#1d293f] font-extrabold' 
                  : 'text-gray-500 hover:text-[#1d293f]'
              }`}
            >
              Shipping & Return
              {activeTab === 'shipping' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F0264C] rounded-full"></span>
              )}
            </button>
          </div>

          {/* Tab 1: Normalized Description (Image 2 exact typography standard) */}
          {activeTab === 'description' && (
            <div className="product-custom-description max-w-4xl mx-auto">
              <div
                className="description-content"
                dangerouslySetInnerHTML={{ __html: product.description || "No detailed description available for this product." }}
              />

              {/* Scoped CSS to enforce exact font, sizing, uppercase headings & proper spacing regardless of what is pasted in admin */}
              <style>{`
                .product-custom-description .description-content {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
                  color: #4b5563 !important;
                  font-size: 14.5px !important;
                  line-height: 1.8 !important;
                }
                .product-custom-description .description-content * {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                .product-custom-description h1, 
                .product-custom-description h2, 
                .product-custom-description h3, 
                .product-custom-description h4, 
                .product-custom-description h5, 
                .product-custom-description h6 {
                  font-size: 16px !important;
                  font-weight: 800 !important;
                  color: #1d293f !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.02em !important;
                  border-bottom: 1px solid #e5e7eb !important;
                  padding-bottom: 8px !important;
                  margin-top: 28px !important;
                  margin-bottom: 14px !important;
                  display: block !important;
                  line-height: 1.4 !important;
                }
                .product-custom-description h1:first-child,
                .product-custom-description h2:first-child,
                .product-custom-description h3:first-child {
                  margin-top: 0 !important;
                }
                .product-custom-description p {
                  margin-bottom: 16px !important;
                  color: #4b5563 !important;
                  font-size: 14.5px !important;
                  line-height: 1.8 !important;
                }
                .product-custom-description strong,
                .product-custom-description b {
                  font-weight: 700 !important;
                  color: #1d293f !important;
                }
                .product-custom-description ul {
                  list-style-type: disc !important;
                  padding-left: 24px !important;
                  margin-bottom: 16px !important;
                  color: #4b5563 !important;
                }
                .product-custom-description ol {
                  list-style-type: decimal !important;
                  padding-left: 24px !important;
                  margin-bottom: 16px !important;
                  color: #4b5563 !important;
                }
                .product-custom-description li {
                  margin-bottom: 6px !important;
                  line-height: 1.7 !important;
                }
                .product-custom-description table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  margin-bottom: 20px !important;
                }
                .product-custom-description td,
                .product-custom-description th {
                  border: 1px solid #e5e7eb !important;
                  padding: 10px 14px !important;
                  font-size: 13.5px !important;
                }
                .product-custom-description th {
                  background-color: #f9fafb !important;
                  font-weight: 700 !important;
                  color: #1d293f !important;
                }
                .product-custom-description img {
                  max-width: 100% !important;
                  height: auto !important;
                  border-radius: 12px !important;
                  margin: 16px auto !important;
                }
              `}</style>
            </div>
          )}

          {/* Tab 2: Reviews */}
          {activeTab === 'reviews' && (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-100">
                {/* Stats */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-black text-[#F0264C]">{ratingStats.average}</span>
                    <div>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={16} className={i <= Math.round(Number(ratingStats.average)) ? "text-amber-400 fill-current" : "text-gray-200"} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-semibold">{ratingStats.total} Customer Reviews</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{ratingStats.recommendedPercent}% Recommended by our shoppers</p>
                </div>

                {/* Submit Form */}
                <div className="space-y-3 bg-gray-50/80 p-5 rounded-2xl border border-gray-200/70">
                  <h4 className="font-bold text-sm text-[#1d293f]">Leave a Review</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={18}
                          onClick={() => setReviewRating(i)}
                          className={`cursor-pointer transition-all hover:scale-110 ${i <= reviewRating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write your honest review..."
                    className="w-full border border-gray-200 rounded-xl p-3 h-20 text-xs outline-none focus:border-[#F0264C] bg-white resize-none"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="w-full bg-[#F0264C] hover:bg-[#d01c3f] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>

              {/* Review list */}
              {productReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No reviews yet for this product. Be the first to share your experience!
                </div>
              ) : (
                <div className="space-y-4">
                  {productReviews.map(rev => (
                    <div key={rev.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/40">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-xs text-gray-800">{rev.authorName}</span>
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={12} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Shipping & Return */}
          {activeTab === 'shipping' && (
            <div className="max-w-4xl mx-auto space-y-6 text-xs md:text-sm text-gray-600 leading-relaxed">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Truck size={20} className="text-[#F0264C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1d293f] mb-1">Fast Home Delivery Across Bangladesh</h4>
                  <p>Inside Dhaka: Delivery within 24 to 48 hours (৳60). Outside Dhaka: Delivery within 2 to 3 business days via standard courier (৳120).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <RotateCcw size={20} className="text-[#F0264C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1d293f] mb-1">7 Days Return & Replacement Policy</h4>
                  <p>If you receive a defective or wrong product, you can request an exchange or return within 7 days of receiving your parcel. Please keep the original box and invoice intact.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <ShieldCheck size={20} className="text-[#F0264C] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1d293f] mb-1">100% Authentic Product Guarantee</h4>
                  <p>All items sold at KidsParadise are genuine, baby-safe, and imported directly from verified brand manufacturers.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 4. Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-2xl font-black text-[#1d293f] tracking-tight">
                Related Products
              </h2>
              <Link 
                to={primaryCategory ? `/category/${primaryCategory.slug || encodeURIComponent(primaryCategory.name)}` : '/products'} 
                className="text-xs font-bold text-[#F0264C] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetails;
