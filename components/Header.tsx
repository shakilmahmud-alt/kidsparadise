import React, { useMemo } from 'react';
import { Search, ShoppingCart, User, Phone, ChevronDown, LogOut, ChevronRight, Menu, X } from 'lucide-react';
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

const CategoryMenuItem: React.FC<{ category: CategoryNode }> = ({ category }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const hasChildren = category.children.length > 0;

  return (
    <div
      className="relative px-4 py-2 hover:bg-[#F43F5E] hover:text-white transition-colors cursor-pointer text-gray-700 text-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/category/${category.slug || encodeURIComponent(category.name)}`} className="flex items-center justify-between w-full">
        <span>{category.name}</span>
        {hasChildren && <ChevronRight size={14} className={`opacity-60 ${isHovered ? 'text-white' : ''}`} />}
      </Link>

      {/* Flyout Submenu */}
      {hasChildren && isHovered && (
        <div className="absolute left-full top-0 w-64 bg-white border border-gray-100 shadow-xl py-2 z-50 -ml-0.5 rounded-r-xl rounded-b-xl min-h-full">
          {category.children.map(child => (
            <CategoryMenuItem key={child.id} category={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const MobileCategoryItem: React.FC<{ category: CategoryNode; level: number; onClose: () => void }> = ({ category, level, onClose }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2 text-gray-600 hover:text-[#e92c5d] transition-colors cursor-pointer ${level === 0 ? 'px-4' : 'pr-4'}`}
        style={{ paddingLeft: level === 0 ? '16px' : `${level * 16 + 16}px` }}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          } else {
            // Let the Link click propagate
          }
        }}
      >
        {hasChildren ? (
          <div className="flex items-center justify-between w-full select-none">
            <span className={`text-sm ${level === 0 ? 'font-medium' : ''}`}>{category.name}</span>
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
            {/* Bullet point for leaf nodes */}
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></span>
            {category.name}
          </Link>
        )}
      </div>

      {/* Render Children if Expanded */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
  const { cart, isAdmin, user, signOut, searchQuery, setSearchQuery, openCart, storeInfo, categories, products, addToCart, userProfile } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSticky, setIsSticky] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);

  const categoryTree = useMemo(() => {
    const tree = buildCategoryTree(categories);
    return tree;
  }, [categories]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [products, searchQuery]);

  // Sync search query with URL and close menus
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowResults(false);

    // Parse search param from URL
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search');

    // If there's a search param, verify it matches state (optional, but good for refresh)
    // If NO search param, clear the search query
    if (!urlSearch) {
      setSearchQuery('');
    } else {
      setSearchQuery(urlSearch);
    }
  }, [location.pathname, location.search]);

  // Handle sticky header on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
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
      navigate(`/ products ? search = ${encodeURIComponent(searchQuery)} `);
      setShowResults(false);
    }
  };

  return (
    <header className="w-full flex flex-col font-sans z-50">
      {/* Main Header - Dark Green */}
      <div className="bg-black py-3 md:py-4 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Top Row on Mobile: Hamburger | Logo | Cart */}
            <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4">

              {/* Hamburger Menu Button (Mobile Only) */}
              <button
                className="md:hidden text-white p-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 cursor-auto">
                <div className="flex items-center">
                  {storeInfo.logo_url ? (
                    <img src={storeInfo.logo_url} alt={storeInfo.name} width="160" height="64" fetchPriority="high" className="h-10 md:h-16 w-auto object-contain" />
                  ) : (
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-lg flex items-center justify-center">
                      <ShoppingCart size={20} className="text-white md:w-7 md:h-7" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Mobile Cart Icon (Visible on small screens) */}
              <div className="flex md:hidden items-center gap-3 text-white">
                <button
                  onClick={openCart}
                  className="relative p-1 header-cart-icon"
                >
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#e92c5d]">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar - Full width on mobile, auto on desktop */}
            <div className="w-full md:w-auto md:flex-1 md:max-w-2xl order-last md:order-none mt-2 md:mt-0 relative z-50">
              <div className="flex w-full bg-white rounded-md overflow-hidden shadow-sm relative">
                <input
                  type="text"
                  placeholder="Type Your Products..."
                  className="w-full px-4 py-2.5 outline-none text-gray-600 text-sm"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow click
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#E92C5D] text-white px-4 md:px-6 font-semibold hover:bg-[#C81D4A] transition-all flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <Search size={18} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>

              {/* Live Search Results Dropdown */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-lg mt-1 border border-gray-100 divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {searchResults.map(product => (
                    <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group cursor-pointer">
                      <Link to={`/product/${product.slug}`} className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setShowResults(false)}>
                        <img src={product.images[0]} className="w-12 h-12 object-cover rounded border border-gray-100" alt={product.name} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 truncate group-hover:text-[#e92c5d] transition-colors">{product.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[#e92c5d] font-bold text-sm">৳{product.price}</span>
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
                        className="bg-gray-100 text-gray-600 hover:bg-[#e92c5d] hover:text-white p-2 rounded-full transition-all opacity-80 hover:opacity-100 hover:scale-105 active:scale-95"
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

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-6 text-white">
              <a 
                href={`tel:${storeInfo.phone && storeInfo.phone.trim().startsWith('0') ? '+88' + storeInfo.phone.trim() : storeInfo.phone}`}
                className="hidden lg:flex items-center gap-3 hover:text-[#e92c5d] transition-colors"
                title="Call Order Inquiry"
              >
                <Phone size={28} />
                <div className="flex flex-col">
                  <span className="text-[10px] opacity-90 leading-tight">Order inquiry</span>
                  <span className="font-bold text-sm">{storeInfo.phone}</span>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <button
                  onClick={openCart}
                  className="relative p-2 hover:bg-white/10 rounded-full transition-colors group header-cart-icon"
                >
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#e92c5d]">
                      {cartCount}
                    </span>
                  )}
                </button>

                {user ? (
                  <div className="flex items-center gap-2">
                    <Link to="/my-account" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="My Account">
                      <User size={24} />
                    </Link>
                    <button onClick={signOut} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Sign Out">
                      <LogOut size={24} />
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/30 transition-colors">
                    <User size={18} />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-header (Desktop) */}
      <div className={`${isSticky ? 'h-[60px]' : 'h-0'} transition-all duration-0 hidden md:block`}></div> {/* Placeholder to prevent jump */}
      <div className={`bg-white border-b border-gray-100 hidden md:block transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 w-full z-[60] shadow-md py-2 animate-slideDown' : 'py-3'} `}>
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between gap-4">

          <div className="flex items-center gap-8">
            {/* Sticky Logo */}
            <div className={`transition-all duration-300 overflow-hidden ${isSticky ? 'w-10 opacity-100 mr-2' : 'w-0 opacity-0'} `}>
              <Link to="/">
                {storeInfo.logo_url ? (
                  <img src={storeInfo.logo_url} alt={storeInfo.name} width="160" height="64" className="h-8 w-auto object-contain" />
                ) : (
                  <ShoppingCart size={24} className="text-[#e92c5d]" />
                )}
              </Link>
            </div>

            <div className="relative group text-left">
              <button className="flex items-center gap-2 bg-[#fdf2f5] text-[#e92c5d] px-4 py-1.5 rounded text-sm font-semibold border border-[#e92c5d]/10 hover:bg-[#fcebf0] transition-colors peer">
                All Categories
                <ChevronDown size={16} />
              </button>
              <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 rounded-xl shadow-xl py-2 opacity-0 invisible peer-hover:opacity-100 peer-hover:visible hover:opacity-100 hover:visible transition-all z-50">
                <Link to="/products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F43F5E] hover:text-white font-medium transition-colors">
                  All Products
                </Link>
                {categoryTree.map(cat => (
                  <CategoryMenuItem key={cat.id} category={cat} />
                ))}
              </div>
            </div>

            <nav className="flex gap-6 text-sm font-medium text-gray-600">
              <Link to="/" className={`${location.pathname === '/' ? 'text-[#e92c5d]' : 'hover:text-[#e92c5d]'} transition-colors`}>Home</Link>
              <Link to="/products" className={`${location.pathname === '/products' ? 'text-[#e92c5d]' : 'hover:text-[#e92c5d]'} transition-colors`}>Products</Link>
              <Link to="/my-account" className={`${location.pathname === '/my-account' ? 'text-[#e92c5d]' : 'hover:text-[#e92c5d]'} transition-colors`}>My Account</Link>
              <Link to="/about-us" className={`${location.pathname.startsWith('/about-us') ? 'text-[#e92c5d]' : 'hover:text-[#e92c5d]'} transition-colors`}>About Us</Link>
              <Link to="/contact-us" className={`${location.pathname.startsWith('/contact-us') ? 'text-[#e92c5d]' : 'hover:text-[#e92c5d]'} transition-colors`}>Contact Us</Link>
              {isAdmin && (
                <Link to="/admin" className={`${location.pathname.startsWith('/admin') ? 'text-[#e92c5d]' : 'hover:text-[#e92c5d]'} transition-colors font-bold`}>Dashboard</Link>
              )}
            </nav>
          </div>

          {/* Sticky Search */}
          <div className={`transition-all duration-300 ease-in-out relative ${isSticky ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'} `}>
            <div className="flex w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200 relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-1.5 outline-none bg-transparent text-gray-600 text-xs"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              <button className="bg-[#e92c5d] text-white px-3 hover:bg-[#c81d4a] transition-colors">
                <Search size={14} />
              </button>
            </div>

            {/* Live Search Results Dropdown (Sticky) */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-b-lg mt-1 border border-gray-100 divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {searchResults.map(product => (
                  <div key={product.id + 'sticky'} className="flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors group cursor-pointer">
                    <Link to={`/product/${product.slug}`} className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setShowResults(false)}>
                      <img src={product.images[0]} className="w-8 h-8 object-cover rounded border border-gray-100" alt={product.name} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-gray-800 truncate group-hover:text-[#e92c5d] transition-colors">{product.name}</h4>
                        <div className="flex items-center gap-1">
                          <span className="text-[#e92c5d] font-bold text-xs">৳{product.price}</span>
                          {product.originalPrice && <span className="text-gray-400 text-[10px] line-through">৳{product.originalPrice}</span>}
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
                      className="bg-gray-100 text-gray-600 hover:bg-[#e92c5d] hover:text-white p-1.5 rounded-full transition-all opacity-80 hover:opacity-100"
                      title="Add to Cart"
                    >
                      <ShoppingCart size={14} />
                    </button>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="p-2 text-center text-gray-500 text-xs italic">No products found</div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Menu (Drawer) */}
      {/* Mobile Menu (Side Drawer) */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>

        {/* Drawer Panel */}
        <div className={`absolute top-0 left-0 w-[80%] max-w-[300px] h-full bg-white shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Drawer Header */}
          <div className="bg-[#2a0c16] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {storeInfo.logo_url ? (
                <img src={storeInfo.logo_url} alt={storeInfo.name} width="160" height="64" className="h-8 w-auto object-contain brightness-0 invert" />
              ) : (
                <span className="text-white font-bold text-lg">zerobaby</span>
              )}
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Drawer Content */}
          <nav className="flex flex-col h-[calc(100%-64px)] overflow-y-auto">
            {user ? (
              <div className="bg-rose-50 p-6 border-b border-rose-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#e92c5d] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {userProfile?.full_name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{userProfile?.full_name || 'User'}</div>
                    <div className="text-xs text-gray-500">{userProfile?.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/my-account" className="flex-1 bg-white text-gray-700 py-2 rounded text-center text-xs font-bold border border-gray-200 shadow-sm" onClick={() => setIsMobileMenuOpen(false)}>My Account</Link>
                  <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="px-3 bg-red-50 text-red-500 py-2 rounded text-center text-xs font-bold border border-red-100">Sign Out</button>
                </div>
              </div>
            ) : (
              <div className="p-6 border-b border-gray-100">
                <Link to="/login" className="flex items-center justify-center gap-2 bg-[#e92c5d] text-white w-full py-3 rounded-lg font-bold shadow-lg shadow-rose-100 active:scale-95 transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} /> Login / Register
                </Link>
              </div>
            )}

            <div className="p-4 flex flex-col gap-1">
              <Link to="/" className="flex items-center justify-between px-4 py-3 text-gray-700 font-semibold hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/products" className="flex items-center justify-between px-4 py-3 text-gray-700 font-semibold hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                All Products
              </Link>
              <Link to="/about-us" className="flex items-center justify-between px-4 py-3 text-gray-700 font-semibold hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link to="/contact-us" className="flex items-center justify-between px-4 py-3 text-gray-700 font-semibold hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Contact Us
              </Link>
            </div>

            <div className="px-4 py-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 block">Categories</span>
              <div className="flex flex-col gap-1">
                {categoryTree.map(cat => (
                  <MobileCategoryItem key={cat.id} category={cat} level={0} onClose={() => setIsMobileMenuOpen(false)} />
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="mt-auto p-4 border-t border-gray-100">
                <Link to="/admin" className="block text-center font-bold text-[#e92c5d] bg-[#fdf2f5] py-3 rounded-lg border border-[#e92c5d]/20" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
