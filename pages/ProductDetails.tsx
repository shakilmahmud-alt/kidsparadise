
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, MessageCircle, PhoneCall, Star, Plus, Minus, ChevronRight, X, Info, Send, ChevronLeft } from 'lucide-react';
import { Variant, Review } from '../types';
import ProductCard from '../components/ProductCard';
import { InlineImageZoom, ImageZoomModal } from '../components/ImageZoom';
import PageSkeleton from '../components/PageSkeleton';

const ProductDetails: React.FC = () => {
  const { slug } = useParams() as { slug: string };
  const { products, addToCart, reviews, addReview, userProfile } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedAttrValues, setSelectedAttrValues] = useState<Record<string, string>>({});
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Review state
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const product = products.find(p => p.slug === slug);
  const productReviews = useMemo(() => reviews.filter(r => r.productId === product?.id), [reviews, product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category.some(cat => product.category.includes(cat)) && p.id !== product.id)
      .slice(0, 4);
  }, [products, product]);

  const ratingStats = useMemo(() => {
    if (productReviews.length === 0) return { average: 0, total: 0, recommendedPercent: 0, starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number> };
    const total = productReviews.length;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageVal = sum / total;
    const average = averageVal.toFixed(1);

    // User requested recommendation % to be based on the average rating score (e.g. 4.0 = 80%)
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
      Object.entries(v.attributeValues as Record<string, string>).forEach(([name, val]) => {
        if (!attrs[name]) attrs[name] = new Set<string>();
        attrs[name].add(val);
      });
    });
    return Object.entries(attrs).map(([name, values]) => ({ name, values: Array.from(values) }));
  }, [product]);

  const currentVariant = useMemo(() => {
    if (!product?.variants || Object.keys(selectedAttrValues).length === 0) return null;
    return product.variants.find(v =>
      Object.entries(selectedAttrValues).every(([name, val]) => v.attributeValues[name] === val)
    ) || null;
  }, [selectedAttrValues, product]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (product?.variants?.length === 1) {
      setSelectedAttrValues(product.variants[0].attributeValues);
    }
  }, [product]);

  // Related Products Drag to scroll logic
  const relatedScrollRef = React.useRef<HTMLDivElement>(null);
  const [isRelatedDragging, setIsRelatedDragging] = useState(false);
  const [relatedStartX, setRelatedStartX] = useState(0);
  const [relatedScrollLeft, setRelatedScrollLeft] = useState(0);

  const { loading } = useStore();

  if (loading && !product) {
    return <PageSkeleton type="product-details" />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
        <Link to="/" className="text-rose-500 font-bold hover:underline mt-4 inline-block">Return Home</Link>
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

  const handleAttrSelect = (name: string, value: string) => {
    setSelectedAttrValues(prev => ({ ...prev, [name]: value }));
    setSelectionError(null);
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

  // Pricing display standardized
  // When a variant is selected, use its specific price and originalPrice
  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayOriginalPrice = currentVariant ? currentVariant.originalPrice : product.originalPrice;

  const displayImages = product.images || [];
  const variantImage = currentVariant?.image;

  const handleRelatedMouseDown = (e: React.MouseEvent) => {
    if (!relatedScrollRef.current) return;
    setIsRelatedDragging(true);
    setRelatedStartX(e.pageX - relatedScrollRef.current.offsetLeft);
    setRelatedScrollLeft(relatedScrollRef.current.scrollLeft);
  };

  const handleRelatedMouseLeave = () => {
    setIsRelatedDragging(false);
  };

  const handleRelatedMouseUp = () => {
    setIsRelatedDragging(false);
  };

  const handleRelatedMouseMove = (e: React.MouseEvent) => {
    if (!isRelatedDragging || !relatedScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - relatedScrollRef.current.offsetLeft;
    const walk = (x - relatedStartX) * 2;
    relatedScrollRef.current.scrollLeft = relatedScrollLeft - walk;
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Gallery Section */}
          <div className="lg:w-1/2 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm aspect-square flex items-center justify-center relative group">
              <InlineImageZoom
                imageUrl={variantImage || displayImages[activeImageIdx] || ''}
                altText={product.name}
                onOpenModal={() => setIsZoomOpen(true)}
              />
              {displayImages.length > 1 && !variantImage && (
                <>
                  <button onClick={() => setActiveImageIdx(prev => (prev === 0 ? displayImages.length - 1 : prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500 z-20">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={() => setActiveImageIdx(prev => (prev === displayImages.length - 1 ? 0 : prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500 z-20">
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            {/* Fullscreen Zoom Modal */}
            <ImageZoomModal
              imageUrl={variantImage || displayImages[activeImageIdx] || ''}
              altText={product.name}
              isOpen={isZoomOpen}
              onClose={() => setIsZoomOpen(false)}
            />
            {/* Thumbnails */}
            {!variantImage && displayImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-20 h-20 rounded-xl border-2 shrink-0 p-2 bg-white transition-all ${activeImageIdx === idx ? 'border-rose-500 shadow-md' : 'border-gray-100 hover:border-rose-200'}`}
                  >
                    <img src={img} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            {variantImage && (
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Selected variant image shown</p>
            )}
          </div>

          <div className="lg:w-1/2 space-y-6">
            <div className="space-y-4">
              <span className="text-[11px] font-black text-[#e92c5d] uppercase tracking-[2px] bg-[#fdf2f5] px-4 py-1.5 rounded-full inline-block">
                {product.category.join(', ')}
              </span>
              <h1 className="text-xl md:text-4xl font-black text-gray-800 tracking-tight leading-tight flex flex-wrap items-center gap-2">
                {product.name}
                {currentVariant && (
                  <span className="text-[#e92c5d] font-bold">
                    ({Object.values(currentVariant.attributeValues).join(', ')})
                  </span>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-5 py-2">
              <span className="text-3xl md:text-5xl font-black text-[#e92c5d] flex items-center gap-1.5">
                <span className="text-xl md:text-3xl font-medium">৳</span>{displayPrice.toFixed(2)}
              </span>
              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <span className="text-xl md:text-3xl text-gray-300 line-through flex items-center gap-1.5 font-medium">
                  <span className="text-lg md:text-2xl">৳</span>{displayOriginalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Short Description Section Styled exactly as screenshot (Vertical Green Line) */}
            {product.shortDescription && (
              <div className="relative pl-4 md:pl-8 py-0.5 md:py-1 my-4 md:my-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-[#e92c5d] rounded-full"></div>
                <div
                  className="text-gray-600 italic prose prose-sm md:prose-base max-w-none font-medium prose-p:my-1 md:prose-p:my-3 prose-ul:my-1 md:prose-ul:my-3 prose-li:my-0 md:prose-li:my-1 [&>p]:text-[11px] md:[&>p]:text-[16px] [&>ul]:text-[11px] md:[&>ul]:text-[16px] [&>p]:leading-snug md:[&>p]:leading-relaxed [&>ul]:leading-snug md:[&>ul]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              </div>
            )}

            {/* Attribute Selectors Section */}
            {attributeList.map(attr => (
              <div key={attr.name} className="space-y-4 py-2">
                <span className="text-xs md:text-base font-black text-gray-800 uppercase tracking-widest block">{attr.name}</span>
                <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-4">
                  {attr.values.map((val) => {
                    const isActive = selectedAttrValues[attr.name] === val;
                    return (
                      <button
                        key={val}
                        onClick={() => handleAttrSelect(attr.name, val)}
                        className={`px-2 py-2.5 md:px-8 md:py-4 border-2 rounded-xl md:rounded-[15px] text-xs md:text-sm font-bold transition-all min-w-0 md:min-w-[110px] shadow-sm ${isActive
                          ? 'bg-[#e92c5d] border-[#e92c5d] text-white shadow-xl'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-[#e92c5d]'
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
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1 duration-300">
                <Info size={18} />
                {selectionError}
              </div>
            )}

            <div className="flex items-center gap-3 md:gap-6 pt-6">
              <div className="flex items-center border-2 border-gray-100 rounded-xl md:rounded-[20px] overflow-hidden h-12 md:h-16 shadow-sm bg-gray-50/50 shrink-0">
                <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="px-2 md:px-6 h-full hover:bg-white text-gray-400 hover:text-[#e92c5d] transition-colors"><Minus size={14} className="md:w-5 md:h-5" /></button>
                <span className="w-8 md:w-14 text-center font-black text-gray-800 text-base md:text-xl">{quantity}</span>
                <button onClick={() => setQuantity(prev => prev + 1)} className="px-2 md:px-6 h-full hover:bg-white text-gray-400 hover:text-[#e92c5d] transition-colors"><Plus size={14} className="md:w-5 md:h-5" /></button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 font-black py-3 md:py-5 px-3 md:px-10 rounded-xl md:rounded-[20px] transition-all flex items-center justify-center gap-2 md:gap-4 h-12 md:h-16 shadow-2xl uppercase tracking-widest text-[10px] md:text-sm whitespace-nowrap ${product.variants && product.variants.length > 0 && !currentVariant
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-[#e92c5d] hover:bg-[#c81d4a] text-white shadow-rose-100 active:scale-95'
                  }`}
              >
                <ShoppingCart size={16} className="md:w-5.5 md:h-5.5" />
                Add To Cart
              </button>
            </div>

            <div className="pt-10 border-t border-gray-100 flex flex-wrap gap-12">
              <div className="flex flex-col gap-1.5"><span className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">SKU</span><span className="text-sm font-bold text-gray-800">{currentVariant?.sku || product.sku || 'N/A'}</span></div>
              <div className="flex flex-col gap-1.5"><span className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Brand</span><span className="text-sm font-bold text-gray-800">{product.brand || 'Universal'}</span></div>
              <div className="flex flex-col gap-1.5"><span className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Unit</span><span className="text-sm font-bold text-gray-800">{product.unit || 'Piece'}</span></div>
            </div>
          </div>
        </div>

        {/* Detailed Info Section */}
        <div className="mt-8 md:mt-12 bg-white rounded-xl p-4 md:p-8 border border-gray-100 shadow-sm">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Product Details</h2>
            <div className="w-12 h-1 bg-[#e92c5d] rounded-full"></div>
          </div>
          <div
            className="text-gray-600 leading-relaxed text-[11px] md:text-sm [&>p]:mb-2 md:[&>p]:mb-4"
            dangerouslySetInnerHTML={{ __html: product.description || "No detailed description available for this product." }}
          />
        </div>

        {/* Reviews Section */}
        <div className="mt-12 md:mt-24">
          <div className="flex items-center justify-between mb-6 md:mb-12">
            <h2 className="text-xl md:text-3xl font-black text-[#e92c5d] uppercase tracking-tight">Customer Reviews</h2>
            <div className="hidden md:flex items-center gap-2 bg-[#fdf2f5] px-6 py-2 rounded-full">
              <Star size={18} className="text-yellow-400 fill-current" />
              <span className="text-lg font-black text-[#e92c5d]">{ratingStats.average} / 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
            {/* Left Column: Stats */}
            <div className="space-y-4 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <span className="text-6xl md:text-8xl font-black text-[#e92c5d] tracking-tighter leading-none">{Math.round(Number(ratingStats.average))}</span>
                <div className="space-y-0.5 md:space-y-1">
                  <div className="font-bold text-gray-800 uppercase text-[10px] md:text-xs tracking-[1px]">Store Rating</div>
                  <div className="flex text-gray-200 text-sm md:text-lg">
                    {/* Show 5 stars, fill based on rating */}
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={16} className={i <= Math.round(Number(ratingStats.average)) ? "text-yellow-400 fill-current" : "text-gray-200"} strokeWidth={2} />
                    ))}
                  </div>
                  <span className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest block pt-0.5">{ratingStats.total} Honest Reviews</span>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="text-xs md:text-sm font-bold text-gray-600 mb-2 md:mb-4">{ratingStats.recommendedPercent}% Recommended by our shoppers</div>
                {[5, 4, 3, 2, 1].map((star) => {
                  const percent = star * 20; // Static per requirements or calc real stats
                  return (
                    <div key={star} className="flex items-center gap-2 md:gap-4 group">
                      <span className="text-xs md:text-sm font-bold text-gray-800 w-3">{star}</span>
                      <Star size={12} className="text-gray-300" />
                      <div className="flex-1 h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#e92c5d] rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-gray-400 w-8 text-right">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-black text-gray-800 mb-1 uppercase tracking-tight">Share Your Thoughts</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your feedback helps others shop better.</p>
              </div>

              <div className="space-y-6">
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe your experience with this product..."
                  className="w-full border border-gray-200 rounded-xl p-4 h-32 outline-none focus:border-[#e92c5d] transition-all text-sm placeholder:text-gray-300 resize-none bg-gray-50/30"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Rate:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={24}
                          onClick={() => setReviewRating(i)}
                          className={`cursor-pointer transition-all hover:scale-110 active:scale-90 stroke-2 ${i <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="w-full sm:w-auto bg-[#e92c5d] hover:bg-[#c81d4a] text-white font-black py-4 px-10 rounded-xl transition-all text-[10px] uppercase tracking-[2px] shadow-lg disabled:opacity-50 active:scale-95"
                  >
                    {isSubmittingReview ? "Processing..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            {productReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No reviews found yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {productReviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#e92c5d] flex items-center justify-center text-white font-black text-sm shadow-md">
                          {rev.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{rev.authorName}</h4>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= rev.rating ? "currentColor" : "none"} className={i <= rev.rating ? "" : "text-gray-200"} />)}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed italic">"{rev.comment}"</p>

                    {rev.reply && (
                      <div className="mt-6 pl-6 border-l-2 border-[#e92c5d] py-2 bg-rose-50/30 rounded-r-xl">
                        <span className="text-[10px] font-black text-[#e92c5d] uppercase tracking-wider block mb-1">Reply</span>
                        <p className="text-gray-800 text-sm font-medium">"{rev.reply}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <h2 className="text-xl md:text-3xl font-black text-[#0f172a] uppercase tracking-widest mb-6 md:mb-12 text-center">Related Products</h2>
            <div
              ref={relatedScrollRef}
              onMouseDown={handleRelatedMouseDown}
              onMouseLeave={handleRelatedMouseLeave}
              onMouseUp={handleRelatedMouseUp}
              onMouseMove={handleRelatedMouseMove}
              className="flex overflow-x-auto gap-4 snap-x scrollbar-hide cursor-grab active:cursor-grabbing md:grid md:grid-cols-4 md:gap-6 md:overflow-visible"
            >
              {relatedProducts.map(p => (
                <div key={p.id} className="w-[47%] min-w-[47%] snap-center flex-none md:min-w-0 md:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
