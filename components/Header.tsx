import React, { useMemo, useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, User, Phone, ChevronDown, LogOut, 
  ChevronRight, Menu, X, Heart, Truck, Flame, Star, 
  Baby, Car, Gamepad2, Shirt, Sparkles, ShoppingBag, Package
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Category } from '../types';

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

const buildCategoryTree = (categories: Category[], parentId: string | null = null, level: number = 0): CategoryNode[] => {
  return categories
    .filter(cat => cat.parentId == parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id, level + 1),
      level
    }));
};

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('car') || n.includes('vehicle')) return <Car size={16} className="text-[#F0264C]" />;
  if (n.includes('toy') || n.includes('game') || n.includes('play')) return <Gamepad2 size={16} className="text-[#F0264C]" />;
  if (n.includes('fashion') || n.includes('cloth') || n.includes('apparel') || n.includes('boy') || n.includes('girl')) return <Shirt size={16} className="text-[#F0264C]" />;
  if (n.includes('feed') || n.includes('bottle') || n.includes('nurs')) return <Sparkles size={16} className="text-[#F0264C]" />;
  if (n.includes('care') || n.includes('hygiene') || n.includes('bath') || n.includes('skin')) return <Baby size={16} className="text-[#F0264C]" />;
  if (n.includes('gear') || n.includes('travel') || n.includes('stroller')) return <Package size={16} className="text-[#F0264C]" />;
  return <ShoppingBag size={16} className="text-[#F0264C]" />;
};

const CategoryMenuItem: React.FC<{ category: CategoryNode }> = ({ category }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div
      className="relative px-4 py-2.5 hover:bg-[#F0264C] hover:text-white transition-colors cursor-pointer text-gray-700 text-xs font-medium group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={`/category/${category.slug || encodeURIComponent(category.name)}`} 
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2.5">
          <span className="group-hover:text-white transition-colors">{getCategoryIcon(category.name)}</span>
          <span className="truncate">{category.name}</span>
        </div>
        {hasChildren && <ChevronRight size={14} className={`opacity-60 group-hover:text-white ${isHovered ? 'text-white' : ''}`} />}
      </Link>

      {/* Flyout Submenu to the right */}
      {hasChildren && isHovered && (
        <div className="absolute left-full top-0 w-64 bg-white border border-gray-200 shadow-2xl py-2 z-50 rounded-r-xl rounded-b-xl min-h-full">
          {category.children.map(child => (
            <CategoryMenuItem key={child.id} category={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const MobileCategoryItem: React.FC<{ category: CategoryNode; level: number; onClose: () => void }> = ({ category, level, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2 text-gray-700 hover:text-[#F0264C] transition-colors cursor-pointer ${level === 0 ? 'px-4 font-semibold' : 'pr-4'}`}
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
            <div className="flex items-center gap-2">
              {level === 0 && getCategoryIcon(category.name)}
              <span className={`text-sm ${level === 0 ? 'font-medium' : ''}`}>{category.name}</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        ) : (
          <Link
            to={`/category/${category.slug || encodeURIComponent(category.name)}`}
            className="flex items-center w-full text-sm py-1"
            onClick={onClose}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></span>
            {category.name}
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

const Header: React.FC = () => {
  const { 
    cart, isAdmin, user, signOut, searchQuery, setSearchQuery, 
    openCart, storeInfo, categories, products, addToCart, wishlist 
  } = useStore();
  
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showTopAnnouncement, setShowTopAnnouncement] = useState(true);

  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [products, searchQuery]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowResults(false);

    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search');
    if (!urlSearch) {
      setSearchQuery('');
    } else {
      setSearchQuery(urlSearch);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  return (
    <header className="w-full flex flex-col font-sans z-50 bg-white">
      {/* 1. Top Announcement Bar (Wokiee Blue / Primary style with Close button) */}
      {showTopAnnouncement && (
        <div className="bg-[#0284C7] text-white py-2 px-4 relative text-xs font-semibold overflow-hidden transition-all duration-300">
          <div className="container mx-auto flex items-center justify-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <Truck size={18} className="animate-bounce" />
              <span>FREE Shipping on Orders Over ৳2,000 across Bangladesh!</span>
            </div>
            <button 
              onClick={() => setShowTopAnnouncement(false)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-1 rounded transition-colors"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Utility/Info Bar (NO About us / Blog as requested) */}
      <div className="border-b border-gray-100 bg-[#FAFAFA] text-xs text-gray-500 hidden md:block">
        <div className="container mx-auto px-4 md:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome to KidsParadise Online Store!</span>
            <span className="text-gray-300">|</span>
            <span className="text-[#F0264C] font-semibold flex items-center gap-1">
              <Flame size={13} /> Hot Deals on Baby Gear & Toys
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-800 transition-colors">
              <span>🇧🇩 Bangladesh (BDT ৳)</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-800 transition-colors">
              <span>English</span>
            </div>
            <span className="text-gray-300">|</span>
            {/* Social Icons */}
            <div className="flex items-center gap-3 text-gray-400">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#F0264C] transition-colors" title="Facebook">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.615V8z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#F0264C] transition-colors" title="Instagram">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[#F0264C] transition-colors" title="YouTube">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Header Bar (Logo, Phone Callout, Actions) */}
      <div className="py-4 px-4 md:px-8 border-b border-gray-100">
        <div className="container mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          {/* Left: Mobile Hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-800 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-center">
              <img 
                src="https://kidsparadise.com.bd/wp-content/uploads/2025/08/cropped-kp-logo.png" 
                alt="Kids Paradise" 
                className="h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform" 
              />
            </Link>
          </div>

          {/* Center-Right (Desktop): Phone Callout & Account Actions */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Phone Callout */}
            <a 
              href={`tel:${storeInfo.phone || '+8801797007260'}`}
              className="flex items-center gap-3 group"
              title="Call Order Inquiry"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 text-[#F0264C] flex items-center justify-center group-hover:bg-[#F0264C] group-hover:text-white transition-all shadow-sm">
                <Phone size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-sm tracking-tight group-hover:text-[#F0264C] transition-colors">
                  {storeInfo.phone || '(880) 01797-007260'}
                </span>
                <span className="text-[11px] text-gray-400">Available daily 09:00 - 22:00</span>
              </div>
            </a>
          </div>

          {/* Right: Account, Wishlist, Cart */}
          <div className="flex items-center gap-4 md:gap-6 text-gray-700">
            {/* Sign In / Account */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/my-account" 
                  className="flex items-center gap-2 hover:text-[#F0264C] transition-colors text-xs font-semibold py-1.5 px-2 rounded hover:bg-gray-50"
                  title="My Account"
                >
                  <User size={20} className="text-gray-700 hover:text-[#F0264C]" />
                  <span className="hidden sm:inline font-bold">Account</span>
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="hidden sm:inline-block bg-rose-50 text-[#F0264C] border border-[#F0264C]/30 text-xs px-2.5 py-1 rounded font-bold hover:bg-[#F0264C] hover:text-white transition-all"
                  >
                    Dashboard
                  </Link>
                )}
                <button 
                  onClick={signOut} 
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors" 
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-2 hover:text-[#F0264C] transition-colors text-xs font-semibold py-1.5 px-2 rounded hover:bg-gray-50"
              >
                <User size={20} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link 
              to="/products?filter=wishlist" 
              className="flex items-center gap-1.5 hover:text-[#F0264C] transition-colors relative text-xs font-semibold"
              title="Wishlist"
            >
              <div className="relative">
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#F0264C] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">Wishlist</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center gap-2 hover:text-[#F0264C] transition-colors group header-cart-icon text-xs font-semibold bg-gray-50 hover:bg-rose-50/50 py-1.5 px-3 rounded-full border border-gray-200/80"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart size={20} className="text-gray-800 group-hover:text-[#F0264C] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#F0264C] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="hidden sm:inline text-[11px] text-gray-500 font-normal">Cart</span>
                <span className="hidden sm:inline font-bold text-gray-900 text-xs">৳{cartTotal}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Search & Category Row (Wokiee Full Width Search Bar) */}
      <div className="bg-white py-3 px-4 md:px-8 border-b border-gray-100">
        <div className="container mx-auto flex items-center gap-4">
          
          {/* Shop by Trigger Button (Desktop) */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <Link 
              to="/products" 
              className="flex items-center justify-between bg-[#F0264C] text-white px-4 py-3 rounded-t-lg font-bold text-sm shadow-md hover:bg-[#d81e42] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Menu size={20} />
                <span>Shop by Category</span>
              </div>
              <ChevronDown size={16} />
            </Link>
          </div>

          {/* Full-width Modern Search Bar */}
          <div className="flex-1 relative z-40">
            <div className="flex w-full bg-gray-100/90 rounded-lg overflow-hidden border border-gray-200 focus-within:border-[#F0264C] focus-within:bg-white transition-all shadow-inner">
              <input
                type="text"
                placeholder="Search over 4,000+ baby & kids products, toys, strollers, clothes..."
                className="w-full px-4 py-3 outline-none text-gray-800 text-sm bg-transparent placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 250)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-5 text-gray-500 hover:text-[#F0264C] transition-colors flex items-center justify-center"
                title="Search"
              >
                <Search size={20} />
              </button>
            </div>

            {/* Live Search Results Dropdown */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-b-xl mt-1 border border-gray-100 divide-y divide-gray-100 max-h-[420px] overflow-y-auto z-50">
                {searchResults.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-rose-50/40 transition-colors group cursor-pointer">
                    <Link to={`/product/${product.slug}`} className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setShowResults(false)}>
                      <img src={product.images[0]} className="w-12 h-12 object-cover rounded-lg border border-gray-100 shadow-sm" alt={product.name} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate group-hover:text-[#F0264C] transition-colors">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[#F0264C] font-bold text-sm">৳{product.price}</span>
                          {product.originalPrice && <span className="text-gray-400 text-xs line-through">৳{product.originalPrice}</span>}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.variants && product.variants.length > 0) {
                          setShowResults(false);
                          navigate(`/product/${product.slug}`);
                          return;
                        }
                        addToCart(product);
                        const imgElement = e.currentTarget.closest('.group')?.querySelector('img');
                        if (imgElement) {
                          const startRect = imgElement.getBoundingClientRect();
                          window.dispatchEvent(new CustomEvent('fly-to-cart', { 
                            detail: { startRect, imageUrl: product.images[0] } 
                          }));
                        }
                      }}
                      className="bg-gray-100 text-gray-600 hover:bg-[#F0264C] hover:text-white p-2 rounded-full transition-all"
                      title="Add to Cart"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm italic">No products found for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sticky Compact Nav Header */}
      {isSticky && (
        <div className="fixed top-0 left-0 w-full z-[60] bg-white/95 backdrop-blur-md shadow-md py-2.5 px-4 md:px-8 border-b border-gray-100 animate-slideDown">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <Link to="/">
              <img 
                src="https://kidsparadise.com.bd/wp-content/uploads/2025/08/cropped-kp-logo.png" 
                alt="Kids Paradise" 
                className="h-8 w-auto object-contain" 
              />
            </Link>

            <div className="flex-1 max-w-xl hidden sm:block relative">
              <div className="flex w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-1.5 outline-none bg-transparent text-xs text-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} className="px-3 text-gray-400 hover:text-[#F0264C]">
                  <Search size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/products" className="text-xs font-semibold text-gray-700 hover:text-[#F0264C]">All Products</Link>
              {isAdmin && (
                <Link to="/admin" className="text-xs font-bold text-[#F0264C]">Dashboard</Link>
              )}
              <button onClick={openCart} className="flex items-center gap-1 text-xs font-bold text-[#F0264C] bg-rose-50 px-3 py-1.5 rounded-full">
                <ShoppingCart size={16} />
                <span>৳{cartTotal}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer (Side Navigation) */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 w-[85%] max-w-[320px] h-full bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-black text-white">
            <img 
              src="https://kidsparadise.com.bd/wp-content/uploads/2025/08/cropped-kp-logo.png" 
              alt="Kids Paradise" 
              className="h-8 w-auto object-contain brightness-0 invert" 
            />
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-1 hover:bg-white/10 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            <div className="p-2">
              <span className="text-xs font-bold text-[#F0264C] uppercase tracking-wider block mb-2 px-2">Categories</span>
              <div className="flex flex-col gap-0.5">
                {categoryTree.map(cat => (
                  <MobileCategoryItem key={cat.id} category={cat} level={0} onClose={() => setIsMobileMenuOpen(false)} />
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/my-account" className="w-full text-center bg-gray-800 text-white py-2 rounded-lg text-sm font-semibold" onClick={() => setIsMobileMenuOpen(false)}>My Account</Link>
                {isAdmin && <Link to="/admin" className="w-full text-center bg-[#F0264C] text-white py-2 rounded-lg text-sm font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>}
                <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="text-xs text-red-500 font-bold py-1">Sign Out</button>
              </>
            ) : (
              <Link to="/login" className="w-full text-center bg-[#F0264C] text-white py-2.5 rounded-lg text-sm font-bold shadow-md" onClick={() => setIsMobileMenuOpen(false)}>Sign In / Register</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
