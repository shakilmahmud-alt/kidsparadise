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
  Youtube
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
            to={`/category/${category.slug || encodeURIComponent(category.name)}`}
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
  const { cart, isAdmin, user, signOut, searchQuery, setSearchQuery, openCart, storeInfo, categories, products, userProfile, wishlist } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const categoryTree = useMemo(() => {
    return buildCategoryTree(categories);
  }, [categories]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [products, searchQuery]);

  // Sync search query with URL and close menus
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowResults(false);
  }, [location.pathname, location.search]);

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
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };

  return (
    <header className="w-full flex flex-col font-sans z-50 bg-white">
      
      {/* 1. Top Announcement Bar (Dismissible) */}
      {showTopBar && (
        <div className="bg-[#F0264C] text-white text-xs py-2 px-4 relative flex items-center justify-between z-50">
          <div className="container mx-auto flex items-center justify-center gap-2 font-medium tracking-wide">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase">Special Offer</span>
            <span>FREE Shipping across Bangladesh on orders over ৳2,999! 🚚</span>
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

      {/* 2. Top Utility Row */}
      <div className="hidden md:block bg-[#f8f9fa] border-b border-gray-200/80 py-2 px-4 md:px-8 text-xs text-gray-500">
        <div className="max-w-[1680px] mx-auto flex items-center justify-end">
          
          {/* Right: Currency, Language & Socials */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">
              <span>🇧🇩 Bangladesh (BDT ৳)</span>
            </div>
            <span>|</span>
            <div className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">
              <span>English</span>
            </div>
            <span>|</span>
            <div className="flex items-center gap-3 text-gray-400">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#F0264C] transition-colors"><Facebook size={13} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#F0264C] transition-colors"><Instagram size={13} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[#F0264C] transition-colors"><Youtube size={13} /></a>
            </div>
          </div>
        </div>
      </div>

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

          {/* Right: Actions (Phone Inquiry | Sign In | Compare | Wishlist | Cart) */}
          <div className="flex items-center gap-6 lg:gap-8">
            
            {/* Phone / Support Widget (Desktop) */}
            <a 
              href="tel:+8801797007260"
              className="hidden xl:flex items-center gap-3 text-gray-800 hover:text-[#F0264C] transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#F0264C] group-hover:scale-110 transition-transform">
                <Phone size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">(017) 9700-7260</span>
                <span className="text-[11px] text-gray-500">Available daily 09:00 to 22:00</span>
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
        <div className="container mx-auto flex items-center justify-between gap-4">
          
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src="https://kidsparadise.com.bd/wp-content/uploads/2026/08/kp-logo-1.1.png"
              alt="KidsParadise"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>

          {/* Compact Sticky Search */}
          <div className="flex-1 max-w-xl mx-4 relative">
            <div className="flex w-full bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="w-full px-4 py-1.5 text-xs text-gray-700 bg-transparent outline-none"
              />
              <button onClick={handleSearch} className="px-3 text-gray-500 hover:text-[#F0264C]">
                <Search size={15} />
              </button>
            </div>
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
