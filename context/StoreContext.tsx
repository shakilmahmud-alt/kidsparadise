
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Product, Category, Order, CartItem, AdminTab, Attribute, Variant, Brand, Coupon, ShippingSettings, Review, UserProfile, Address, StoreInfo, Page, Banner, HomeSection, BlogPost } from '../types';
import { supabase } from '../lib/supabase';

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
const SUPER_ADMIN_EMAIL = 'msmraqeeb@gmail.com';

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
      isActive: true,
      banner: {
        title: "100% Fresh Vegetables and Authentic Products",
        description: "Get the best quality products at the most affordable prices.",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
        buttonText: "Shop Now",
        link: "/products"
      }
    }
  ]);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({ insideDhaka: 80, outsideDhaka: 150 });
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: 'SMart',
    address: '1418 River Drive, Suite 35, Cottonhall, CA 96222',
    phone: '+0 123 456 789',
    email: 'support@smart.com',
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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appliedCoupon');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [adminTab, setAdminTab] = useState<AdminTab>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin' || user?.email === SUPER_ADMIN_EMAIL;

  const mapProduct = (p: any): Product => ({
    id: String(p.id),
    name: String(p.name || ''),
    price: Number(p.price || 0),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    category: String(p.category || 'General'),
    images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
    badge: p.badge, unit: p.unit,
    shortDescription: p.short_description, description: String(p.description || ''),
    sku: p.sku, slug: p.slug, brand: p.brand,
    isFeatured: Boolean(p.is_featured),
    variants: Array.isArray(p.variants) ? p.variants : [],
    filterAttributes: Array.isArray(p.filter_attributes) ? p.filter_attributes : []
  });

  const mapProductToDB = (p: Partial<Product>) => {
    const db: any = {};
    if (p.name !== undefined) db.name = p.name;
    if (p.price !== undefined) db.price = Number(p.price);
    if (p.originalPrice !== undefined) db.original_price = p.originalPrice ? Number(p.originalPrice) : null;
    if (p.category !== undefined) db.category = p.category;
    if (p.images !== undefined) db.images = p.images;
    if (p.badge !== undefined) db.badge = p.badge;
    if (p.unit !== undefined) db.unit = p.unit;
    if (p.shortDescription !== undefined) db.short_description = p.shortDescription;
    if (p.description !== undefined) db.description = p.description;
    if (p.sku !== undefined) db.sku = p.sku;
    if (p.slug !== undefined) db.slug = p.slug;
    if (p.brand !== undefined) db.brand = p.brand;
    if (p.isFeatured !== undefined) db.is_featured = p.isFeatured;
    if (p.variants !== undefined) db.variants = p.variants;
    if (p.filterAttributes !== undefined) db.filter_attributes = p.filterAttributes;
    return db;
  };

  const mapOrder = (o: any): Order => ({
    id: String(o.id),
    customerName: String(o.customer_name || 'Unknown'),
    customerEmail: o.customer_email || '',
    customerPhone: o.customer_phone || '',
    customerAddress: o.customer_address || '',
    customerDistrict: o.customer_district || '',
    customerArea: o.customer_area || '',
    date: String(o.date || new Date().toISOString()),
    total: Number(o.total || 0),
    subtotal: Number(o.subtotal || 0),
    shippingCost: Number(o.shipping_cost || 0),
    discount: Number(o.discount || 0),
    status: o.status || 'Pending',
    items: Array.isArray(o.items) ? o.items : [],
    coupon_code: o.coupon_code || undefined
  });

  const fetchData = async (activeUser?: any, skipPublicData = false) => {
    try {
      if (!skipPublicData) {
      const [pd, cat, br, coup, rev, set, attr, storeSettings, pagesRes, homeSectionsRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('brands').select('*').order('name', { ascending: true }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*').eq('key', 'shipping_fees').maybeSingle(),
        supabase.from('attributes').select('*').order('name', { ascending: true }),
        supabase.from('settings').select('*').eq('key', 'store_info').maybeSingle(),
        supabase.from('pages').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*').eq('key', 'home_sections').maybeSingle(),

      ]);

      // Fetch banners separately to avoid blocking
      const bannerRes = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
      const blogRes = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });

      if (pd.data) setProducts(pd.data.map(mapProduct));
      if (cat.data) setCategories(cat.data.map(c => ({ id: String(c.id), name: c.name, image: c.image_url || '', slug: c.slug, parentId: c.parent_id ? String(c.parent_id) : null, itemCount: Number(c.item_count || 0) })));
      if (br.data) setBrands(br.data.map(b => ({ id: String(b.id), name: b.name, slug: b.slug, logo_url: b.logo_url })));
      if (coup.data) setCoupons(coup.data.map(c => ({ id: String(c.id), code: c.code, discountType: c.discount_type, discountValue: Number(c.discount_value), minimumSpend: Number(c.minimum_spend || 0), expiryDate: String(c.expiry_date), status: c.status, autoApply: Boolean(c.auto_apply), createdAt: String(c.created_at) })));
      if (rev.data) setReviews(rev.data.map(rv => ({ id: String(rv.id), productId: String(rv.product_id), productName: String(rv.product_name), authorName: String(rv.author_name), rating: Number(rv.rating), comment: String(rv.comment), reply: rv.reply, createdAt: String(rv.created_at) })));
      if (set.data?.value) setShippingSettings(set.data.value);
      if (attr.data) setAttributes(attr.data.map(a => ({ id: String(a.id), name: a.name, values: Array.isArray(a.values) ? a.values : [] })));
      if (storeSettings.data?.value) setStoreInfo(storeSettings.data.value);
      if (pagesRes.data) setPages(pagesRes.data.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        content: p.content,
        isPublished: p.is_published,
        createdAt: p.created_at
      })));
      if (homeSectionsRes.data?.value) setHomeSections(homeSectionsRes.data.value);
      if (bannerRes.data) setBanners(bannerRes.data.map(b => ({
        id: String(b.id),
        type: b.type,
        title: b.title,
        subtitle: b.subtitle,
        image_url: b.image_url,
        link: b.link,
        sort_order: b.sort_order,
        is_active: b.is_active
      })));
      if (blogRes.data) setBlogPosts(blogRes.data.map(p => ({
        id: String(p.id),
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        author: p.author,
        date: new Date(p.created_at).toLocaleDateString(),
        imageUrl: p.image_url,
        slug: p.slug,
        tags: p.tags || []
      })));

      if (pd.data) setProducts(pd.data.map(mapProduct));
      if (cat.data) setCategories(cat.data.map(c => ({ id: String(c.id), name: c.name, image: c.image_url || '', slug: c.slug, parentId: c.parent_id ? String(c.parent_id) : null, itemCount: Number(c.item_count || 0) })));
      if (br.data) setBrands(br.data.map(b => ({ id: String(b.id), name: b.name, slug: b.slug, logo_url: b.logo_url })));
      if (coup.data) setCoupons(coup.data.map(c => ({ id: String(c.id), code: c.code, discountType: c.discount_type, discountValue: Number(c.discount_value), minimumSpend: Number(c.minimum_spend || 0), expiryDate: String(c.expiry_date), status: c.status, autoApply: Boolean(c.auto_apply), createdAt: String(c.created_at) })));
      if (rev.data) setReviews(rev.data.map(rv => ({ id: String(rv.id), productId: String(rv.product_id), productName: String(rv.product_name), authorName: String(rv.author_name), rating: Number(rv.rating), comment: String(rv.comment), reply: rv.reply, createdAt: String(rv.created_at) })));
      if (set.data?.value) setShippingSettings(set.data.value);
      if (attr.data) setAttributes(attr.data.map(a => ({ id: String(a.id), name: a.name, values: Array.isArray(a.values) ? a.values : [] })));
      if (storeSettings.data?.value) setStoreInfo(storeSettings.data.value);
      if (pagesRes.data) setPages(pagesRes.data.map((p: any) => ({
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        content: p.content,
        isPublished: p.is_published,
        createdAt: p.created_at
      })));
      if (bannerRes.data) setBanners(bannerRes.data.map(b => ({
        id: String(b.id),
        type: b.type,
        title: b.title,
        subtitle: b.subtitle,
        image_url: b.image_url,
        link: b.link,
        sort_order: b.sort_order,
        is_active: b.is_active
      })));
      } // end if (!skipPublicData)

      if (activeUser) {
        const [ord, usersList] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*').order('created_at', { ascending: false })
        ]);
        if (ord.data) setOrders(ord.data.map(mapOrder));
        if (usersList.data) setUsers(usersList.data);
      }
    } catch (error: any) {
      console.error('Critical fetch error:', error.message);
    }
  };

  const initializeAuth = async (sessionUser: any) => {
    try {
      setUser(sessionUser);
      if (sessionUser) {
        let { data: profile } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();

        if (!profile) {
          const { data: newProfile } = await supabase.from('profiles').upsert([{
            id: sessionUser.id,
            email: sessionUser.email,
            full_name: sessionUser.user_metadata?.full_name || '',
            role: sessionUser.email === SUPER_ADMIN_EMAIL ? 'admin' : 'customer'
          }], { onConflict: 'id' }).select().maybeSingle();
          profile = newProfile;
        }



        setUserProfile(profile || null);
        const [{ data: wishData }, { data: addrData }] = await Promise.all([
          supabase.from('wishlist').select('product_id').eq('user_id', sessionUser.id),
          supabase.from('addresses').select('*').eq('user_id', sessionUser.id)
        ]);
        if (wishData) setWishlist(wishData.map(w => String(w.product_id)));
        if (addrData) setAddresses(addrData.map(a => ({ id: String(a.id), fullName: a.full_name, phone: a.phone, addressLine: a.address_line, district: a.district, area: a.area })));

        await fetchData(sessionUser, true); // skip public data since we already fetched it
      } else {
        // Public data already fetched in useEffect, so nothing to do here
      }
    } catch (err) {
      console.error("Auth init error:", err);
    }
  };

  useEffect(() => {
    // Fetch public data instantly on load
    fetchData(null, false);

    // Track if we've already initialized to avoid double-firing
    let isInitialized = false;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (!isInitialized) {
          isInitialized = true;
          initializeAuth(session?.user || null).finally(() => setLoading(false));
        } else if (event === 'SIGNED_IN') {
          initializeAuth(session?.user || null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setAddresses([]);
        setUsers([]);
        setWishlist([]);
        setLoading(false);
      }
    });

    // Fallback in case INITIAL_SESSION doesn't fire (some older Supabase versions)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isInitialized) {
        isInitialized = true;
        initializeAuth(session?.user || null).finally(() => setLoading(false));
      }
    });
    return () => authListener.subscription.unsubscribe();
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

  useEffect(() => {
    if (appliedCoupon) {
      // Verification logic for existing coupon
      const currentCoupon = coupons.find(c => c.id === appliedCoupon.id);
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const today = new Date().toISOString().slice(0, 10);

      // 1. Coupon was deleted, deactivated, or criteria no longer met
      if (!currentCoupon || currentCoupon.status !== 'Active' || subtotal < currentCoupon.minimumSpend || currentCoupon.expiryDate < today) {
        setAppliedCoupon(null);
        return;
      }

      // 2. Auto-apply setting was turned off, and this was an auto-applied coupon
      if (appliedCoupon.isAutoApplied && !currentCoupon.autoApply) {
        setAppliedCoupon(null);
        return;
      }

      // 3. Sync data if coupon details changed (preserving isAutoApplied)
      if (JSON.stringify({ ...currentCoupon, isAutoApplied: appliedCoupon.isAutoApplied }) !== JSON.stringify(appliedCoupon)) {
        setAppliedCoupon({ ...currentCoupon, isAutoApplied: appliedCoupon.isAutoApplied });
      }
      return;
    }

    // Auto-apply logic (only runs if no coupon is applied)
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (subtotal === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const eligibleCoupon = coupons.find(c =>
      c.autoApply &&
      c.status === 'Active' &&
      subtotal >= c.minimumSpend &&
      c.expiryDate >= today
    );

    if (eligibleCoupon) {
      setAppliedCoupon({ ...eligibleCoupon, isAutoApplied: true });
    }
  }, [cart, coupons, appliedCoupon]);

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

    const orderData = {
      customer_name: customerDetails.fullName,
      customer_email: customerDetails.email,
      customer_phone: customerDetails.phone,
      customer_address: customerDetails.address,
      customer_district: customerDetails.district,
      customer_area: customerDetails.area,
      subtotal,
      shipping_cost: shippingCostValue,
      discount: discountAmount,
      total: totalValue,
      status: 'Pending',
      items: cart,
      coupon_code: appliedCoupon?.code,
      user_id: user?.id || null,
      date: new Date().toISOString()
    };

    const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
    if (error) throw new Error(error.message);

    const mappedOrder = mapOrder(data);

    // Asynchronously dispatch invoice emails in background
    try {
      fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order: mappedOrder })
      })
        .then(res => res.json())
        .then(resData => {
          console.log("Invoice email status:", resData);
        })
        .catch(err => {
          console.error("Invoice email API error:", err);
        });
    } catch (e) {
      console.warn("Error triggering invoice emails:", e);
    }

    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedCoupon');
    await fetchData(user);
    return mappedOrder;
  };

  const updateHomeSectionsInDB = async (newSections: HomeSection[]) => {
    const { error } = await supabase.from('settings').upsert({ key: 'home_sections', value: newSections });
    if (error) throw new Error(error.message);
    setHomeSections(newSections);
  };

  return (
    <StoreContext.Provider value={{
      products, categories, brands, orders, attributes, coupons, reviews, users, addresses, pages, blogPosts, banners, homeSections, wishlist, user, userProfile, shippingSettings, storeInfo, appliedCoupon, cart, isAdmin, adminTab, isCartOpen, loading,

      setAdminTab: (tab: AdminTab) => setAdminTab(tab), toggleAdmin: () => { }, addToCart, removeFromCart: (id) => setCart(cart.filter(i => (i.selectedVariantId ? `${i.id}-${i.selectedVariantId}` : i.id) !== id)),
      addHomeSection: async (section) => {
        const newSections = [...homeSections, { ...section, sortOrder: homeSections.length + 1 }];
        await updateHomeSectionsInDB(newSections);
      },
      updateHomeSection: async (id, section) => {
        const newSections = homeSections.map(s => s.id === id ? section : s);
        await updateHomeSectionsInDB(newSections);
      },
      deleteHomeSection: async (id) => {
        const newSections = homeSections.filter(s => s.id !== id);
        await updateHomeSectionsInDB(newSections);
      },
      updateQuantity: (id, d) => setCart(cart.map(i => {
        const itemKey = i.selectedVariantId ? `${i.id}-${i.selectedVariantId}` : i.id;
        if (itemKey === id) {
          return { ...i, quantity: Math.max(0, i.quantity + d) };
        }
        return i;
      }).filter(i => i.quantity > 0)),
      clearCart: () => setCart([]), openCart: () => setIsCartOpen(true), closeCart: () => setIsCartOpen(false),
      placeOrder, updateOrder: async (id, data) => {
        const { error } = await supabase.from('orders').update({
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          customer_address: data.customerAddress,
          customer_district: data.customerDistrict,
          customer_area: data.customerArea,
          status: data.status,
          items: data.items,
          shipping_cost: data.shippingCost,
          subtotal: data.subtotal,
          discount: data.discount,
          total: data.total
        }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateShippingSettings: async (s) => {
        const { error } = await supabase.from('settings').upsert({ key: 'shipping_fees', value: s });
        if (error) throw new Error(error.message);
        setShippingSettings(s);
      },
      updateStoreInfo: async (info) => {
        const { error } = await supabase.from('settings').upsert({ key: 'store_info', value: info });
        if (error) throw new Error(error.message);
        setStoreInfo(info);
      },
      addProduct: async (p) => {
        const { error } = await supabase.from('products').insert([mapProductToDB(p)]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateProduct: async (id, p) => {
        const { error } = await supabase.from('products').update(mapProductToDB(p)).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteProduct: async (id) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      addCategory: async (c) => {
        const { error } = await supabase.from('categories').insert([{ name: c.name, slug: c.slug, parent_id: c.parentId || null, image_url: c.image }]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateCategory: async (id, c) => {
        const { error } = await supabase.from('categories').update({ name: c.name, slug: c.slug, parent_id: c.parentId || null, image_url: c.image }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteCategory: async (id) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      addBrand: async (b) => {
        const { error } = await supabase.from('brands').insert([{ name: b.name, slug: b.slug, logo_url: b.logo_url }]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateBrand: async (id, b) => {
        const { error } = await supabase.from('brands').update({ name: b.name, slug: b.slug, logo_url: b.logo_url }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteBrand: async (id) => {
        const { error } = await supabase.from('brands').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateOrderStatus: async (id, status) => {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      addAttribute: async (n, v) => {
        const { error } = await supabase.from('attributes').insert([{ name: n, values: v }]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateAttribute: async (id, n, v) => {
        const { error } = await supabase.from('attributes').update({ name: n, values: v }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteAttribute: async (id) => {
        const { error } = await supabase.from('attributes').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      addCoupon: async (c) => {
        const { error } = await supabase.from('coupons').insert([{
          code: c.code,
          discount_type: c.discountType,
          discount_value: c.discountValue,
          minimum_spend: c.minimumSpend,
          expiry_date: c.expiryDate,
          status: c.status,
          auto_apply: c.autoApply
        }]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateCoupon: async (id, c) => {
        const { error } = await supabase.from('coupons').update({
          code: c.code,
          discount_type: c.discountType,
          discount_value: c.discountValue,
          minimum_spend: c.minimumSpend,
          expiry_date: c.expiryDate,
          status: c.status,
          auto_apply: c.autoApply
        }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteCoupon: async (id) => {
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      applyCoupon: (code) => {
        const c = coupons.find(cp => cp.code === code && cp.status === 'Active');
        if (!c) return "Invalid Code";
        setAppliedCoupon({ ...c, isAutoApplied: false });
        return null;
      },
      removeCoupon: () => setAppliedCoupon(null),
      addReview: async (r) => {
        const { error } = await supabase.from('reviews').insert([{ product_id: r.productId, product_name: r.productName, author_name: r.authorName, rating: r.rating, comment: r.comment }]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteReview: async (id) => {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      replyToReview: async (id, reply) => {
        const { error } = await supabase.from('reviews').update({ reply }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateUserRole: async (userId, role) => {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateProfile: async (id, fullName) => {
        const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', id);
        if (error) throw new Error(error.message);
        setUserProfile(prev => prev ? { ...prev, full_name: fullName } : null);
        await fetchData(user);
      },
      changePassword: async (p) => {
        const { error } = await supabase.auth.updateUser({ password: p });
        if (error) throw new Error(error.message);
      },
      addAddress: async (d) => {
        const { error } = await supabase.from('addresses').insert([{ user_id: user.id, full_name: d.fullName, phone: d.phone, address_line: d.addressLine, district: d.district, area: d.area }]);
        if (error) throw new Error(error.message);
        await initializeAuth(user);
      },
      updateAddress: async (id, d) => {
        const { error } = await supabase.from('addresses').update({ full_name: d.fullName, phone: d.phone, address_line: d.addressLine, district: d.district, area: d.area }).eq('id', id);
        if (error) throw new Error(error.message);
        await initializeAuth(user);
      },
      deleteAddress: async (id) => {
        const { error } = await supabase.from('addresses').delete().eq('id', id);
        if (error) throw new Error(error.message);
        setAddresses(prev => prev.filter(a => a.id !== id));
      },
      addPage: async (p) => {
        const { error } = await supabase.from('pages').insert([{
          title: p.title,
          slug: p.slug,
          content: p.content,
          is_published: p.isPublished
        }]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updatePage: async (id, p) => {
        const { error } = await supabase.from('pages').update({
          title: p.title,
          slug: p.slug,
          content: p.content,
          is_published: p.isPublished
        }).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deletePage: async (id) => {
        const { error } = await supabase.from('pages').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      addBanner: async (b) => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Attempting to add banner");
        console.log("User Email:", session?.user?.email);
        console.log("Profile Role:", userProfile?.role);

        // Use generic insert if specific RLS fails first time
        const { error } = await supabase.from('banners').insert([b]);
        if (error) {
          console.error("Supabase RLS Error:", error);
          throw error;
        }
        await fetchData(user);
      },
      updateBanner: async (id, b) => {
        const { error } = await supabase.from('banners').update(b).eq('id', id);
        if (error) {
          console.error("Supabase RLS Error:", error);
          throw error;
        }
        await fetchData(user);
      },
      addBlogPost: async (p) => {
        const { error } = await supabase.from('blog_posts').insert([{
          title: p.title,
          excerpt: p.excerpt,
          content: p.content,
          author: p.author,
          image_url: p.imageUrl,
          slug: p.slug,
          tags: p.tags
        }]);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      updateBlogPost: async (id, p) => {
        const updates: any = {};
        if (p.title) updates.title = p.title;
        if (p.excerpt) updates.excerpt = p.excerpt;
        if (p.content) updates.content = p.content;
        if (p.author) updates.author = p.author;
        if (p.imageUrl) updates.image_url = p.imageUrl;
        if (p.slug) updates.slug = p.slug;
        if (p.tags) updates.tags = p.tags;

        const { error } = await supabase.from('blog_posts').update(updates).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteBlogPost: async (id) => {
        const { error } = await supabase.from('blog_posts').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      deleteBanner: async (id) => {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData(user);
      },
      toggleWishlist: async (pId) => {
        if (!user) return;
        if (wishlist.includes(pId)) {
          await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: pId });
          setWishlist(prev => prev.filter(id => id !== pId));
        } else {
          await supabase.from('wishlist').insert([{ user_id: user.id, product_id: pId }]);
          setWishlist(prev => [...prev, pId]);
        }
      },
      signOut: async () => { await supabase.auth.signOut(); },
      refreshAllData: () => fetchData(user),
      searchQuery, setSearchQuery
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
