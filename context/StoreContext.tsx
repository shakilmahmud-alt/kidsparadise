import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product, Category, Order, CartItem, AdminTab, Attribute, Variant, Brand, Coupon, ShippingSettings, Review, UserProfile, Address, StoreInfo, Page, Banner, HomeSection, BlogPost } from '../types';
import api, { getStoredUser } from '../lib/api';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  attributes: Attribute[];
  coupons: Coupon[];
  reviews: Review[];
  users: UserProfile[];
  addresses: Address[];
  pages: Page[];
  blogPosts: BlogPost[];
  addBlogPost: (post: Omit<BlogPost, 'id' | 'date'>) => Promise<void>;
  updateBlogPost: (id: string, post: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  banners: Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, banner: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  homeSections: HomeSection[];
  addHomeSection: (section: HomeSection) => Promise<void>;
  updateHomeSection: (id: string, section: HomeSection) => Promise<void>;
  deleteHomeSection: (id: string) => Promise<void>;

  wishlist: string[];
  user: any | null;
  userProfile: UserProfile | null;
  shippingSettings: ShippingSettings;
  storeInfo: StoreInfo;
  updateStoreInfo: (info: StoreInfo) => Promise<void>;
  appliedCoupon: Coupon | null;
  cart: CartItem[];
  isAdmin: boolean;
  adminTab: AdminTab;
  isCartOpen: boolean;
  loading: boolean;
  setAdminTab: (tab: AdminTab) => void;
  toggleAdmin: () => void;
  addToCart: (product: Product, variant?: Variant, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  placeOrder: (customerDetails: any) => Promise<Order>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<void>;
  updateShippingSettings: (settings: ShippingSettings) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addCategory: (categoryData: any) => Promise<void>;
  updateCategory: (id: string, categoryData: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addBrand: (brandData: Omit<Brand, 'id'>) => Promise<void>;
  updateBrand: (id: string, brandData: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  addAttribute: (name: string, values: any[]) => Promise<void>;
  updateAttribute: (id: string, name: string, values: any[]) => Promise<void>;
  deleteAttribute: (id: string) => Promise<void>;
  addCoupon: (couponData: any) => Promise<void>;
  updateCoupon: (id: string, couponData: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  applyCoupon: (code: string) => string | null;
  removeCoupon: () => void;
  addReview: (reviewData: any) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  replyToReview: (id: string, reply: string) => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'customer') => Promise<void>;
  updateProfile: (id: string, fullName: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  addAddress: (data: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  addPage: (page: Omit<Page, 'id' | 'createdAt'>) => Promise<void>;
  updatePage: (id: string, page: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([
    {
      id: 'hot-sale',
      title: "Today's Hot Sale",
      type: 'slider',
      filterType: 'sale',
      sortOrder: 1,
      isActive: true
    },
    {
      id: 'popular-items',
      title: "Popular Items",
      type: 'grid',
      filterType: 'all',
      sortOrder: 2,
      isActive: true
    }
  ]);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<any | null>(() => getStoredUser());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const u = getStoredUser();
    if (!u) return null;
    return {
      id: String(u.id),
      email: u.email,
      role: u.role || 'customer',
      full_name: u.full_name || '',
      created_at: u.created_at || new Date().toISOString()
    };
  });
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({ insideDhaka: 60, outsideDhaka: 120 });
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: 'KidsParadise',
    address: 'Dhaka, Bangladesh',
    phone: '+880 1711 111111',
    email: 'support@kidsparadise.com.bd',
    socials: {},
    floatingWidget: {
      isVisible: true,
      whatsapp: '',
      messenger: '',
      facebook: '',
      instagram: '',
      phone: '',
      supportImage: ''
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('appliedCoupon');
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const u = getStoredUser();
    return u?.role === 'admin';
  });
  const [adminTab, setAdminTab] = useState<AdminTab>('orders');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const data = await api.getStoreData();
      if (data.products) setProducts(data.products);
      if (data.categories) setCategories(data.categories);
      if (data.brands) setBrands(data.brands);
      if (data.coupons) setCoupons(data.coupons);
      if (data.reviews) setReviews(data.reviews);
      if (data.attributes) setAttributes(data.attributes);
      if (data.pages) setPages(data.pages);

      if (data.settings?.shipping_fees) {
        setShippingSettings(data.settings.shipping_fees);
      }
      if (data.settings?.store_info) {
        setStoreInfo(data.settings.store_info);
      }
      if (data.settings?.home_sections) {
        setHomeSections(data.settings.home_sections);
      }
    } catch (error: any) {
      console.warn('Store data fetch info (MySQL):', error.message);
    }
  };

  const fetchUserData = async () => {
    try {
      const userRes = await api.auth.getMe();
      if (userRes.user) {
        setUser(userRes.user);
        setUserProfile({
          id: String(userRes.user.id),
          email: userRes.user.email,
          role: userRes.user.role || 'customer',
          full_name: userRes.user.full_name || '',
          created_at: userRes.user.created_at || new Date().toISOString()
        });
        setIsAdmin(userRes.user.role === 'admin');

        // Fetch user specific data
        try {
          const [orderRes, addrRes, wishRes] = await Promise.all([
            api.getOrders(),
            api.getAddresses(),
            api.getWishlist()
          ]);
          if (orderRes.orders) setOrders(orderRes.orders);
          if (addrRes.addresses) setAddresses(addrRes.addresses);
          if (wishRes.productIds) setWishlist(wishRes.productIds);
        } catch (e) {
          console.warn("User personal data fetch error:", e);
        }
      }
    } catch (err) {
      // User is not logged in
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      await fetchUserData();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, variant?: Variant, quantity: number = 1) => {
    const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;
    setCart(prev => {
      const existing = prev.find(item => (item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : item.id) === cartItemId);
      if (existing) {
        return prev.map(item => (item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : item.id) === cartItemId
          ? { ...item, quantity: item.quantity + quantity }
          : item
        );
      }
      return [...prev, {
        ...product,
        quantity,
        selectedVariantId: variant?.id,
        selectedVariantName: variant ? Object.values(variant.attributeValues).join(' / ') : undefined,
        selectedVariantImage: variant?.image,
        price: variant ? variant.price : product.price
      }];
    });
    setIsCartOpen(true);
  };

  const placeOrder = async (customerDetails: any): Promise<Order> => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const isDhaka = customerDetails.district?.toLowerCase() === 'dhaka';
    const shippingCostValue = isDhaka ? shippingSettings.insideDhaka : shippingSettings.outsideDhaka;

    let discountAmount = 0;
    if (appliedCoupon) {
      discountAmount = appliedCoupon.discountType === 'Fixed' ? appliedCoupon.discountValue : (subtotal * appliedCoupon.discountValue / 100);
    }
    const totalValue = subtotal + shippingCostValue - discountAmount;

    const orderPayload = {
      customerName: customerDetails.fullName,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      customerAddress: customerDetails.address,
      customerDistrict: customerDetails.district,
      customerArea: customerDetails.area,
      subtotal,
      shippingCost: shippingCostValue,
      discount: discountAmount,
      total: totalValue,
      items: cart,
      couponCode: appliedCoupon?.code,
      paymentMethod: customerDetails.paymentMethod || 'Cash on Delivery'
    };

    const res = await api.placeOrder(orderPayload);
    const mappedOrder: Order = res.order;

    // Asynchronously dispatch invoice emails in background
    try {
      fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: mappedOrder })
      }).catch(err => console.warn("Invoice email error:", err));
    } catch (e) {
      console.warn("Error triggering invoice emails:", e);
    }

    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedCoupon');
    await fetchData();
    return mappedOrder;
  };

  return (
    <StoreContext.Provider value={{
      products, categories, brands, orders, attributes, coupons, reviews, users, addresses, pages, blogPosts, banners, homeSections, wishlist, user, userProfile, shippingSettings, storeInfo, appliedCoupon, cart, isAdmin, adminTab, isCartOpen, loading,
      setAdminTab: (tab: AdminTab) => setAdminTab(tab),
      toggleAdmin: () => setIsAdmin(!isAdmin),
      addToCart,
      removeFromCart: (id) => setCart(cart.filter(i => (i.selectedVariantId ? `${i.id}-${i.selectedVariantId}` : i.id) !== id)),
      addHomeSection: async (section) => {
        const newSections = [...homeSections, { ...section, sortOrder: homeSections.length + 1 }];
        await api.updateSetting('home_sections', newSections);
        setHomeSections(newSections);
      },
      updateHomeSection: async (id, section) => {
        const newSections = homeSections.map(s => s.id === id ? section : s);
        await api.updateSetting('home_sections', newSections);
        setHomeSections(newSections);
      },
      deleteHomeSection: async (id) => {
        const newSections = homeSections.filter(s => s.id !== id);
        await api.updateSetting('home_sections', newSections);
        setHomeSections(newSections);
      },
      updateQuantity: (id, d) => setCart(cart.map(i => {
        const itemKey = i.selectedVariantId ? `${i.id}-${i.selectedVariantId}` : i.id;
        if (itemKey === id) {
          return { ...i, quantity: Math.max(0, i.quantity + d) };
        }
        return i;
      }).filter(i => i.quantity > 0)),
      clearCart: () => setCart([]),
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      placeOrder,
      updateOrder: async (id, data) => {
        await api.updateOrder(id, data);
        await fetchData();
      },
      updateShippingSettings: async (s) => {
        await api.updateSetting('shipping_fees', s);
        setShippingSettings(s);
      },
      updateStoreInfo: async (info) => {
        await api.updateSetting('store_info', info);
        setStoreInfo(info);
      },
      addProduct: async (p) => {
        await api.addProduct(p);
        await fetchData();
      },
      updateProduct: async (id, p) => {
        await api.updateProduct(id, p);
        await fetchData();
      },
      deleteProduct: async (id) => {
        await api.deleteProduct(id);
        await fetchData();
      },
      addCategory: async (c) => {
        await api.addCategory(c);
        await fetchData();
      },
      updateCategory: async (id, c) => {
        await api.updateCategory(id, c);
        await fetchData();
      },
      deleteCategory: async (id) => {
        await api.deleteCategory(id);
        await fetchData();
      },
      addBrand: async (b) => {
        await api.addBrand(b);
        await fetchData();
      },
      updateBrand: async (id, b) => {
        // Brands update if needed
        await fetchData();
      },
      deleteBrand: async (id) => {
        await api.deleteBrand(id);
        await fetchData();
      },
      updateOrderStatus: async (id, status) => {
        await api.updateOrder(id, { status });
        await fetchData();
      },
      addAttribute: async (n, v) => {
        await fetchData();
      },
      updateAttribute: async (id, n, v) => {
        await fetchData();
      },
      deleteAttribute: async (id) => {
        await fetchData();
      },
      addCoupon: async (c) => {
        await api.addCoupon(c);
        await fetchData();
      },
      updateCoupon: async (id, c) => {
        await api.updateCoupon(id, c);
        await fetchData();
      },
      deleteCoupon: async (id) => {
        await api.deleteCoupon(id);
        await fetchData();
      },
      applyCoupon: (code) => {
        const c = coupons.find(cp => cp.code === code && cp.status === 'Active');
        if (!c) return "Invalid Code";
        setAppliedCoupon({ ...c, isAutoApplied: false });
        return null;
      },
      removeCoupon: () => setAppliedCoupon(null),
      addReview: async (r) => {
        await api.addReview(r);
        await fetchData();
      },
      deleteReview: async (id) => {
        await fetchData();
      },
      replyToReview: async (id, reply) => {
        await api.replyReview(id, reply);
        await fetchData();
      },
      updateUserRole: async (userId, role) => {
        await fetchData();
      },
      updateProfile: async (id, fullName) => {
        setUserProfile(prev => prev ? { ...prev, full_name: fullName } : null);
      },
      changePassword: async (p) => {
        // Change password endpoint
      },
      addAddress: async (d) => {
        await api.addAddress(d);
        await fetchUserData();
      },
      updateAddress: async (id, d) => {
        await fetchUserData();
      },
      deleteAddress: async (id) => {
        await api.deleteAddress(id);
        setAddresses(prev => prev.filter(a => a.id !== id));
      },
      addPage: async (p) => {
        await api.addPage(p);
        await fetchData();
      },
      updatePage: async (id, p) => {
        await api.updatePage(id, p);
        await fetchData();
      },
      deletePage: async (id) => {
        await api.deletePage(id);
        await fetchData();
      },
      addBanner: async (b) => {
        await fetchData();
      },
      updateBanner: async (id, b) => {
        await fetchData();
      },
      deleteBanner: async (id) => {
        await fetchData();
      },
      addBlogPost: async (p) => {
        await fetchData();
      },
      updateBlogPost: async (id, p) => {
        await fetchData();
      },
      deleteBlogPost: async (id) => {
        await fetchData();
      },
      toggleWishlist: async (pId) => {
        if (!user) return;
        if (wishlist.includes(pId)) {
          await api.removeFromWishlist(pId);
          setWishlist(prev => prev.filter(id => id !== pId));
        } else {
          await api.addToWishlist(pId);
          setWishlist(prev => [...prev, pId]);
        }
      },
      signOut: async () => {
        api.auth.logout();
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setAddresses([]);
        setWishlist([]);
      },
      refreshAllData: async () => {
        await Promise.all([fetchData(), fetchUserData()]);
      },
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
