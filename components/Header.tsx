import React, { useMemo, useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Phone, 
  ChevronDown, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  Heart,
  Scale,
  SlidersHorizontal,
  Instagram,
  Facebook,
  Youtube,
  Shirt,
  Sparkles,
  Car,
  ShieldCheck,
  Layers,
  BookOpen,
  Package,
  Rocket,
  Star,
  Award,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Category } from '../types';
import { filterAndRankProducts } from '../lib/search';
import { slugify } from '../lib/category';

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

const getMainCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('apparel') || lower.includes('cloth') || lower.includes('fashion')) return <Shirt size={16} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('toy') || lower.includes('lego')) return <Sparkles size={16} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('gear') || lower.includes('travel') || lower.includes('stroller')) return <Car size={16} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('care & hygiene') || lower.includes('hygiene') || lower.includes('bath') || lower.includes('skin')) return <ShieldCheck size={16} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('furniture') || lower.includes('bed')) return <Layers size={16} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('stationery')) return <BookOpen size={16} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('mother')) return <Heart size={16} className="text-[#556885]" strokeWidth={1.8} />;
  if (lower.includes('other')) return <Package size={16} className="text-[#556885]" strokeWidth={1.8} />;
  return <ShoppingBag size={16} className="text-[#556885]" strokeWidth={1.8} />;
};

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

const MobileCategoryItem: React.FC<{ category: CategoryNode; level: number; onClose: () => void }> = ({ category, level, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2.5 text-gray-700 hover:text-[#F0264C] transition-colors cursor-pointer ${level === 0 ? 'px-4 font-semibold' : 'pr-4 font-normal'}`}
        style={{ paddingLeft: level === 0 ? '16px' : `${level * 16 + 16}px` }}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {hasChildren ? (
          <div className="flex items-center justify-between w-full select-none">
            <span className="text-sm">{category.name.replace(/&amp;/g, '&')}</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        ) : (
          <Link
            to={`/category/${category.slug || slugify(category.name)}`}
            className="flex items-center w-full text-sm"
            onClick={onClose}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></span>
            {category.name.replace(/&amp;/g, '&')}
          </Link>
        )}
      </div>

      {/* Render Children if Expanded */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {hasChildren && category.children.map((child: any) => (
          <MobileCategoryItem
            key={child.id}
            category={child}
            level={level + 1}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
};

export const Header: React.FC = () => {
  const { cart, isAdmin, user, signOut, searchQuery, setSearchQuery, openCart, storeInfo, categories, products, frontendProducts, userProfile, wishlist, attributes, isProductInStock, addToCart } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isStickyMenuOpen, setIsStickyMenuOpen] = useState(false);
  const [activeStickyCategory, setActiveStickyCategory] = useState<CategoryNode | null>(null);
  const [isHoveringStickyBrands, setIsHoveringStickyBrands] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  // Order parent categories matching sidebar
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

  // All Brands from database attributes (id: 3, name: 'Brands')
  const allBrands = useMemo(() => {
    const brandAttr = (attributes || []).find(a => a.name.toLowerCase() === 'brands');
    if (!brandAttr || !brandAttr.values) return [];
    
    return [...brandAttr.values].sort((a, b) => a.value.localeCompare(b.value));
  }, [attributes]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const source = frontendProducts || products;
    return filterAndRankProducts(source, searchQuery);
  }, [products, frontendProducts, searchQuery]);

  // Sync search query with URL, reset search on page change, and close menus
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsStickyMenuOpen(false);
    setShowResults(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Handle sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 140) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
      setShowResults(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="w-full flex flex-col font-sans z-50 bg-white">
      
      {/* 1. Top Announcement Bar (Dismissible) */}
      {showTopBar && (
        <div className="bg-[#F0264C] text-white text-xs py-2 px-4 relative flex items-center justify-between z-50">
          <div className="container mx-auto flex items-center justify-center gap-2 font-medium tracking-wide">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase">Special Offer</span>
            <span>Order online & get 10% Discount!</span>
          </div>
          <button 
            onClick={() => setShowTopBar(false)} 
            className="text-white/80 hover:text-white p-1 transition-colors"
            title="Dismiss Announcement"
          >
            <X size={14} />
          </button>
        </div>
      )}



      {/* 3. Main Header Bar (Logo | Support Phone | Sign In | Wishlist | Cart) */}
      <div className="bg-white py-4 md:py-5 px-4 md:px-8 border-b border-gray-100 shadow-sm relative">
        <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-6">

          {/* Left: Hamburger (Mobile) & Official KidsParadise Logo */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-800 p-1 hover:text-[#F0264C] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>

            {/* Official Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="https://kidsparadise.com.bd/wp-content/uploads/2026/08/kp-logo-1.1.png"
                alt="KidsParadise"
                className="h-10 md:h-14 w-auto object-contain"
                fetchPriority="high"
              />
            </Link>
          </div>

          {/* Desktop Search Bar (Visible on all pages except Homepage where HeroSection has its search bar) */}
          {location.pathname !== '/' && (
            <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8 relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex w-full bg-gray-100 rounded-full border border-gray-200 overflow-hidden focus-within:border-gray-400 focus-within:bg-white transition-all"
              >
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 250)}
                  className="w-full px-5 py-2.5 text-sm text-gray-700 bg-transparent outline-none"
                />
                <button
                  type="submit"
                  className="px-4 text-gray-500 hover:text-[#F0264C] transition-colors cursor-pointer"
                  title="Search"
                >
                  <Search size={18} />
                </button>
              </form>

              {/* Live Search Results Dropdown */}
              {showResults && searchQuery.trim().length >= 2 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 divide-y divide-gray-100 z-[200] overflow-hidden max-h-[440px] overflow-y-auto custom-scrollbar"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="px-4 py-2.5 bg-gray-50/90 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Found {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'}</span>
                    {searchResults.length > 0 && (
                      <button
                        onClick={handleSearch}
                        className="text-[#F0264C] font-bold hover:underline cursor-pointer"
                      >
                        View All
                      </button>
                    )}
                  </div>

                  {searchResults.slice(0, 6).map(product => (
                    <div
                      key={`main-search-${product.id}`}
                      className="flex items-center gap-3.5 p-3 hover:bg-rose-50/40 transition-colors cursor-pointer group"
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery('');
                        navigate(`/product/${product.slug || product.id}`);
                      }}
                    >
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/80'}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-[#F0264C] transition-colors leading-tight">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-[#F0264C]">৳{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[11px] text-gray-400 line-through">৳{product.originalPrice}</span>
                          )}
                          {isProductInStock(product) ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">In Stock</span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#F0264C] hover:text-white transition-all shrink-0"
                        title="Add to Cart"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  ))}

                  {searchResults.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Search size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-xs font-bold text-gray-700">No products found for "{searchQuery}"</p>
                      <p className="text-[11px] text-gray-400 mt-1">Try checking for typos or searching by category</p>
                      <button
                        onClick={() => {
                          navigate('/products');
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                        className="mt-3 text-xs font-bold text-[#F0264C] hover:underline cursor-pointer"
                      >
                        Browse all products →
                      </button>
                    </div>
                  ) : searchResults.length > 6 && (
                    <div className="p-3 bg-gray-50 text-center">
                      <button
                        onClick={handleSearch}
                        className="text-xs font-bold text-[#F0264C] hover:underline cursor-pointer"
                      >
                        View all {searchResults.length} results for "{searchQuery}" →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right: Actions (Phone Inquiry | Sign In | Compare | Wishlist | Cart) */}
          <div className="flex items-center gap-6 lg:gap-8">
            
            {/* Phone / Support Widget (Desktop) */}
            <a 
              href="tel:+8801726499168"
              className="hidden xl:flex items-center gap-3 text-gray-800 hover:text-[#F0264C] transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#F0264C] group-hover:scale-110 transition-transform">
                <Phone size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">+8801726499168</span>
                <span className="text-[11px] text-gray-500">Available daily 10am to 07pm</span>
              </div>
            </a>

            {/* Account / Sign In */}
            {user ? (
              <div className="relative group">
                <Link 
                  to="/my-account" 
                  className="flex items-center gap-2 text-gray-700 hover:text-[#F0264C] transition-colors py-1"
                >
                  <User size={22} className="text-gray-700" />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-900 leading-tight">
                      {userProfile?.full_name || 'My Account'}
                    </span>
                    <span className="text-[10px] text-gray-400">Account details</span>
                  </div>
                </Link>

                {/* Dropdown */}
                <div className="absolute right-0 top-full w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link to="/my-account" className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-[#F0264C]">
                    My Profile & Orders
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-xs font-bold text-[#F0264C] hover:bg-rose-50">
                      Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={signOut}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-2 text-gray-700 hover:text-[#F0264C] transition-colors"
              >
                <User size={22} className="text-gray-700" />
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Sign In</span>
              </Link>
            )}

            {/* Wishlist Link */}
            <Link 
              to="/my-account" 
              className="relative hidden sm:flex items-center gap-2 text-gray-700 hover:text-[#F0264C] transition-colors"
              title="Wishlist"
            >
              <div className="relative">
                <Heart size={22} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#F0264C] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Wishlist</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center gap-3 bg-[#000000] text-white hover:bg-[#F0264C] px-3.5 md:px-4 py-2 md:py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 header-cart-icon"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F0264C] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-[10px] text-white/80 uppercase font-medium">My Cart</span>
                <span className="text-xs font-black">৳{cartTotal}</span>
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* 4. Sticky Header Bar (Shows on scroll down) */}
      <div className={`fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-md py-2.5 px-4 md:px-8 z-[100] transition-all duration-300 ${
        isSticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Sticky "Shop by" Menu Bar */}
          <div className="flex items-center gap-3 relative">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src="https://kidsparadise.com.bd/wp-content/uploads/2026/08/kp-logo-1.1.png"
                alt="KidsParadise"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </Link>

            {/* Sticky Menu Button (Icon Only) */}
            <div className="relative">
              <button
                onClick={() => setIsStickyMenuOpen(!isStickyMenuOpen)}
                className="flex items-center justify-center bg-[#F0264C] text-white hover:bg-[#d01c3f] p-2 md:px-2.5 rounded-lg shadow-xs transition-all cursor-pointer select-none active:scale-95"
                title="Shop by Category"
              >
                <Menu size={18} strokeWidth={2.5} />
              </button>

              {/* Sticky "Shop by" Dropdown Menu (Exact Replica of Reference Image 2) */}
              {isStickyMenuOpen && (
                <div 
                  className="absolute left-0 top-full mt-2.5 w-[270px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[120] animate-in fade-in slide-in-from-top-2 duration-200"
                  onMouseLeave={() => {
                    setActiveStickyCategory(null);
                    setIsHoveringStickyBrands(false);
                  }}
                >
                  {/* Menu Header Banner */}
                  <div className="flex items-center justify-between bg-[#F0264C] text-white px-4 py-3 rounded-t-xl font-bold">
                    <span className="text-sm font-bold tracking-wide">Shop by</span>
                    <Menu size={18} className="text-white" strokeWidth={2.5} />
                  </div>

                  {/* Categories List */}
                  <nav className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
                    {orderedParentCategories.map((cat, idx) => {
                      const isHovered = activeStickyCategory?.id === cat.id;

                      return (
                        <div
                          key={`sticky-${cat.id}`}
                          className="relative group/stickyitem"
                          onMouseEnter={() => {
                            setActiveStickyCategory(cat);
                            setIsHoveringStickyBrands(false);
                          }}
                        >
                          <Link
                            to={`/category/${cat.slug || slugify(cat.name)}`}
                            onClick={() => setIsStickyMenuOpen(false)}
                            className={`flex items-center justify-between px-4 py-2.5 text-[13.5px] transition-colors ${
                              isHovered 
                                ? 'text-[#0072CE] font-bold bg-blue-50/60' 
                                : 'text-[#1d293f] font-semibold hover:text-[#0072CE]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {getMainCategoryIcon(cat.name)}
                              <span className="truncate">{cat.name.replace(/&amp;/g, '&')}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {idx === 0 && (
                                <span className="bg-[#FFCC00] text-black text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-[4px]">
                                  NEW
                                </span>
                              )}
                              {idx === 3 && (
                                <span className="bg-[#FF4D15] text-white text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-[4px]">
                                  HOT
                                </span>
                              )}
                              <ChevronRight size={14} className={`transition-transform text-gray-400 ${isHovered ? 'text-[#0072CE] translate-x-0.5' : ''}`} />
                            </div>
                          </Link>
                        </div>
                      );
                    })}

                    {/* New Arrivals */}
                    <Link
                      to="/products?filter=new"
                      onClick={() => setIsStickyMenuOpen(false)}
                      onMouseEnter={() => { setActiveStickyCategory(null); setIsHoveringStickyBrands(false); }}
                      className="flex items-center justify-between px-4 py-2.5 text-[13.5px] font-semibold text-[#1d293f] hover:text-[#0072CE] hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Rocket size={18} className="text-[#556885]" strokeWidth={1.8} />
                        <span>New Arrivals</span>
                      </div>
                    </Link>

                    {/* Best Sellers */}
                    <Link
                      to="/products?filter=bestseller"
                      onClick={() => setIsStickyMenuOpen(false)}
                      onMouseEnter={() => { setActiveStickyCategory(null); setIsHoveringStickyBrands(false); }}
                      className="flex items-center justify-between px-4 py-2.5 text-[13.5px] font-semibold text-[#1d293f] hover:text-[#0072CE] hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Star size={18} className="text-[#556885]" strokeWidth={1.8} />
                        <span>Best Sellers</span>
                      </div>
                    </Link>

                    {/* Brands */}
                    <div
                      className="relative group/stickyitem"
                      onMouseEnter={() => {
                        setIsHoveringStickyBrands(true);
                        setActiveStickyCategory(null);
                      }}
                    >
                      <Link
                        to="/products"
                        onClick={() => setIsStickyMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-2.5 text-[13.5px] transition-colors ${
                          isHoveringStickyBrands 
                            ? 'text-[#0072CE] font-bold bg-blue-50/60' 
                            : 'text-[#1d293f] font-semibold hover:text-[#0072CE]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Award size={18} className="text-[#556885]" strokeWidth={1.8} />
                          <span>Brands</span>
                        </div>
                        <ChevronRight size={14} className={`transition-transform text-gray-400 ${isHoveringStickyBrands ? 'text-[#0072CE] translate-x-0.5' : ''}`} />
                      </Link>
                    </div>
                  </nav>

                  {/* Footer of Menu */}
                  <div className="bg-white rounded-b-xl border-t border-gray-100 text-center py-2.5 text-[10px] text-gray-400">
                    KidsParadise Premium Store
                  </div>

                  {/* Flyout Submenu to the Right */}
                  {activeStickyCategory && activeStickyCategory.children && activeStickyCategory.children.length > 0 && (
                    <div 
                      className="absolute left-[270px] top-0 w-[420px] max-h-[460px] bg-white rounded-xl shadow-2xl p-6 border border-gray-200 z-[130] overflow-y-auto animate-in fade-in duration-150"
                      onMouseEnter={() => setActiveStickyCategory(activeStickyCategory)}
                      onMouseLeave={() => setActiveStickyCategory(null)}
                    >
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                        <h4 className="font-extrabold text-base text-[#1d293f]">
                          {activeStickyCategory.name.replace(/&amp;/g, '&')}
                        </h4>
                        <Link
                          to={`/category/${activeStickyCategory.slug || slugify(activeStickyCategory.name)}`}
                          onClick={() => setIsStickyMenuOpen(false)}
                          className="text-xs font-bold text-[#F0264C] hover:underline"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {activeStickyCategory.children.map((child: any) => (
                          <Link
                            key={child.id}
                            to={`/category/${child.slug || slugify(child.name)}`}
                            onClick={() => setIsStickyMenuOpen(false)}
                            className="text-xs text-gray-700 hover:text-[#0072CE] hover:font-bold py-1.5 px-2 rounded-lg hover:bg-blue-50/50 transition-all truncate block"
                          >
                            • {child.name.replace(/&amp;/g, '&')}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Brands Flyout to the Right */}
                  {isHoveringStickyBrands && allBrands.length > 0 && (
                    <div 
                      className="absolute left-[270px] top-0 w-[420px] max-h-[460px] bg-white rounded-xl shadow-2xl p-6 border border-gray-200 z-[130] overflow-y-auto animate-in fade-in duration-150"
                      onMouseEnter={() => setIsHoveringStickyBrands(true)}
                      onMouseLeave={() => setIsHoveringStickyBrands(false)}
                    >
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                        <h4 className="font-extrabold text-base text-[#1d293f]">Shop by Brands</h4>
                        <Link to="/products" onClick={() => setIsStickyMenuOpen(false)} className="text-xs font-bold text-[#F0264C] hover:underline">
                          All Brands
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {allBrands.slice(0, 24).map((brand: any) => (
                          <Link
                            key={brand.id || brand.value}
                            to={`/products?brand=${encodeURIComponent(brand.value)}`}
                            onClick={() => setIsStickyMenuOpen(false)}
                            className="text-xs text-gray-700 hover:text-[#0072CE] hover:font-bold py-1 px-2 rounded-lg hover:bg-blue-50/50 transition-all truncate block"
                          >
                            • {brand.value}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Compact Sticky Search */}
          <div className="flex-1 max-w-xl mx-4 relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex w-full bg-gray-100 rounded-full border border-gray-200 overflow-hidden focus-within:border-gray-400 focus-within:bg-white transition-all"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 250)}
                className="w-full px-4 py-1.5 text-xs text-gray-700 bg-transparent outline-none"
              />
              <button
                type="submit"
                className="px-3 text-gray-500 hover:text-[#F0264C] transition-colors cursor-pointer"
                title="Search"
              >
                <Search size={15} />
              </button>
            </form>

            {/* Live Search Results Dropdown (Sticky Header) */}
            {showResults && searchQuery.trim().length >= 2 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 divide-y divide-gray-100 z-[200] overflow-hidden max-h-[440px] overflow-y-auto custom-scrollbar"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-4 py-2.5 bg-gray-50/90 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>Found {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'}</span>
                  {searchResults.length > 0 && (
                    <button
                      onClick={handleSearch}
                      className="text-[#F0264C] font-bold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  )}
                </div>

                {searchResults.slice(0, 6).map(product => (
                  <div
                    key={`sticky-search-${product.id}`}
                    className="flex items-center gap-3.5 p-3 hover:bg-rose-50/40 transition-colors cursor-pointer group"
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery('');
                      navigate(`/product/${product.slug || product.id}`);
                    }}
                  >
                    <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/80'}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs md:text-sm font-bold text-gray-800 truncate group-hover:text-[#F0264C] transition-colors leading-tight">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-[#F0264C]">৳{product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[11px] text-gray-400 line-through">৳{product.originalPrice}</span>
                        )}
                        {isProductInStock(product) ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">In Stock</span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#F0264C] hover:text-white transition-all shrink-0"
                      title="Add to Cart"
                    >
                      <ShoppingCart size={15} />
                    </button>
                  </div>
                ))}

                {searchResults.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <Search size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-700">No products found for "{searchQuery}"</p>
                    <p className="text-[11px] text-gray-400 mt-1">Try checking for typos or searching by category</p>
                    <button
                      onClick={() => {
                        navigate('/products');
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                      className="mt-3 text-xs font-bold text-[#F0264C] hover:underline cursor-pointer"
                    >
                      Browse all products →
                    </button>
                  </div>
                ) : searchResults.length > 6 && (
                  <div className="p-3 bg-gray-50 text-center">
                    <button
                      onClick={handleSearch}
                      className="text-xs font-bold text-[#F0264C] hover:underline cursor-pointer"
                    >
                      View all {searchResults.length} results for "{searchQuery}" →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={openCart}
              className="relative p-2 bg-[#F0264C] text-white rounded-lg transition-transform active:scale-95"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* 5. Mobile Drawer Navigation */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`w-[300px] sm:w-[340px] bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <img
              src="https://kidsparadise.com.bd/wp-content/uploads/2026/08/kp-logo-1.1.png"
              alt="KidsParadise"
              className="h-8 w-auto object-contain"
            />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Status */}
          <div className="p-4 border-b border-gray-100 bg-rose-50/40">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-800">{userProfile?.full_name || 'Customer'}</div>
                  <div className="text-xs text-gray-500">{userProfile?.email}</div>
                </div>
                <button 
                  onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                  className="px-2.5 py-1 bg-red-100 text-red-600 rounded text-xs font-bold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#F0264C] text-white rounded-xl font-bold text-xs shadow-md"
              >
                <User size={16} /> Sign In / Register
              </Link>
            )}
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto py-3">
            <div className="px-4 pb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
              Browse Categories
            </div>
            <div className="divide-y divide-gray-50">
              {categoryTree.map(cat => (
                <MobileCategoryItem 
                  key={cat.id} 
                  category={cat} 
                  level={0} 
                  onClose={() => setIsMobileMenuOpen(false)} 
                />
              ))}
            </div>
          </div>

          {/* Drawer Footer */}
          {isAdmin && (
            <div className="p-4 border-t border-gray-100">
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center py-2.5 bg-rose-50 text-[#F0264C] font-bold text-xs rounded-xl border border-rose-200"
              >
                Admin Dashboard
              </Link>
            </div>
          )}

        </div>
      </div>

    </header>
  );
};

export default Header;
