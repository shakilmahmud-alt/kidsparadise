
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Package, ShoppingBag, Plus, Trash2, X, ShieldCheck, Pencil,
  Ticket, Eye, Truck, RefreshCw, Layers, Zap, Users as UsersIcon,
  Globe, PlusCircle, Image as ImageIcon, Save, AlertTriangle,
  ChevronDown, MessageSquare, Star, ChevronRight, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown, Minus,
  Settings as SettingsIcon, Search, Edit3, Check, Database, Copy, Printer, Calendar, BarChart3, FileText, LayoutTemplate, Upload, BookOpen
} from 'lucide-react';
import { Product, Category, Order, Variant, ShippingSettings, Brand, Coupon, CartItem, StoreInfo, Page, HomeSection, BlogPost } from '../types';
import { PageBuilder } from '../components/PageBuilder';
import RichTextEditor from '../components/RichTextEditor';
import { DISTRICT_AREA_DATA } from '../constants';
import ProductImageUpload from '../components/ProductImageUpload';
import { uploadToImageKit } from '../lib/imagekit';
import MediaManager from '../components/MediaManager';



const Admin: React.FC = () => {
  const {
    products, orders, coupons, categories, attributes, users, brands, shippingSettings, reviews, pages,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    addCoupon, updateCoupon, deleteCoupon,
    addAttribute, updateAttribute, deleteAttribute,
    updateOrderStatus, addBrand, updateBrand, deleteBrand, updateUserRole,
    updateShippingSettings, refreshAllData, updateOrder, deleteReview, replyToReview,
    storeInfo: currentStoreInfo, updateStoreInfo,
    addPage, updatePage, deletePage,
    banners, addBanner, updateBanner, deleteBanner,
    homeSections, addHomeSection, updateHomeSection, deleteHomeSection,
    blogPosts, addBlogPost, updateBlogPost, deleteBlogPost,
    showZeroStockFrontend, setShowZeroStockFrontend
  } = useStore();

  const { tab } = useParams();
  const navigate = useNavigate();
  const [adminTab, setAdminTabInternal] = useState<string>(tab || 'products');

  useEffect(() => {
    if (tab && tab !== adminTab) {
      setAdminTabInternal(tab);
    }
  }, [tab]);

  const setAdminTabState = (newTab: string) => {
    setAdminTabInternal(newTab);
    navigate(`/admin/${newTab}`);
  };
  const [isSyncing, setIsSyncing] = useState(false);

  // Products Table Search, Filters, Sort & Pagination States
  const [prodSearch, setProdSearch] = useState('');
  const [prodFilterCat, setProdFilterCat] = useState('');
  const [prodFilterSubCat, setProdFilterSubCat] = useState('');
  const [prodFilterStatus, setProdFilterStatus] = useState('all');
  const [prodFilterBrand, setProdFilterBrand] = useState('');
  const [prodSortColumn, setProdSortColumn] = useState<'product' | 'price' | 'stock' | null>(null);
  const [prodSortDirection, setProdSortDirection] = useState<'asc' | 'desc'>('asc');
  const [prodPage, setProdPage] = useState(1);
  const itemsPerPage = 30;
  const [copySuccess, setCopySuccess] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const handleImageError = (id: string) => setBrokenImages(prev => ({ ...prev, [id]: true }));

  // Forms Visibility & Data
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeImagePickerIdx, setActiveImagePickerIdx] = useState<number | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderData, setEditingOrderData] = useState<Order | null>(null);

  // Product Selector for Order Editing
  const [orderProductSearch, setOrderProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Form States
  const [prodForm, setProdForm] = useState({
    name: '', basePrice: '', salePrice: '', category: [] as string[], description: '', shortDescription: '', images: [] as string[],
    unit: '', sku: '', brand: '', isFeatured: false, variants: [] as Variant[], tempAttributes: [] as { name: string, options: string[] }[]
  });

  const [catForm, setCatForm] = useState({ name: '', parentId: '' as string | null, image: '' });
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', logo_url: '' });

  // Global Attributes Form State
  const [attrForm, setAttrForm] = useState({ name: '' });
  const [attrValuesInput, setAttrValuesInput] = useState('');

  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id' | 'createdAt'>>({
    code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false
  });
  const [shipForm, setShipForm] = useState<ShippingSettings>(shippingSettings);
  const [storeForm, setStoreForm] = useState<StoreInfo>({ name: '', logo_url: '', address: '', phone: '', email: '', socials: {} });
  const [pageForm, setPageForm] = useState<Omit<Page, 'id' | 'createdAt'>>({ title: '', slug: '', content: '', isPublished: true });
  const [bannerForm, setBannerForm] = useState<{ type: 'slider' | 'right_top' | 'right_bottom'; title: string; subtitle: string; image_url: string; link: string; align: 'left' | 'right'; color: 'light' | 'dark'; show_btn: boolean; desc: string; sort_order: number; is_active: boolean }>({
    type: 'slider', title: '', subtitle: '', image_url: '', link: '', align: 'left', color: 'light', show_btn: true, desc: '', sort_order: 0, is_active: true
  });
  const [sectionForm, setSectionForm] = useState<Omit<HomeSection, 'id'>>({
    title: '', type: 'slider', filterType: 'all', sortOrder: 0, isActive: true,
    banner: { title: '', description: '', imageUrl: '', buttonText: 'Shop Now', link: '/products' },
    banners: []
  });
  const [blogForm, setBlogForm] = useState<Omit<BlogPost, 'id' | 'date'>>({
    title: '', excerpt: '', content: '', author: '', imageUrl: '', slug: '', tags: []
  });

  // Update forms when data is loaded
  useEffect(() => {
    setShipForm(shippingSettings);
  }, [shippingSettings]);

  useEffect(() => {
    setStoreForm(currentStoreInfo);
  }, [currentStoreInfo]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [adminTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Report States
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Report Calculations
  const reportData = useMemo(() => {
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d >= start && d <= end && o.status !== 'Cancelled';
    });

    const filteredUsers = users.filter(u => {
      const d = new Date(u.created_at);
      return d >= start && d <= end;
    });

    // 1. Sales by Date
    const salesByDate: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const dateKey = new Date(o.date).toLocaleDateString();
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + o.total;
    });

    // 2. Sales by Product
    const salesByProduct: Record<string, { name: string, quantity: number, revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        if (!salesByProduct[item.id]) {
          salesByProduct[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        salesByProduct[item.id].quantity += item.quantity;
        salesByProduct[item.id].revenue += item.price * item.quantity;
      });
    });

    // 3. Sales by Category
    const salesByCategory: Record<string, number> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const cats = Array.isArray(item.category) && item.category.length > 0 ? item.category : ['Uncategorized'];
        cats.forEach(c => {
          salesByCategory[c] = (salesByCategory[c] || 0) + (item.price * item.quantity);
        });
      });
    });

    // 4. Coupons by Date
    const couponsByDate: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.coupon_code) {
        const dateKey = new Date(o.date).toLocaleDateString();
        couponsByDate[dateKey] = (couponsByDate[dateKey] || 0) + 1;
      }
    });

    // 5. Customer Report (Sales by Customer)
    const customerStats: Record<string, { name: string, email: string, orders: number, spent: number }> = {};
    filteredOrders.forEach(o => {
      const email = o.customerEmail || o.customerPhone || 'Unknown';
      if (!customerStats[email]) {
        customerStats[email] = { name: o.customerName, email: o.customerEmail || o.customerPhone || 'N/A', orders: 0, spent: 0 };
      }
      customerStats[email].orders += 1;
      customerStats[email].spent += o.total;
    });

    return {
      salesByDate,
      salesByProduct: Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue),
      salesByCategory,
      couponsByDate,
      customerReport: Object.values(customerStats).sort((a, b) => b.spent - a.spent),
      newCustomersCount: filteredUsers.length
    };
  }, [orders, coupons, users, reportStartDate, reportEndDate]);

  const [showAttrForm, setShowAttrForm] = useState(false);
  const [draftAttr, setDraftAttr] = useState({ globalAttrId: '', name: '', options: [] as string[], currentOption: '' });
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showInlineBrandForm, setShowInlineBrandForm] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSupportImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        const url = await uploadToImageKit(file, '/support');
        setStoreForm(prev => ({
          ...prev,
          floatingWidget: { ...(prev.floatingWidget || {}), supportImage: url }
        }));
      } catch (err: any) {
        alert('Error uploading image: ' + err.message);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const SQL_SCHEMA = `-- Kids Paradise Super Admin Schema (V7)
-- This script FIXES RLS "violate policy" errors for orders, wishlist, and addresses.
-- SAFE to run multiple times. Data stays intact.

-- 1. Table Consistency Check
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  image_url TEXT,
  parent_id BIGINT REFERENCES public.categories(id),
  item_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT,
  brand TEXT,
  unit TEXT,
  sku TEXT,
  images TEXT[],
  image_url TEXT,
  short_description TEXT,
  description TEXT,
  badge TEXT,
  is_featured BOOLEAN DEFAULT false,
  variants JSONB DEFAULT '[]'::jsonb,
  filter_attributes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_district TEXT,
  customer_area TEXT,
  subtotal NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  items JSONB DEFAULT '[]'::jsonb,
  coupon_code TEXT,
  user_id UUID REFERENCES auth.users(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- 2. Storage Bucket Setup (Idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (Adjust for production security)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );


CREATE TABLE IF NOT EXISTS public.banners (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('slider', 'right_top', 'right_bottom')),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (Everyone can see banners)
DROP POLICY IF EXISTS "Public Read Banners" ON public.banners;
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);

-- 2. Super Admin Access (JWT Email Check - No Table Access Required)
DROP POLICY IF EXISTS "Allow All For Admin" ON public.banners;
CREATE POLICY "Allow All For Admin" ON public.banners 
FOR ALL 
USING ((auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com') 
WITH CHECK ((auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com');

-- 3. General Admin Access (Role Based)
DROP POLICY IF EXISTS "Admin All Banners" ON public.banners;
CREATE POLICY "Admin All Banners" ON public.banners 
FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')) 
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Ensure database role matches
UPDATE public.profiles SET role = 'admin' WHERE email = 'msmraqeeb@gmail.com';

CREATE TABLE IF NOT EXISTS public.wishlist (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address_line TEXT,
  district TEXT,
  area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Reset RLS and Policies for clean application
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE public.' || t || ' ENABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || pol.tablename;
  END LOOP;
END $$;

-- 3. APPLY BULLETPROOF ADMIN POLICIES
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated
USING ( auth.uid() = user_id );
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.brands (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.attributes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  values JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage attributes" ON public.attributes FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read attributes" ON public.attributes FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.coupons (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  minimum_spend NUMERIC DEFAULT 0,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'Active',
  auto_apply BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT,
  author_name TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.settings FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );

UPDATE public.profiles SET role = 'admin' WHERE email = 'msmraqeeb@gmail.com';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'msmraqeeb@gmail.com' THEN 'admin' ELSE 'customer' END
  )
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.pages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pages" ON public.pages FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read pages" ON public.pages FOR SELECT USING (is_published = true);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blog" ON public.blog_posts FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read blog" ON public.blog_posts FOR SELECT USING (true);`;

  useEffect(() => {
    if (replyingTo) {
      const review = reviews.find(r => r.id === replyingTo);
      setReplyText(review?.reply || '');
    }
  }, [replyingTo, reviews]);

  useEffect(() => {
    setShipForm(shippingSettings);
  }, [shippingSettings]);

  const hierarchicalCategories = useMemo(() => {
    const buildHierarchy = (parentId: string | null = null, level: number = 0): (Category & { level: number })[] => {
      let result: (Category & { level: number })[] = [];
      categories.filter(c => c.parentId === parentId).forEach(child => {
        result.push({ ...child, level });
        result = [...result, ...buildHierarchy(child.id, level + 1)];
      });
      return result;
    };
    return buildHierarchy(null);
  }, [categories]);

  // Helper to determine product stock status
  const isProductInStock = (p: Product) => {
    if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.some(v => Number(v.stock || 0) > 0);
    }
    if (p.stock !== undefined && p.stock !== null) {
      return Number(p.stock) > 0;
    }
    return true; // Simple products default to In Stock
  };

  // Helper to get category and all its descendant names
  const getCategoryDescendantNames = (categoryName: string): string[] => {
    const rootCat = categories.find(c => c.name === categoryName);
    if (!rootCat) return [categoryName];
    
    const getDescendants = (catId: string): string[] => {
      let names: string[] = [];
      const children = categories.filter(c => String(c.parentId) === String(catId));
      children.forEach(child => {
        names.push(child.name);
        names = [...names, ...getDescendants(child.id)];
      });
      return names;
    };
    
    return [rootCat.name, ...getDescendants(rootCat.id)];
  };

  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (prodFilterCat) {
      const parent = categories.find(c => c.name === prodFilterCat);
      if (parent) {
        return categories.filter(c => String(c.parentId) === String(parent.id));
      }
      return [];
    }
    return categories.filter(c => c.parentId);
  }, [categories, prodFilterCat]);

  const handleParentCatChange = (catName: string) => {
    setProdFilterCat(catName);
    setProdFilterSubCat('');
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (prodSearch.trim()) {
      const searchLower = prodSearch.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.sku && p.sku.toLowerCase().includes(searchLower)) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.some(c => c.toLowerCase().includes(searchLower)))
      );
    }

    // Category (Parent Category)
    if (prodFilterCat && !prodFilterSubCat) {
      const allowedCategories = getCategoryDescendantNames(prodFilterCat);
      result = result.filter(p => p.category && p.category.some(c => allowedCategories.includes(c)));
    }

    // Subcategory
    if (prodFilterSubCat) {
      result = result.filter(p => p.category && p.category.includes(prodFilterSubCat));
    }

    // Stock Status
    if (prodFilterStatus !== 'all') {
      const wantInStock = prodFilterStatus === 'in-stock';
      result = result.filter(p => {
        const inStock = isProductInStock(p);
        return wantInStock ? inStock : !inStock;
      });
    }

    // Brand
    if (prodFilterBrand) {
      result = result.filter(p => p.brand === prodFilterBrand);
    }

    // Sorting
    if (prodSortColumn) {
      result.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (prodSortColumn === 'product') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (prodSortColumn === 'price') {
          valA = a.price;
          valB = b.price;
        } else if (prodSortColumn === 'stock') {
          valA = a.variants && a.variants.length > 0 ? a.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : (Number(a.stock) || 0);
          valB = b.variants && b.variants.length > 0 ? b.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : (Number(b.stock) || 0);
        }

        if (valA < valB) return prodSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return prodSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, prodSearch, prodFilterCat, prodFilterSubCat, prodFilterStatus, prodFilterBrand, prodSortColumn, prodSortDirection, categories]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const activePage = Math.max(1, Math.min(prodPage, totalPages || 1));

  const paginatedProducts = useMemo(() => {
    const startIdx = (activePage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, activePage, itemsPerPage]);

  useEffect(() => {
    setProdPage(1);
  }, [prodSearch, prodFilterCat, prodFilterSubCat, prodFilterStatus, prodFilterBrand, prodSortColumn, prodSortDirection]);

  // Pricing Logic Helper
  const getProductDisplayPrice = (p: Product) => {
    let price = Number(p.price) || 0;
    let originalPrice = p.originalPrice;
    if ((!price || price === 0) && p.variants && p.variants.length > 0) {
      const validPrices = p.variants.map(v => Number(v.price) || 0).filter(pr => pr > 0);
      if (validPrices.length > 0) price = Math.min(...validPrices);
      const validOrig = p.variants.map(v => Number(v.originalPrice) || 0).filter(pr => pr > 0);
      if (validOrig.length > 0 && !originalPrice) originalPrice = Math.min(...validOrig);
    }
    const hasSale = originalPrice !== undefined && originalPrice > price;
    return {
      mrp: hasSale ? originalPrice : price,
      sale: hasSale ? price : null
    };
  };

  // Inline Editing State for Products Table
  interface InlineProductEdit {
    price: number;
    originalPrice?: number;
    stock: number;
    variants?: Variant[];
  }

  const [inlineEdits, setInlineEdits] = useState<Record<string, InlineProductEdit>>({});
  const [inlineSaving, setInlineSaving] = useState<Record<string, boolean>>({});
  const [inlineSaved, setInlineSaved] = useState<Record<string, boolean>>({});

  const getInlineValues = (p: Product): InlineProductEdit => {
    if (inlineEdits[p.id]) {
      return inlineEdits[p.id];
    }
    const hasVariants = p.variants && Array.isArray(p.variants) && p.variants.length > 0;
    let initialPrice = Number(p.price) || 0;
    if (hasVariants && initialPrice === 0) {
      const prices = p.variants!.map(v => Number(v.price) || 0).filter(pr => pr > 0);
      if (prices.length > 0) initialPrice = Math.min(...prices);
    }
    let initialStock = 0;
    if (hasVariants) {
      initialStock = p.variants!.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    } else {
      initialStock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0;
    }
    return {
      price: initialPrice,
      originalPrice: p.originalPrice,
      stock: initialStock,
      variants: hasVariants ? p.variants!.map(v => ({ ...v, price: Number(v.price) || 0, stock: Number(v.stock) || 0 })) : undefined
    };
  };

  const handleInlinePriceChange = (productId: string, price: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const current = getInlineValues(p);
    setInlineEdits(prev => ({
      ...prev,
      [productId]: { ...current, price }
    }));
  };

  const handleInlineOriginalPriceChange = (productId: string, originalPrice?: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const current = getInlineValues(p);
    setInlineEdits(prev => ({
      ...prev,
      [productId]: { ...current, originalPrice }
    }));
  };

  const handleInlineStockChange = (productId: string, stock: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const current = getInlineValues(p);
    setInlineEdits(prev => ({
      ...prev,
      [productId]: { ...current, stock }
    }));
  };

  const handleVariantPriceChange = (productId: string, variantIndex: number, price: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const current = getInlineValues(p);
    const updatedVariants = [...(current.variants || [])];
    if (updatedVariants[variantIndex]) {
      updatedVariants[variantIndex] = { ...updatedVariants[variantIndex], price };
    }
    const validPrices = updatedVariants.map(v => Number(v.price) || 0).filter(pr => pr > 0);
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : price;
    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...current,
        price: minPrice,
        variants: updatedVariants
      }
    }));
  };

  const handleVariantStockChange = (productId: string, variantIndex: number, stock: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const current = getInlineValues(p);
    const updatedVariants = [...(current.variants || [])];
    if (updatedVariants[variantIndex]) {
      updatedVariants[variantIndex] = { ...updatedVariants[variantIndex], stock };
    }
    const totalStock = updatedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...current,
        stock: totalStock,
        variants: updatedVariants
      }
    }));
  };

  const saveInlineProduct = async (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const edited = getInlineValues(p);
    setInlineSaving(prev => ({ ...prev, [productId]: true }));
    try {
      const hasVariants = edited.variants && edited.variants.length > 0;
      let updatePayload: any = {
        ...p,
        price: edited.price,
        originalPrice: edited.originalPrice ? Number(edited.originalPrice) : null
      };

      if (hasVariants) {
        updatePayload.variants = edited.variants;
        const validPrices = edited.variants!.map(v => Number(v.price) || 0).filter(pr => pr > 0);
        if (validPrices.length > 0) {
          updatePayload.price = Math.min(...validPrices);
        }
      } else {
        updatePayload.stock = edited.stock;
        if (p.variants && p.variants.length === 1) {
          updatePayload.variants = [{
            ...p.variants[0],
            price: edited.price,
            originalPrice: edited.originalPrice,
            stock: edited.stock
          }];
        }
      }

      await updateProduct(productId, updatePayload);

      setInlineEdits(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });

      setInlineSaved(prev => ({ ...prev, [productId]: true }));
      setTimeout(() => {
        setInlineSaved(prev => ({ ...prev, [productId]: false }));
      }, 2500);
    } catch (err: any) {
      alert("Failed to save product: " + (err.message || err));
    } finally {
      setInlineSaving(prev => ({ ...prev, [productId]: false }));
    }
  };

  const getVariantLabel = (variant: Variant, index: number) => {
    if (variant.attributeValues && Object.keys(variant.attributeValues).length > 0) {
      return Object.values(variant.attributeValues).join(' / ');
    }
    return variant.sku || `Variant ${index + 1}`;
  };

  const handleAddOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftAttr.currentOption.trim()) return;
    setDraftAttr(prev => ({
      ...prev,
      options: [...prev.options, prev.currentOption.trim()],
      currentOption: ''
    }));
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const removeTempAttribute = (index: number) => {
    setProdForm(prev => ({
      ...prev,
      tempAttributes: prev.tempAttributes.filter((_, i) => i !== index)
    }));
  };

  const commitDraftAttribute = () => {
    if (!draftAttr.name.trim() || draftAttr.options.length === 0) {
      alert("Please enter an attribute name and at least one option.");
      return;
    }
    setProdForm(prev => ({
      ...prev,
      tempAttributes: [...prev.tempAttributes, { name: draftAttr.name, options: draftAttr.options }]
    }));
    setShowAttrForm(false);
    setDraftAttr({ globalAttrId: '', name: '', options: [], currentOption: '' });
  };

  const handleGlobalAttrSelect = (attrId: string) => {
    const selected = attributes.find(a => a.id === attrId);
    if (selected) {
      setDraftAttr({
        globalAttrId: attrId,
        name: selected.name,
        options: [],
        currentOption: ''
      });
    } else {
      setDraftAttr({
        globalAttrId: '',
        name: '',
        options: [],
        currentOption: ''
      });
    }
  };

  const handleCreateNewGlobalValue = async (valText: string) => {
    if (!draftAttr.globalAttrId) return;
    const selected = attributes.find(a => a.id === draftAttr.globalAttrId);
    if (!selected) return;

    const exists = selected.values.some(v => v.value.toLowerCase() === valText.toLowerCase());
    if (exists) {
      const actualVal = selected.values.find(v => v.value.toLowerCase() === valText.toLowerCase())?.value || valText;
      if (!draftAttr.options.includes(actualVal)) {
        setDraftAttr(prev => ({
          ...prev,
          options: [...prev.options, actualVal],
          currentOption: ''
        }));
      }
      return;
    }

    const newValue = {
      id: Math.random().toString(36).substr(2, 9),
      value: valText
    };

    const updatedValues = [...selected.values, newValue];

    try {
      await updateAttribute(selected.id, selected.name, updatedValues);
      setDraftAttr(prev => ({
        ...prev,
        options: [...prev.options, valText],
        currentOption: ''
      }));
    } catch (error) {
      console.error("Failed to create new attribute value:", error);
      alert("Failed to save new option to database.");
    }
  };

  const generateVariants = () => {
    const selectedAttrs = prodForm.tempAttributes.filter(a => a.options.length > 0);
    if (selectedAttrs.length === 0) {
      alert("Add some attributes first!");
      return;
    }

    const cartesian = (...args: any[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    const combinations = selectedAttrs.length === 1
      ? selectedAttrs[0].options.map(opt => [opt])
      : cartesian(...selectedAttrs.map(a => a.options));

    const pBase = parseFloat(String(prodForm.basePrice)) || 0;
    const pSale = parseFloat(String(prodForm.salePrice)) || 0;
    const isDiscounted = pSale > 0 && pSale < pBase;

    setProdForm(prev => ({
      ...prev,
      variants: combinations.map((combo: string[], idx: number) => {
        const attrValues: Record<string, string> = {};
        selectedAttrs.forEach((attr, i) => { attrValues[attr.name] = combo[i]; });
        return {
          id: Math.random().toString(36).substr(2, 9),
          attributeValues: attrValues,
          price: isDiscounted ? pSale : pBase,
          originalPrice: isDiscounted ? pBase : undefined,
          sku: `${prodForm.sku || 'PROD'}-${idx}`,
          stock: 100,
          image: prodForm.images[0] || ''
        };
      })
    }));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pBase = parseFloat(String(prodForm.basePrice)) || 0;
    const pSale = parseFloat(String(prodForm.salePrice)) || 0;

    let finalPrice = pBase;
    let finalOriginal = undefined;
    if (pSale > 0 && pSale < pBase) {
      finalPrice = pSale;
      finalOriginal = pBase;
    }

    let finalVariants = prodForm.variants;

    let baseSlug = prodForm.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    let finalSlug = baseSlug;
    let counter = 2;
    
    // Check against existing products to ensure unique slug
    while (products.some(p => p.slug === finalSlug && p.id !== editingItem?.data.id)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const data: Omit<Product, 'id'> = {
      name: prodForm.name,
      price: finalPrice,
      originalPrice: finalOriginal,
      category: prodForm.category,
      description: prodForm.description,
      shortDescription: prodForm.shortDescription,
      images: prodForm.images,
      unit: prodForm.unit,
      sku: prodForm.sku,
      brand: prodForm.brand,
      isFeatured: prodForm.isFeatured,
      variants: finalVariants,
      filterAttributes: prodForm.tempAttributes.filter(a => a.options.length > 0),
      slug: finalSlug
    };

    try {
      if (editingItem?.type === 'product') await updateProduct(editingItem.data.id, data);
      else await addProduct(data);
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateBrandInline = async () => {
    if (!newBrandName.trim()) return;
    setIsCreatingBrand(true);
    const slug = newBrandName.toLowerCase().trim().replace(/[\s_-]+/g, '-');
    try {
      await addBrand({ name: newBrandName.trim(), slug, logo_url: '' });
      setProdForm(prev => ({ ...prev, brand: newBrandName.trim() }));
      setShowInlineBrandForm(false);
      setNewBrandName('');
    } catch (err: any) {
      alert("Failed to create brand: " + err.message);
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const startEditProduct = (p: Product) => {
    const hasSale = p.originalPrice !== undefined && p.originalPrice > p.price;
    
    // Use filterAttributes if available (new system), otherwise reconstruct from variants (backward compat)
    let reconstructedAttrs: { name: string, options: string[] }[] = [];
    if (p.filterAttributes && p.filterAttributes.length > 0) {
      reconstructedAttrs = p.filterAttributes.map(a => ({ name: a.name, options: [...a.options] }));
    } else if (p.variants && p.variants.length > 0) {
      const attrMap: Record<string, Set<string>> = {};
      p.variants.forEach(v => {
        Object.entries(v.attributeValues).forEach(([name, val]) => {
          if (!attrMap[name]) attrMap[name] = new Set();
          attrMap[name].add(val);
        });
      });
      Object.entries(attrMap).forEach(([name, vals]) => {
        reconstructedAttrs.push({ name, options: Array.from(vals) });
      });
    }

    setProdForm({
      name: p.name,
      basePrice: (hasSale ? p.originalPrice : p.price)?.toString() || '0',
      salePrice: (hasSale ? p.price.toString() : ''),
      category: Array.isArray(p.category) ? p.category : [],
      description: p.description,
      shortDescription: p.shortDescription || '',
      images: p.images || [],
      unit: p.unit || '',
      sku: p.sku || '',
      brand: p.brand || '',
      isFeatured: p.isFeatured || false,
      variants: p.variants || [],
      tempAttributes: reconstructedAttrs
    });
    setEditingItem({ type: 'product', data: p });
    setIsAdding(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const getNextSku = () => {
    if (!products || products.length === 0) return 'ZB-011';
    
    const skuRegex = /^ZB-(\d+)$/i;
    let maxNum = 0;
    
    products.forEach(p => {
      if (p.sku) {
        const match = p.sku.match(skuRegex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    
    if (maxNum === 0) return 'ZB-011';
    
    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(3, '0');
    return `ZB-${paddedNum}`;
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = pageForm.slug.toLowerCase().trim().replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'page') await updatePage(editingItem.data.id, { ...pageForm, slug });
      else await addPage({ ...pageForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const startEditPage = (p: Page) => {
    setPageForm({ title: p.title, slug: p.slug, content: p.content, isPublished: p.isPublished });
    setEditingItem({ type: 'page', data: p });
    setIsAdding(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const startEditBanner = (b: any) => {
    const linkStr = b.link || '';
    const parts = linkStr.split('|');
    const actualLink = parts[0] || '';
    
    let align = 'left';
    let color = 'light';
    let show_btn = true;
    let desc = '';

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('align:')) align = part.substring(6);
      else if (part.startsWith('color:')) color = part.substring(6);
      else if (part.startsWith('show_btn:')) show_btn = part.substring(9) === 'true';
      else if (part.startsWith('desc:')) desc = decodeURIComponent(part.substring(5));
    }

    setBannerForm({
      type: b.type,
      title: b.title || '',
      subtitle: b.subtitle || '',
      image_url: b.image_url || '',
      link: actualLink,
      align: align as any,
      color: color as any,
      show_btn: show_btn,
      desc: desc,
      sort_order: b.sort_order,
      is_active: b.is_active ?? true
    });
    setEditingItem({ type: 'banner', data: b });
    setIsAdding(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalLink = bannerForm.link + 
        `|align:${bannerForm.align}` + 
        `|color:${bannerForm.color}` + 
        `|show_btn:${bannerForm.show_btn}` + 
        `|desc:${encodeURIComponent(bannerForm.desc)}`;

      const submitData = {
        type: bannerForm.type,
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        image_url: bannerForm.image_url,
        link: finalLink,
        sort_order: bannerForm.sort_order,
        is_active: bannerForm.is_active
      };

      if (editingItem?.type === 'banner') {
        await updateBanner(editingItem.data.id, submitData);
      } else {
        await addBanner(submitData);
      }
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem?.type === 'section') {
        const updatedSection = { ...sectionForm, id: editingItem.data.id } as HomeSection;
        await updateHomeSection(editingItem.data.id, updatedSection);
      } else {
        const newSection = { ...sectionForm, id: `section-${Date.now()}` } as HomeSection;
        await addHomeSection(newSection);
      }
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleSectionBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    try {
      const url = await uploadToImageKit(file, '/sections');
      setSectionForm({ ...sectionForm, banner: { ...sectionForm.banner!, imageUrl: url } });
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleHomeSectionBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    try {
      const url = await uploadToImageKit(file, '/sections');
      const newBanners = [...(sectionForm.banners || [])];
      for (let i = 0; i <= index; i++) {
        if (!newBanners[i]) newBanners[i] = { imageUrl: '', link: '' };
      }
      newBanners[index] = { ...newBanners[index], imageUrl: url };
      setSectionForm({ ...sectionForm, banners: newBanners });
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const startEditSection = (s: HomeSection) => {
    setSectionForm({
      title: s.title, type: s.type, filterType: s.filterType, filterValue: s.filterValue, sortOrder: s.sortOrder, isActive: s.isActive,
      banner: s.banner,
      banners: s.banners || []
    });
    setEditingItem({ type: 'section', data: s });
    setIsAdding(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = blogForm.slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'blog') await updateBlogPost(editingItem.data.id, { ...blogForm, slug });
      else await addBlogPost({ ...blogForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    try {
      const url = await uploadToImageKit(file, '/blogs');
      setBlogForm(prev => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const startEditBlog = (p: BlogPost) => {
    setBlogForm({
      title: p.title, excerpt: p.excerpt, content: p.content, author: p.author, imageUrl: p.imageUrl, slug: p.slug, tags: p.tags
    });
    setEditingItem({ type: 'blog', data: p });
    setIsAdding(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const closeForms = () => {
    setEditingItem(null); setIsAdding(null); setViewingOrder(null); setReplyingTo(null);
    setIsEditingOrder(false); setEditingOrderData(null);
    setProdForm({ name: '', basePrice: '', salePrice: '', category: [], description: '', shortDescription: '', images: [], unit: '', sku: '', brand: '', isFeatured: false, variants: [], tempAttributes: [] });
    setCatForm({ name: '', parentId: null, image: '' });
    setBrandForm({ name: '', slug: '', logo_url: '' });
    setAttrForm({ name: '' });
    setAttrValuesInput('');
    setCouponForm({ code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false });

    setCouponForm({ code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false });
    setCouponForm({ code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false });
    setSectionForm({ title: '', type: 'slider', filterType: 'all', sortOrder: 0, isActive: true, banner: { title: '', description: '', imageUrl: '', buttonText: 'Shop Now', link: '/products' }, banners: [] });
    setBlogForm({ title: '', excerpt: '', content: '', author: '', imageUrl: '', slug: '', tags: [] });

    setPageForm({ title: '', slug: '', content: '', isPublished: true });
    setBannerForm({ type: 'slider', title: '', subtitle: '', image_url: '', link: '', align: 'left', color: 'light', show_btn: true, desc: '', sort_order: 0, is_active: true });
    setShowAttrForm(false);
    setDraftAttr({ globalAttrId: '', name: '', options: [], currentOption: '' });
    setShowOptionsDropdown(false);
    setShowInlineBrandForm(false);
    setNewBrandName('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = catForm.name.toLowerCase().trim().replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'category') await updateCategory(editingItem.data.id, { ...catForm, slug });
      else await addCategory({ ...catForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);
    try {
      const url = await uploadToImageKit(file, '/brands');
      setBrandForm(prev => ({ ...prev, logo_url: url }));
    } catch (error: any) {
      alert('Error uploading logo: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (brandForm.slug || brandForm.name).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'brand') await updateBrand(editingItem.data.id, { ...brandForm, slug });
      else await addBrand({ ...brandForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleAttributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const valuesArray = attrValuesInput.split(',').map(v => v.trim()).filter(v => v !== '');
      const valuesObjects = valuesArray.map(v => ({ id: Math.random().toString(), value: v }));
      if (editingItem?.type === 'attribute') await updateAttribute(editingItem.data.id, attrForm.name, valuesObjects);
      else await addAttribute(attrForm.name, valuesObjects);
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem?.type === 'coupon') await updateCoupon(editingItem.data.id, couponForm);
      else await addCoupon(couponForm);
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo) return;
    try {
      await replyToReview(replyingTo, replyText);
      setReplyingTo(null);
      setReplyText('');
    } catch (err: any) { alert(err.message); }
  };

  // Order Editing Handlers
  const startEditingOrder = () => {
    if (!viewingOrder) return;
    setEditingOrderData({ ...viewingOrder });
    setIsEditingOrder(true);
  };

  const recalculateOrderTotals = (updatedData: Order) => {
    const subtotal = updatedData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let discount = 0;
    if (updatedData.coupon_code) {
      const coupon = coupons.find(c => c.code === updatedData.coupon_code);
      if (coupon) {
        if (coupon.discountType === 'Fixed') discount = coupon.discountValue;
        else discount = (subtotal * coupon.discountValue) / 100;
      }
    }
    const total = subtotal + updatedData.shippingCost - discount;
    return { ...updatedData, subtotal, total, discount };
  };

  const updateOrderItems = (newItems: CartItem[]) => {
    if (!editingOrderData) return;
    const updated = recalculateOrderTotals({ ...editingOrderData, items: newItems });
    setEditingOrderData(updated);
  };

  const removeOrderItem = (itemIdx: number) => {
    if (!editingOrderData) return;
    const newItems = editingOrderData.items.filter((_, i) => i !== itemIdx);
    updateOrderItems(newItems);
  };

  const changeOrderItemQty = (itemIdx: number, delta: number) => {
    if (!editingOrderData) return;
    const newItems = [...editingOrderData.items];
    newItems[itemIdx].quantity = Math.max(1, newItems[itemIdx].quantity + delta);
    updateOrderItems(newItems);
  };

  const changeOrderShipping = (newCost: number) => {
    if (!editingOrderData) return;
    const updated = recalculateOrderTotals({ ...editingOrderData, shippingCost: newCost });
    setEditingOrderData(updated);
  };

  const updateCustomerInfo = (field: keyof Order, value: any) => {
    if (!editingOrderData) return;
    let newData = { ...editingOrderData, [field]: value };
    if (field === 'customerDistrict') newData.customerArea = '';
    setEditingOrderData(newData);
  };

  const addProductToOrder = (product: Product, variant?: Variant) => {
    if (!editingOrderData) return;
    const variantId = variant?.id;
    const existingIdx = editingOrderData.items.findIndex(item =>
      item.id === product.id && item.selectedVariantId === variantId
    );
    if (existingIdx > -1) {
      changeOrderItemQty(existingIdx, 1);
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedVariantId: variantId,
        selectedVariantName: variant ? Object.values(variant.attributeValues).join(' / ') : undefined,
        selectedVariantImage: variant?.image || product.images?.[0] || '',
        price: variant ? variant.price : product.price
      };
      updateOrderItems([...editingOrderData.items, newItem]);
    }
    setShowProductPicker(false);
    setOrderProductSearch('');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadToImageKit(file, '/store');
      setStoreForm(prev => ({ ...prev, logo_url: url }));
    } catch (error: any) {
      alert(`Error uploading logo: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadToImageKit(file, '/banners');
      setBannerForm(prev => ({ ...prev, image_url: url }));
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveOrderEdits = async () => {
    if (!editingOrderData) return;
    try {
      await updateOrder(editingOrderData.id, editingOrderData);
      setViewingOrder(editingOrderData);
      setIsEditingOrder(false);
      setEditingOrderData(null);
    } catch (err: any) { alert("Failed to update order: " + err.message); }
  };

  const orderSearchFilteredProducts = useMemo(() => {
    if (!orderProductSearch.trim()) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(orderProductSearch.toLowerCase()) ||
      p.category && p.category.some(c => c.toLowerCase().includes(orderProductSearch.toLowerCase()))
    ).slice(0, 5);
  }, [products, orderProductSearch]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'Processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const printInvoice = (order: Order) => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return alert("Please allow popups to print invoices");

    // Set the state/URL so the browser prints a clean domain instead of about:blank
    try {
      invoiceWindow.history.pushState({}, '', '/');
    } catch (e) {
      console.warn("Failed to pushState in print window:", e);
    }

    const html = `
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              color: #333;
              padding: 40px;
              margin: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              border-bottom: 2px solid #eee;
              padding-bottom: 20px;
            }
            .company {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }
            .company img {
              height: 55px;
              object-fit: contain;
              margin-bottom: 5px;
            }
            .company p {
              margin: 5px 0 0;
              color: #666;
              font-size: 13px;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details h2 {
              margin: 0 0 10px;
              color: #333;
            }
            .invoice-details p {
              margin: 2px 0;
              color: #666;
            }
            .bill-to {
              margin-bottom: 30px;
              background: #f9f9f9;
              padding: 20px;
              border-radius: 10px;
            }
            .bill-to h3 {
              margin: 0 0 10px;
              color: #e92c5d;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .bill-to p {
              margin: 2px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              text-align: left;
              border-bottom: 2px solid #eee;
              padding: 15px 10px;
              font-size: 12px;
              text-transform: uppercase;
              color: #888;
            }
            td {
              padding: 15px 10px;
              border-bottom: 1px solid #eee;
            }
            .totals {
              width: 300px;
              margin-left: auto;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .total-row {
              font-weight: bold;
              border-top: 2px solid #eee;
              padding-top: 15px;
              margin-top: 10px;
              font-size: 1.2em;
              color: #e92c5d;
            }
            
            /* Custom styled footer positioned cleanly at the bottom */
            .invoice-footer {
              border-top: 1px solid #eee;
              padding-top: 15px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #888;
              font-weight: bold;
            }

            @media print {
              @page {
                size: auto;
                margin: 0; /* Hides default browser header and footer (about:blank) */
              }
              body {
                padding: 1.5cm 2cm;
              }
              .bill-to {
                background: none;
                padding: 0;
              }
              .invoice-footer {
                position: fixed;
                bottom: 1.5cm;
                left: 2cm;
                right: 2cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">
              <img src="${currentStoreInfo?.logo_url || 'https://kidsparadise.com.bd/wp-content/uploads/2026/08/kp-logo-1.1.png'}" alt="Kids Paradise Logo" />
              <p><strong>Address:</strong> ${currentStoreInfo?.address || 'Pallabi Mirpur 11.5 Bus Stand Mirpur, Dhaka-1216'}</p>
              <p><strong>Mobile:</strong> ${currentStoreInfo?.phone || '01797007260'}</p>
              <p><strong>Email:</strong> ${currentStoreInfo?.email || 'support@kidsparadise.com.bd'}</p>
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p>Order #${order.id}</p>
              <p>${new Date(order.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="bill-to">
            <h3>Bill To</h3>
            <p><strong>${order.customerName}</strong></p>
            <p>${[order.customerAddress, order.customerArea, order.customerDistrict].filter(Boolean).join(', ')}</p>
            <p>${order.customerPhone}</p>
            <p>${order.customerEmail || ''}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    ${item.name}
                    ${item.selectedVariantName ? `<br><small style="color: #888">${item.selectedVariantName}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>৳${item.price.toFixed(2)}</td>
                  <td>৳${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Subtotal:</span> <span>৳${order.subtotal.toFixed(2)}</span></div>
            <div class="row"><span>Shipping:</span> <span>৳${order.shippingCost.toFixed(2)}</span></div>
            ${order.discount > 0 ? `<div class="row" style="color: #e92c5d"><span>Discount (${order.coupon_code || 'Promo'}):</span> <span>-৳${order.discount.toFixed(2)}</span></div>` : ''}
            <div class="row total-row"><span>Total:</span> <span>৳${order.total.toFixed(2)}</span></div>
          </div>
          
          <div class="invoice-footer">
            <span>www.kidsparadise.com.bd</span>
            <span>Thank you for shopping with us!</span>
          </div>
          
          <script>
            // Ensure logo image is fully loaded before launching the native print dialog
            const img = document.querySelector('.company img');
            const runPrint = () => {
              setTimeout(() => { window.print(); }, 300);
            };
            if (img && !img.complete) {
              img.onload = runPrint;
              img.onerror = runPrint;
            } else {
              window.onload = runPrint;
            }
          </script>
        </body>
      </html>
    `;

    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
  };

  return (
    <div className="bg-[#fcfdfd] min-h-screen flex font-sans text-[#1a3a34]">
      {/* Sidebar */}
      <aside className="w-72 bg-black text-white flex flex-col p-8 sticky top-0 h-screen shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <ShieldCheck className="text-rose-400" size={36} />
          <span className="font-black text-2xl uppercase tracking-tighter">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'categories', icon: Layers, label: 'Categories' },
            { id: 'brands', icon: Globe, label: 'Brands' },
            { id: 'attributes', icon: Zap, label: 'Attributes' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'coupons', icon: Ticket, label: 'Coupons' },
            { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
            { id: 'pages', icon: FileText, label: 'Pages' },
            { id: 'banners', icon: ImageIcon, label: 'Banners' },
            { id: 'media', icon: Upload, label: 'Media Library' },
            { id: 'users', icon: UsersIcon, label: 'Users & Roles' },
            { id: 'settings', icon: SettingsIcon, label: 'System' },
            { id: 'reports', icon: BarChart3, label: 'Reports' },
            { id: 'blog', icon: BookOpen, label: 'Blog' },
          ].map(item => (
            <button key={item.id} onClick={() => { setAdminTabState(item.id); closeForms(); }} className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all font-bold text-sm ${adminTab === item.id ? 'bg-rose-50 text-[#e92c5d] shadow-lg' : 'text-slate-300 hover:bg-white/10'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-10">
        {adminTab === 'media' && <MediaManager />}

        {adminTab === 'banners' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Banner Management</h2>
                <p className="text-gray-500 font-medium">Manage homepage slider and side banners</p>
              </div>
              <button onClick={() => setIsAdding('banner')} className="bg-[#e92c5d] hover:bg-[#c81d4a] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-rose-200 transition-all active:scale-95">
                <PlusCircle size={20} /> Add Banner
              </button>
            </div>

            {(isAdding === 'banner' || editingItem?.type === 'banner') && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button onClick={closeForms} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                  <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                    <ImageIcon className="text-[#e92c5d]" />
                    {editingItem?.type === 'banner' ? 'Edit the banner' : 'Add New Banner'}
                  </h3>
                  <form onSubmit={handleBannerSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                        <select value={bannerForm.type} onChange={e => setBannerForm({ ...bannerForm, type: e.target.value as any })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all">
                          <option value="slider">Main Slider</option>
                          <option value="right_top">Right Top Banner</option>
                          <option value="right_bottom">Right Bottom Banner</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sort Order</label>
                        <input type="number" value={bannerForm.sort_order} onChange={e => setBannerForm({ ...bannerForm, sort_order: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Image</label>
                      <div className="flex items-center gap-4">
                        {bannerForm.image_url && <img src={bannerForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />}
                        <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-[#e92c5d] px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all flex items-center gap-2">
                          <ImageIcon size={16} /> {editingItem?.type === 'banner' ? 'Change Image' : 'Upload Image'}
                          <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title (Optional)</label><input value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all" placeholder="Big Sale" /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subtitle (Optional)</label><input value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all" placeholder="Up to 50% off" /></div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Short Description (Optional)</label>
                      <input value={bannerForm.desc} onChange={e => setBannerForm({ ...bannerForm, desc: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all" placeholder="Enter custom short description for the banner" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link (Optional)</label><input value={bannerForm.link} onChange={e => setBannerForm({ ...bannerForm, link: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all" placeholder="/category/vegetables" /></div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Text Alignment</label>
                        <select value={bannerForm.align} onChange={e => setBannerForm({ ...bannerForm, align: e.target.value as any })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all">
                          <option value="left">Left Alignment</option>
                          <option value="right">Right Alignment</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Text Color</label>
                        <select value={bannerForm.color} onChange={e => setBannerForm({ ...bannerForm, color: e.target.value as any })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all">
                          <option value="light">Light Text (For Dark/Image Banners)</option>
                          <option value="dark">Dark Text (For White/Light Banners)</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Now Button</label>
                        <select value={bannerForm.show_btn ? 'true' : 'false'} onChange={e => setBannerForm({ ...bannerForm, show_btn: e.target.value === 'true' })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#e92c5d] transition-all">
                          <option value="true">Show Button</option>
                          <option value="false">Hide Button (Optional)</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-[#e92c5d] hover:bg-[#c81d4a] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-200 transition-all active:scale-95">Save Banner</button>
                  </form>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Slider Banners Section */}
              <div>
                <h3 className="text-lg font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                  Slider Banners
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banners.filter(b => b.type === 'slider').map(banner => (
                    <div key={banner.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
                      <div className="aspect-video bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase backdrop-blur-md">
                          Slider
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{banner.title || 'Untitled Banner'}</h3>
                      <p className="text-sm text-gray-500 mb-4">{banner.subtitle || 'No subtitle'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">Order: {banner.sort_order}</span>
                        <div className="flex gap-2">
                          <button onClick={() => startEditBanner(banner)} className="bg-gray-50 text-gray-600 p-2 rounded-xl hover:bg-rose-50 hover:text-[#e92c5d] transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => deleteBanner(banner.id)} className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {banners.filter(b => b.type === 'slider').length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium italic bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      No slider banners added yet
                    </div>
                  )}
                </div>
              </div>

              {/* Right Banners Section */}
              <div>
                <h3 className="text-lg font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                  Right Side Banners
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banners.filter(b => b.type.startsWith('right_')).map(banner => (
                    <div key={banner.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
                      <div className="aspect-video bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase backdrop-blur-md">
                          {banner.type === 'right_top' ? 'Top Right' : 'Bottom Right'}
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{banner.title || 'Untitled Banner'}</h3>
                      <p className="text-sm text-gray-500 mb-4">{banner.subtitle || 'No subtitle'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">Order: {banner.sort_order}</span>
                        <div className="flex gap-2">
                          <button onClick={() => startEditBanner(banner)} className="bg-gray-50 text-gray-600 p-2 rounded-xl hover:bg-rose-50 hover:text-[#e92c5d] transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => deleteBanner(banner.id)} className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {banners.filter(b => b.type.startsWith('right_')).length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium italic bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      No right side banners added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {adminTab === 'reports' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Business Reports</h2>
                <p className="text-gray-500 font-medium">Insights and analytics for your store</p>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                <div className="flex flex-col px-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">From</label>
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none text-sm" />
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="flex flex-col px-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">To</label>
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Summary Cards */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">Total Revenue</h3>
                <p className="text-3xl font-black text-rose-600">৳{Object.values(reportData.salesByDate).reduce((a, b) => a + b, 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">New Customers</h3>
                <p className="text-3xl font-black text-blue-600">{reportData.newCustomersCount}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">Coupon Orders</h3>
                <p className="text-3xl font-black text-purple-600">{Object.values(reportData.couponsByDate).reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Sales by Date */}
              <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-rose-500" /> Sales by Date</h3>
                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-xs font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-white">
                      <tr><th className="py-3 border-b-2">Date</th><th className="py-3 border-b-2 text-right">Revenue</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.salesByDate).length === 0 ? (
                        <tr><td colSpan={2} className="text-center py-8 text-gray-400 italic">No sales in this period</td></tr>
                      ) : (
                        Object.entries(reportData.salesByDate).map(([date, total]) => (
                          <tr key={date} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 font-medium text-gray-600">{date}</td>
                            <td className="py-3 font-bold text-gray-800 text-right">৳{total.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales by Category */}
              <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Layers size={20} className="text-blue-500" /> Sales by Category</h3>
                <div className="space-y-4">
                  {Object.entries(reportData.salesByCategory).length === 0 ? (
                    <p className="text-center py-8 text-gray-400 italic">No data available</p>
                  ) : (
                    Object.entries(reportData.salesByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, total]) => {
                        const maxVal = Math.max(...Object.values(reportData.salesByCategory));
                        const percent = (total / maxVal) * 100;
                        return (
                          <div key={cat} className="group">
                            <div className="flex justify-between text-sm font-bold text-gray-600 mb-1">
                              <span>{cat}</span>
                              <span>৳{total.toFixed(2)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Sales by Product */}
              <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Package size={20} className="text-purple-500" /> Top Products</h3>
                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="text-xs font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-white">
                      <tr><th className="py-3 border-b-2">Product</th><th className="py-3 border-b-2 text-right">Qty</th><th className="py-3 border-b-2 text-right">Revenue</th></tr>
                    </thead>
                    <tbody>
                      {reportData.salesByProduct.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-8 text-gray-400 italic">No product sales found</td></tr>
                      ) : (
                        reportData.salesByProduct.map((p, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 font-medium text-gray-700 truncate max-w-[200px]">{p.name}</td>
                            <td className="py-3 font-medium text-gray-600 text-right">{p.quantity}</td>
                            <td className="py-3 font-bold text-gray-800 text-right">৳{p.revenue.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coupons and Customers Brief */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Ticket size={20} className="text-pink-500" /> Coupon Usage by Date</h3>
                  <div className="overflow-y-auto max-h-40 custom-scrollbar">
                    {Object.entries(reportData.couponsByDate).length === 0 ? (
                      <p className="text-center py-4 text-gray-400 italic">No coupons used</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(reportData.couponsByDate).map(([date, count]) => (
                          <div key={date} className="bg-pink-50 p-3 rounded-xl border border-pink-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-600">{date}</span>
                            <span className="bg-white px-2 py-0.5 rounded-md text-xs font-black text-pink-600 shadow-sm">{count} Used</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><UsersIcon size={20} className="text-orange-500" /> Customer Report</h3>
                  <div className="overflow-y-auto max-h-80 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-white">
                        <tr>
                          <th className="py-3 border-b text-rose-600">Customer Name</th>
                          <th className="py-3 border-b text-gray-500">Email</th>
                          <th className="py-3 border-b text-center text-gray-500">Orders</th>
                          <th className="py-3 border-b text-right text-rose-600">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.customerReport.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-8 text-gray-400 italic">No customer activity found</td></tr>
                        ) : (
                          reportData.customerReport.map((c, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 font-bold text-gray-700">{c.name}</td>
                              <td className="py-3 text-sm text-gray-500">{c.email}</td>
                              <td className="py-3 font-bold text-gray-700 text-center">{c.orders}</td>
                              <td className="py-3 font-black text-gray-800 text-right">৳{c.spent.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {
          adminTab === 'pages' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Pages</h2><p className="text-slate-400 text-sm">Create and manage content pages.</p></div>
                {!isAdding && !editingItem && (
                  <button onClick={() => setIsAdding('page')} className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#c81d4a] transition-all"><Plus size={18} /> Add Page</button>
                )}
              </div>

              {(isAdding === 'page' || editingItem?.type === 'page') ? (
                <form onSubmit={handlePageSubmit} className="bg-white rounded-2xl border border-rose-100 p-10 shadow-xl space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Page Title</label>
                    <input required value={pageForm.title} onChange={e => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                      setPageForm({ ...pageForm, title, slug: pageForm.slug === '' || isAdding === 'page' ? slug : pageForm.slug })
                    }} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-base font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slug (URL Path)</label>
                    <input required value={pageForm.slug} onChange={e => setPageForm({ ...pageForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none text-rose-600" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Page Builder</label>
                    <PageBuilder initialContent={pageForm.content} onChange={content => setPageForm({ ...pageForm, content })} />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={pageForm.isPublished} onChange={e => setPageForm({ ...pageForm, isPublished: e.target.checked })} className="w-5 h-5 accent-rose-500" />
                      <span className="text-sm font-bold text-gray-700">Published</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px] hover:text-slate-600">Cancel</button>
                    <button type="submit" className="bg-rose-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all hover:bg-rose-700">Save Page</button>
                  </div>
                </form>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                      <tr><th className="px-8 py-6">Title</th><th className="px-6 py-6">Slug</th><th className="px-6 py-6">Status</th><th className="px-8 py-6 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pages.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                          <td className="px-8 py-5 font-bold text-gray-700">{p.title}</td>
                          <td className="px-6 py-5 text-rose-600 font-medium text-sm">/{p.slug}</td>
                          <td className="px-6 py-5"><span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${p.isPublished ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{p.isPublished ? 'Published' : 'Draft'}</span></td>
                          <td className="px-8 py-5 text-right flex justify-end gap-2">
                            <a href={`/${p.slug}`} target="_blank" rel="noreferrer" className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-rose-500 shadow-sm"><Eye size={18} /></a>
                            <button onClick={() => startEditPage(p)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-blue-500 shadow-sm"><Pencil size={18} /></button>
                            <button onClick={() => deletePage(p.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        }

        {/* Blog Tab */}
        {adminTab === 'blog' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Blog Posts</h2><p className="text-slate-400 text-sm">Manage your blog articles.</p></div>
              {!isAdding && !editingItem && (
                <button onClick={() => setIsAdding('blog')} className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#c81d4a] transition-all"><Plus size={18} /> Add Post</button>
              )}
            </div>

            {(isAdding === 'blog' || editingItem?.type === 'blog') ? (
              <form onSubmit={handleBlogSubmit} className="bg-white rounded-2xl border border-rose-100 p-10 shadow-xl space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Post Title</label>
                  <input required value={blogForm.title} onChange={e => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                    setBlogForm({ ...blogForm, title, slug: blogForm.slug === '' || isAdding === 'blog' ? slug : blogForm.slug })
                  }} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-base font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slug</label>
                  <input required value={blogForm.slug} onChange={e => setBlogForm({ ...blogForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none text-rose-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Author</label>
                  <input required value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Featured Image</label>
                  <div className="flex gap-3 items-center">
                    {blogForm.imageUrl && <img src={blogForm.imageUrl} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />}
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors h-[46px]">
                      <Upload size={16} /> Upload
                      <input type="file" onChange={handleBlogImageUpload} className="hidden" accept="image/*" />
                    </label>
                    <input placeholder="Or enter Image URL" required={!blogForm.imageUrl} value={blogForm.imageUrl} onChange={e => setBlogForm({ ...blogForm, imageUrl: e.target.value })} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 font-bold outline-none text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Excerpt</label>
                  <textarea required value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none h-24" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Content</label>
                  <RichTextEditor value={blogForm.content} onChange={val => setBlogForm({ ...blogForm, content: val })} label="Article Content" height="400px" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tags (comma separated)</label>
                  <input value={blogForm.tags.join(', ')} onChange={e => setBlogForm({ ...blogForm, tags: e.target.value.split(',').map(t => t.trim()) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none" />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px] hover:text-slate-600">Cancel</button>
                  <button type="submit" className="bg-rose-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all hover:bg-rose-700">Save Post</button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">Title</th><th className="px-6 py-6">Author</th><th className="px-6 py-6">Date</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {blogPosts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-5 font-bold text-gray-700">{p.title}</td>
                        <td className="px-6 py-5 text-gray-500 font-medium text-sm">{p.author}</td>
                        <td className="px-6 py-5 text-gray-400 text-sm">{p.date}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-rose-500 shadow-sm"><Eye size={18} /></a>
                          <button onClick={() => startEditBlog(p)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-blue-500 shadow-sm"><Pencil size={18} /></button>
                          <button onClick={() => deleteBlogPost(p.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {adminTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {!(isAdding === 'product' || editingItem?.type === 'product') ? (
              <>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Products</h2>
                    <p className="text-slate-400 text-sm">Manage your product catalog.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5">
                    {/* Frontend Zero-Stock Visibility Toggle Switch Button */}
                    <div 
                      onClick={() => setShowZeroStockFrontend(!showZeroStockFrontend)}
                      className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-xs cursor-pointer hover:border-gray-300 hover:shadow-md transition-all select-none group"
                      title={showZeroStockFrontend ? 'Currently showing all products (including zero stock) on customer frontend. Click to hide.' : 'Currently showing in-stock only on customer frontend. Click to show all.'}
                    >
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${showZeroStockFrontend ? 'bg-[#e92c5d] animate-pulse' : 'bg-slate-400'}`}></span>
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            Frontend Stock Visibility
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium ml-3.5">
                          {showZeroStockFrontend ? 'All Products on Frontend' : 'In-Stock Only on Frontend'}
                        </span>
                      </div>

                      {/* Animated Switch Track & Knob */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showZeroStockFrontend}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showZeroStockFrontend ? 'bg-[#e92c5d]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            showZeroStockFrontend ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <button 
                      onClick={() => { setIsAdding('product'); setProdForm(prev => ({ ...prev, sku: getNextSku() })); window.scrollTo({ top: 0, behavior: 'instant' }); }} 
                      className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#c81d4a] transition-all cursor-pointer"
                    >
                      <Plus size={18} /> Add Product
                    </button>
                  </div>
                </div>

                {/* Search & Filters Panel */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Search Input */}
                    <div className="md:col-span-4 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search product name, SKU, brand..."
                        value={prodSearch}
                        onChange={(e) => setProdSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all text-slate-700"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="md:col-span-2 relative">
                      <select
                        value={prodFilterCat}
                        onChange={(e) => handleParentCatChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-600 outline-none appearance-none cursor-pointer focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all"
                      >
                        <option value="">All Categories</option>
                        {parentCategories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Sub-category Filter */}
                    <div className="md:col-span-2 relative">
                      <select
                        value={prodFilterSubCat}
                        onChange={(e) => setProdFilterSubCat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-600 outline-none appearance-none cursor-pointer focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all"
                      >
                        <option value="">All Sub-categories</option>
                        {subCategories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Status Filter */}
                    <div className="md:col-span-2 relative">
                      <select
                        value={prodFilterStatus}
                        onChange={(e) => setProdFilterStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-600 outline-none appearance-none cursor-pointer focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all"
                      >
                        <option value="all">All Statuses</option>
                        <option value="in-stock">In Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Brand Filter */}
                    <div className="md:col-span-2 relative">
                      <select
                        value={prodFilterBrand}
                        onChange={(e) => setProdFilterBrand(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-600 outline-none appearance-none cursor-pointer focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all"
                      >
                        <option value="">All Brands</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Summary & Clear Filters */}
                  {(prodSearch || prodFilterCat || prodFilterSubCat || prodFilterStatus !== 'all' || prodFilterBrand) && (
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-2 px-1">
                      <div>
                        Found <span className="text-[#e92c5d]">{filteredProducts.length}</span> matching products
                      </div>
                      <button
                        onClick={() => {
                          setProdSearch('');
                          setProdFilterCat('');
                          setProdFilterSubCat('');
                          setProdFilterStatus('all');
                          setProdFilterBrand('');
                        }}
                        className="text-rose-600 hover:text-rose-800 transition-colors uppercase tracking-wider text-[10px] flex items-center gap-1 font-black cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                      <tr>
                        <th 
                          onClick={() => {
                            if (prodSortColumn === 'product') {
                              setProdSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProdSortColumn('product');
                              setProdSortDirection('asc');
                            }
                          }}
                          className="px-8 py-6 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Product</span>
                            {prodSortColumn === 'product' ? (
                              prodSortDirection === 'asc' ? <ArrowUp size={12} className="text-[#e92c5d]" /> : <ArrowDown size={12} className="text-[#e92c5d]" />
                            ) : (
                              <ArrowUpDown size={12} className="opacity-40" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-6">Category</th>
                        <th 
                          onClick={() => {
                            if (prodSortColumn === 'price') {
                              setProdSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProdSortColumn('price');
                              setProdSortDirection('asc');
                            }
                          }}
                          className="px-6 py-6 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Price Details (৳)</span>
                            {prodSortColumn === 'price' ? (
                              prodSortDirection === 'asc' ? <ArrowUp size={12} className="text-[#e92c5d]" /> : <ArrowDown size={12} className="text-[#e92c5d]" />
                            ) : (
                              <ArrowUpDown size={12} className="opacity-40" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => {
                            if (prodSortColumn === 'stock') {
                              setProdSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProdSortColumn('stock');
                              setProdSortDirection('asc');
                            }
                          }}
                          className="px-6 py-6 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Stock Qty</span>
                            {prodSortColumn === 'stock' ? (
                              prodSortDirection === 'asc' ? <ArrowUp size={12} className="text-[#e92c5d]" /> : <ArrowDown size={12} className="text-[#e92c5d]" />
                            ) : (
                              <ArrowUpDown size={12} className="opacity-40" />
                            )}
                          </div>
                        </th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedProducts.map(p => {
                        const editedVals = getInlineValues(p);
                        const hasVariants = editedVals.variants && editedVals.variants.length > 0;
                        const inStock = hasVariants
                          ? editedVals.variants!.some(v => Number(v.stock || 0) > 0)
                          : editedVals.stock > 0;
                        const isModified = Boolean(inlineEdits[p.id]);
                        const isSaving = Boolean(inlineSaving[p.id]);
                        const isSaved = Boolean(inlineSaved[p.id]);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-8 py-5 align-top flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-xl p-1 border border-slate-100 flex items-center justify-center shrink-0">
                                {(!p.images?.[0] || brokenImages[p.id]) ? <ImageIcon className="text-slate-200" size={20} /> : <img src={p.images[0]} className="max-h-full max-w-full object-contain" onError={() => handleImageError(p.id)} />}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-700 block truncate max-w-xs">{p.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">SKU: {p.sku || 'N/A'}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${inStock ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {inStock ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 align-top text-slate-400 font-medium text-sm">
                              {Array.isArray(p.category) ? p.category.join(', ') : p.category}
                            </td>
                            <td className="px-6 py-5 align-top">
                              {hasVariants ? (
                                <div className="flex flex-col gap-2 py-0.5">
                                  {editedVals.variants!.map((v, vIdx) => {
                                    const vLabel = getVariantLabel(v, vIdx);
                                    return (
                                      <div key={v.id || vIdx} className="flex items-center gap-2">
                                        <span 
                                          className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md shrink-0 truncate max-w-[120px] border border-slate-200/60"
                                          title={vLabel}
                                        >
                                          {vLabel}
                                        </span>
                                        <div className="relative w-24">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">৳</span>
                                          <input
                                            type="number"
                                            value={v.price}
                                            onChange={(e) => handleVariantPriceChange(p.id, vIdx, Number(e.target.value))}
                                            className="w-full pl-5 pr-1.5 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:bg-white focus:border-[#e92c5d] focus:ring-1 focus:ring-[#e92c5d] outline-none transition-all"
                                            placeholder="Price"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 w-28 py-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black uppercase text-slate-400 w-7">Sale:</span>
                                    <div className="relative flex-1">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">৳</span>
                                      <input
                                        type="number"
                                        value={editedVals.price}
                                        onChange={(e) => handleInlinePriceChange(p.id, Number(e.target.value))}
                                        className="w-full pl-5 pr-1.5 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:bg-white focus:border-[#e92c5d] focus:ring-1 focus:ring-[#e92c5d] outline-none transition-all"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black uppercase text-slate-400 w-7">MRP:</span>
                                    <div className="relative flex-1">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">৳</span>
                                      <input
                                        type="number"
                                        placeholder="Optional"
                                        value={editedVals.originalPrice ?? ''}
                                        onChange={(e) => handleInlineOriginalPriceChange(p.id, e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full pl-5 pr-1.5 py-0.5 bg-transparent border-b border-dashed border-slate-200 text-[10px] font-semibold text-slate-500 focus:border-[#e92c5d] outline-none transition-all"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-5 align-top">
                              {hasVariants ? (
                                <div className="flex flex-col gap-2 py-0.5">
                                  {editedVals.variants!.map((v, vIdx) => {
                                    const vLabel = getVariantLabel(v, vIdx);
                                    const vStock = Number(v.stock || 0);
                                    return (
                                      <div key={v.id || vIdx} className="flex items-center gap-2">
                                        <span 
                                          className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md shrink-0 truncate max-w-[120px] border border-slate-200/60"
                                          title={vLabel}
                                        >
                                          {vLabel}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="number"
                                            value={vStock}
                                            onChange={(e) => handleVariantStockChange(p.id, vIdx, Number(e.target.value))}
                                            className="w-16 px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:bg-white focus:border-[#e92c5d] focus:ring-1 focus:ring-[#e92c5d] outline-none transition-all"
                                            placeholder="Stock"
                                          />
                                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${vStock > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                            {vStock > 0 ? 'In' : '0'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div className="text-[10px] font-black text-slate-400 pt-0.5">
                                    Total: <span className="text-slate-700 font-extrabold">{editedVals.variants!.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}</span> pcs
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 py-0.5">
                                  <input
                                    type="number"
                                    value={editedVals.stock}
                                    onChange={(e) => handleInlineStockChange(p.id, Number(e.target.value))}
                                    className="w-20 px-2.5 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:bg-white focus:border-[#e92c5d] focus:ring-1 focus:ring-[#e92c5d] outline-none transition-all"
                                  />
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${editedVals.stock > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {editedVals.stock > 0 ? 'In Stock' : 'Out'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right align-top">
                              <div className="flex items-center justify-end gap-2">
                                {isSaved ? (
                                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm animate-in fade-in">
                                    <Check size={14} /> Saved!
                                  </span>
                                ) : isModified ? (
                                  <button
                                    onClick={() => saveInlineProduct(p.id)}
                                    disabled={isSaving}
                                    className="bg-[#e92c5d] hover:bg-[#c81d4a] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-200 transition-all active:scale-95 disabled:opacity-50"
                                    title="Save inline changes"
                                  >
                                    {isSaving ? (
                                      <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Save size={13} />
                                        <span>Save</span>
                                      </>
                                    )}
                                  </button>
                                ) : null}
                                <button onClick={() => startEditProduct(p)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-blue-500 shadow-sm hover:border-blue-200 transition-colors" title="Full Product Edit"><Pencil size={18} /></button>
                                <button onClick={() => deleteProduct(p.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 shadow-sm hover:border-red-200 transition-colors" title="Delete Product"><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center bg-white rounded-2xl border border-gray-100 px-8 py-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-400">
                      Showing <span className="text-slate-600">{(activePage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="text-slate-600">
                        {Math.min(activePage * itemsPerPage, filteredProducts.length)}
                      </span>{' '}
                      of <span className="text-[#e92c5d]">{filteredProducts.length}</span> products
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={activePage === 1}
                        onClick={() => { setProdPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="p-2.5 rounded-xl border border-slate-100 text-slate-400 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => {
                          if (
                            pNum === 1 ||
                            pNum === totalPages ||
                            Math.abs(pNum - activePage) <= 1
                          ) {
                            return (
                              <button
                                key={pNum}
                                onClick={() => { setProdPage(pNum); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                                className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                                  activePage === pNum
                                    ? 'bg-[#e92c5d] text-white shadow-md shadow-rose-100 scale-105'
                                    : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                                }`}
                              >
                                {pNum}
                              </button>
                            );
                          }
                          if (pNum === 2 || pNum === totalPages - 1) {
                            return (
                              <span key={`ellipsis-${pNum}`} className="text-slate-300 font-bold px-1 text-xs select-none">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <button
                        disabled={activePage === totalPages}
                        onClick={() => { setProdPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        className="p-2.5 rounded-xl border border-slate-100 text-slate-400 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <div className="sticky top-0 md:top-[60px] z-40 bg-[#fcfdfd]/90 backdrop-blur-md py-4 flex items-center justify-between border-b border-gray-100/80 px-2 transition-all">
                  <button onClick={closeForms} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold text-sm uppercase tracking-widest transition-colors"><ChevronRight size={20} className="rotate-180" /> Back</button>
                  <button onClick={handleProductSubmit} className="bg-[#e92c5d] text-white px-10 py-3.5 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-[#c81d4a] flex items-center gap-2 transition-all active:scale-95 hover:shadow-xl"><Save size={18} /> Save Product</button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#1a3a34]">Images</h3>
                    <div onClick={() => !isUploadingImage && fileInputRef.current?.click()} className={`border-2 border-dashed border-[#d1e7dd] rounded-2xl bg-[#f9fdfb] py-16 flex flex-col items-center justify-center transition-all group ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#fdf2f5]'}`}>
                      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        
                        setIsUploadingImage(true);
                        try {
                          const newUrls: string[] = [];
                          for (const file of files) {
                            let authRes;
                            try {
                              authRes = await fetch('/api/imagekit-auth');
                            } catch (e: any) {
                              throw new Error(`Authentication fetch failed (Network/Adblocker/CORS): ${e.message}`);
                            }

                            if (!authRes.ok) {
                              const errData = await authRes.json().catch(() => ({}));
                              console.error('Failed to authenticate for file', file.name, errData);
                              alert(`Authentication failed: Server returned ${authRes.status}. Ensure backend is running and env vars are set.`);
                              continue; // Skip this file and try the next one
                            }
                            const authData = await authRes.json();
                            
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('publicKey', authData.publicKey || import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string);
                            formData.append('signature', authData.signature);
                            formData.append('expire', authData.expire.toString());
                            formData.append('token', authData.token);
                            formData.append('fileName', file.name);
                            formData.append('folder', '/products');
                            
                            let uploadRes;
                            try {
                              uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                                method: 'POST',
                                body: formData,
                              });
                            } catch (e: any) {
                              throw new Error(`ImageKit upload blocked (Network/Adblocker): ${e.message}. Please disable adblockers and try again.`);
                            }
                            
                            if (uploadRes.ok) {
                              const data = await uploadRes.json();
                              newUrls.push(data.url);
                            } else {
                              const errData = await uploadRes.json().catch(() => ({}));
                              console.error('ImageKit direct upload failed for', file.name, ':', errData);
                              alert(`Upload failed: ${errData.message || 'Unknown error from ImageKit'}`);
                            }
                          }
                          
                          setProdForm(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
                        } catch (error: any) {
                          console.error('Image upload failed', error);
                          alert(`Failed to upload images: ${error.message}`);
                        } finally {
                          setIsUploadingImage(false);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                      }} />
                      {isUploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e92c5d] mb-2"></div>
                          <p className="text-[#e92c5d] font-black text-lg">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <PlusCircle size={32} className="text-[#e92c5d] mb-2" />
                          <p className="text-[#e92c5d] font-black text-lg">Click to select product images</p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4">{prodForm.images.map((img, idx) => (<div key={idx} className="relative w-24 h-24 border rounded-xl overflow-hidden p-2 group"><img src={img} className="w-full h-full object-contain" /><button onClick={() => setProdForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>{idx > 0 && (<button onClick={() => setProdForm(p => { const newImages = [...p.images]; [newImages[idx - 1], newImages[idx]] = [newImages[idx], newImages[idx - 1]]; return { ...p, images: newImages }; })} className="absolute bottom-1 left-1 bg-gray-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={10} /></button>)}{idx < prodForm.images.length - 1 && (<button onClick={() => setProdForm(p => { const newImages = [...p.images]; [newImages[idx + 1], newImages[idx]] = [newImages[idx], newImages[idx + 1]]; return { ...p, images: newImages }; })} className="absolute bottom-1 right-1 bg-gray-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={10} /></button>)}</div>))}</div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label><input required value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-base font-bold outline-none focus:ring-2 focus:ring-[#e92c5d]" /></div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Regular M.R.P (৳)</label><input required type="number" value={prodForm.basePrice} onChange={e => setProdForm({ ...prodForm, basePrice: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold" placeholder="Base Retail Price" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sale Price (৳) - Optional</label><input type="number" value={prodForm.salePrice} onChange={e => setProdForm({ ...prodForm, salePrice: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold text-rose-600" placeholder="Selling Price" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2 relative" ref={categoryDropdownRef}>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categories</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold flex justify-between items-center text-left"
                        >
                          <span className="truncate">
                            {prodForm.category.length > 0
                              ? prodForm.category.join(', ')
                              : 'Select Categories'}
                          </span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </button>
                        {showCategoryDropdown && (
                          <div 
                            className="absolute z-[100] w-full mt-2 bg-white border border-[#d1e7dd] rounded-xl shadow-xl max-h-60 overflow-y-auto overscroll-contain custom-scrollbar"
                            onWheel={(e) => e.stopPropagation()}
                          >
                            {hierarchicalCategories.map((c) => (
                              <label
                                key={c.id}
                                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                              >
                                <span className="mr-3 text-gray-300 select-none">
                                  {'\u00A0'.repeat(c.level * 4) + (c.level > 0 ? '↳ ' : '')}
                                </span>
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-rose-500 rounded border-gray-300 focus:ring-rose-500 mr-3 cursor-pointer"
                                  checked={prodForm.category.includes(c.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setProdForm({ ...prodForm, category: [...prodForm.category, c.name] });
                                    } else {
                                      setProdForm({ ...prodForm, category: prodForm.category.filter(cat => cat !== c.name) });
                                    }
                                  }}
                                />
                                <span className="text-sm font-medium text-gray-700">{c.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand</label>
                      <div className="relative">
                        <select 
                          value={prodForm.brand} 
                          onChange={e => {
                            if (e.target.value === '__create_new__') {
                              setShowInlineBrandForm(true);
                              setProdForm(p => ({ ...p, brand: '' }));
                            } else {
                              setProdForm(p => ({ ...p, brand: e.target.value }));
                            }
                          }} 
                          className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold appearance-none bg-white"
                        >
                          <option value="">No Brand</option>
                          {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                          <option value="__create_new__" className="text-[#e92c5d] font-bold">+ Create New Brand...</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                      </div>
                      
                      {showInlineBrandForm && (
                        <div className="mt-2.5 p-4 bg-gray-50 border border-gray-150 rounded-2xl flex gap-2.5 items-center animate-in slide-in-from-top-2 duration-200">
                          <input
                            placeholder="Enter new brand name..."
                            value={newBrandName}
                            onChange={e => setNewBrandName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateBrandInline())}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500"
                            disabled={isCreatingBrand}
                          />
                          <button
                            type="button"
                            onClick={handleCreateBrandInline}
                            disabled={isCreatingBrand || !newBrandName.trim()}
                            className="bg-[#e92c5d] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#c81d4a] active:scale-95 transition-all shadow-md disabled:opacity-50"
                          >
                            {isCreatingBrand ? "..." : "Create"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowInlineBrandForm(false);
                              setNewBrandName('');
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU</label>
                      <input 
                        required 
                        placeholder="e.g. ZB-001" 
                        value={prodForm.sku} 
                        onChange={e => setProdForm({ ...prodForm, sku: e.target.value })} 
                        className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#e92c5d]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit</label>
                      <input 
                        placeholder="e.g. Pack, kg, pcs" 
                        value={prodForm.unit} 
                        onChange={e => setProdForm({ ...prodForm, unit: e.target.value })} 
                        className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#e92c5d]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Short Description</label><RichTextEditor value={prodForm.shortDescription} onChange={val => setProdForm({ ...prodForm, shortDescription: val })} label="Brief Overview" height="150px" /></div>
                  <div className="space-y-2 pt-10"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Description</label><RichTextEditor value={prodForm.description} onChange={val => setProdForm({ ...prodForm, description: val })} label="Long Product Content" height="300px" /></div>

                  <div className="space-y-6 pt-10 border-t border-gray-100">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-[#e92c5d]">Attributes & Variants</h3>
                      <p className="text-sm text-gray-500">Manage size, color, or other options with dynamic pricing.</p>
                    </div>
                    {prodForm.tempAttributes.map((attr, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-rose-50/20 p-4 rounded-xl border border-rose-100/50">
                        <div className="flex gap-2 items-center">
                          <span className="font-black text-[#e92c5d] text-xs uppercase tracking-widest">{attr.name}:</span>
                          <div className="flex flex-wrap gap-1">
                            {attr.options.map((opt, i) => (<span key={i} className="bg-white border border-rose-200 px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-700">{opt}</span>))}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeTempAttribute(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {showAttrForm ? (
                      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6 relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowAttrForm(false)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"><X size={20} /></button>
                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-gray-600">Use Global Attribute (Optional)</label>
                          <div className="relative">
                            <select onChange={(e) => handleGlobalAttrSelect(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-rose-500 appearance-none bg-white text-gray-400">
                              <option value="">Select a global attribute...</option>
                              {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-2">
                            <label className="text-[13px] font-medium text-gray-600">Attribute Name</label>
                            <input placeholder="e.g. Color" value={draftAttr.name} onChange={(e) => setDraftAttr(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-rose-500" />
                          </div>
                          <div className="flex-[2] space-y-2 relative">
                            <label className="text-[13px] font-medium text-gray-600">Options</label>
                            {draftAttr.globalAttrId ? (
                              <div className="relative">
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <input 
                                      placeholder="Search options or type new one..." 
                                      value={draftAttr.currentOption} 
                                      onChange={(e) => {
                                        setDraftAttr(prev => ({ ...prev, currentOption: e.target.value }));
                                        setShowOptionsDropdown(true);
                                      }}
                                      onFocus={() => setShowOptionsDropdown(true)}
                                      className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-rose-500 bg-white" 
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={async () => {
                                      if (!draftAttr.currentOption.trim()) return;
                                      const selected = attributes.find(a => a.id === draftAttr.globalAttrId);
                                      if (selected) {
                                        const exists = selected.values.some(v => v.value.toLowerCase() === draftAttr.currentOption.trim().toLowerCase());
                                        if (!exists) {
                                          await handleCreateNewGlobalValue(draftAttr.currentOption.trim());
                                        } else {
                                          const actualVal = selected.values.find(v => v.value.toLowerCase() === draftAttr.currentOption.trim().toLowerCase())?.value || draftAttr.currentOption.trim();
                                          if (!draftAttr.options.includes(actualVal)) {
                                            setDraftAttr(prev => ({
                                              ...prev,
                                              options: [...prev.options, actualVal],
                                              currentOption: ''
                                            }));
                                          }
                                        }
                                      }
                                    }} 
                                    className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#c81d4a] transition-all active:scale-95 shadow-md"
                                  >
                                    Add
                                  </button>
                                </div>
                                
                                {showOptionsDropdown && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowOptionsDropdown(false)}></div>
                                    <div data-lenis-prevent className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 max-h-60 overflow-y-auto z-20 animate-in slide-in-from-top-2 duration-200">
                                      {(() => {
                                        const selected = attributes.find(a => a.id === draftAttr.globalAttrId);
                                        if (!selected) return null;
                                        
                                        const filteredValues = selected.values.filter(v => 
                                          v.value.toLowerCase().includes(draftAttr.currentOption.toLowerCase())
                                        );
                                        
                                        const exactMatch = selected.values.some(v => 
                                          v.value.toLowerCase() === draftAttr.currentOption.trim().toLowerCase()
                                        );
                                        
                                        return (
                                          <div className="space-y-1">
                                            {filteredValues.map(v => {
                                              const isSelected = draftAttr.options.includes(v.value);
                                              return (
                                                <button
                                                  key={v.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setDraftAttr(prev => {
                                                      const newOptions = isSelected 
                                                        ? prev.options.filter(o => o !== v.value) 
                                                        : [...prev.options, v.value];
                                                      return { ...prev, options: newOptions };
                                                    });
                                                  }}
                                                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                                                    isSelected 
                                                      ? 'bg-rose-50/50 text-[#e92c5d] font-bold border border-rose-100/30' 
                                                      : 'hover:bg-gray-50 text-gray-700'
                                                  }`}
                                                >
                                                  <span>{v.value}</span>
                                                  {isSelected && <Check size={16} className="text-[#e92c5d]" />}
                                                </button>
                                              );
                                            })}
                                            
                                            {filteredValues.length === 0 && (
                                              <p className="text-xs text-gray-400 text-center py-4 font-medium italic">
                                                No matching global options found.
                                              </p>
                                            )}
                                            
                                            {draftAttr.currentOption.trim() && !exactMatch && (
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  await handleCreateNewGlobalValue(draftAttr.currentOption.trim());
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-3 mt-2 rounded-xl text-left text-xs font-black text-[#e92c5d] bg-[#fff0f3] hover:bg-[#ffe3e8] border border-[#ffccd5] transition-all"
                                              >
                                                <Plus size={14} className="text-[#e92c5d]" />
                                                <span>Create &amp; select option "{draftAttr.currentOption.trim()}"</span>
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <input placeholder="e.g. Red" value={draftAttr.currentOption} onChange={(e) => setDraftAttr(prev => ({ ...prev, currentOption: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())} className="flex-1 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-rose-500 bg-white" />
                                <button type="button" onClick={handleAddOption} className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#c81d4a] transition-all active:scale-95 shadow-md">Add</button>
                              </div>
                            )}
                            <p className="text-[12px] text-rose-600/70 font-medium">
                              {draftAttr.globalAttrId 
                                ? "Select options from the dropdown or type a custom one to create & add it." 
                                : "Enter an option and click Add or press Enter."}
                            </p>
                          </div>
                        </div>
                        {draftAttr.options.length > 0 && (
                          <div className="pt-4 border-t flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                              {draftAttr.options.map((o, i) => (
                                <span key={i} className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl border border-rose-100 text-xs font-bold shadow-sm">
                                  {o}
                                  <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setDraftAttr(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))} />
                                </span>
                              ))}
                            </div>
                            <div className="flex justify-end pt-2">
                              <button type="button" onClick={commitDraftAttribute} className="bg-[#e92c5d] text-white px-10 py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-[#c81d4a] transition-all">Confirm Attribute Block</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowAttrForm(true)} className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"><PlusCircle size={18} className="text-[#e92c5d]" /> Add Attribute</button>
                    )}
                    <button type="button" onClick={generateVariants} className="w-full bg-slate-800 text-white px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2">Generate Variants Table</button>
                    {prodForm.variants.length > 0 && (
                      <div className="space-y-3">
                        {prodForm.variants.map((v, vIdx) => (
                          <div key={v.id || vIdx} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-2xl items-center">
                            {/* Variant Image Cell */}
                            <div className="col-span-1 relative flex justify-center">
                              <button
                                type="button"
                                onClick={() => setActiveImagePickerIdx(activeImagePickerIdx === vIdx ? null : vIdx)}
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all bg-white overflow-hidden group shadow-sm ${
                                  v.image ? 'border-[#e92c5d] hover:border-[#c81d4a]' : 'border-dashed border-gray-300 hover:border-gray-400'
                                }`}
                                title="Select Variant Image"
                              >
                                {v.image ? (
                                  <img src={v.image} className="w-full h-full object-cover" alt="Variant thumbnail" />
                                ) : (
                                  <ImageIcon size={16} className="text-gray-400 group-hover:text-gray-600" />
                                )}
                              </button>

                              {activeImagePickerIdx === vIdx && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setActiveImagePickerIdx(null)}></div>
                                  <div data-lenis-prevent className="absolute left-0 mt-12 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-40 flex gap-2 max-w-[240px] overflow-x-auto shadow-2xl animate-in slide-in-from-top-2 duration-150">
                                    {prodForm.images.length === 0 ? (
                                      <span className="text-[10px] text-gray-400 italic p-1 whitespace-nowrap">Upload product images first</span>
                                    ) : (
                                      <>
                                        {prodForm.images.map((imgUrl, imgIdx) => (
                                          <button
                                            key={imgIdx}
                                            type="button"
                                            onClick={() => {
                                              const vs = [...prodForm.variants];
                                              vs[vIdx].image = imgUrl;
                                              setProdForm({ ...prodForm, variants: vs });
                                              setActiveImagePickerIdx(null);
                                            }}
                                            className={`w-10 h-10 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
                                              v.image === imgUrl ? 'border-[#e92c5d] scale-105 shadow-md' : 'border-gray-100 hover:border-gray-300'
                                            }`}
                                          >
                                            <img src={imgUrl} className="w-full h-full object-cover" alt="Product thumbnail" />
                                          </button>
                                        ))}
                                        {v.image && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const vs = [...prodForm.variants];
                                              vs[vIdx].image = undefined;
                                              setProdForm({ ...prodForm, variants: vs });
                                              setActiveImagePickerIdx(null);
                                            }}
                                            className="w-10 h-10 rounded-lg border-2 border-dashed border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0 text-[10px] font-bold"
                                          >
                                            Clear
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Rest of the fields */}
                            <div className="col-span-2 font-black text-xs text-[#e92c5d] break-all">{Object.values(v.attributeValues).join(' / ')}</div>
                            <div className="col-span-2"><input type="number" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold" value={v.originalPrice || v.price} onChange={e => { const vs = [...prodForm.variants]; vs[vIdx].originalPrice = parseFloat(e.target.value) || 0; setProdForm({ ...prodForm, variants: vs }); }} placeholder="MRP" /></div>
                            <div className="col-span-2"><input type="number" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-rose-600" value={v.price} onChange={e => { const vs = [...prodForm.variants]; vs[vIdx].price = parseFloat(e.target.value) || 0; setProdForm({ ...prodForm, variants: vs }); }} placeholder="Selling Price" /></div>
                            <div className="col-span-3"><input type="number" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold" value={v.stock} onChange={e => { const vs = [...prodForm.variants]; vs[vIdx].stock = parseInt(e.target.value) || 0; setProdForm({ ...prodForm, variants: vs }); }} placeholder="Stock" /></div>
                            <div className="col-span-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const vs = prodForm.variants.filter((_, idx) => idx !== vIdx);
                                  setProdForm({ ...prodForm, variants: vs });
                                }}
                                className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                                title="Delete Variant"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        }

        {/* Global Attributes Tab - FIXED COMMA ISSUE AND REFINED UI */}
        {
          adminTab === 'attributes' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Global Attributes</h2><p className="text-slate-400 text-sm">Define global variant options like Size, Color, etc.</p></div>
                <button onClick={() => { setIsAdding('attribute'); setAttrForm({ name: '' }); setAttrValuesInput(''); }} className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl"><Plus size={18} /> Add Attribute</button>
              </div>

              {(isAdding === 'attribute' || editingItem?.type === 'attribute') && (
                <form onSubmit={handleAttributeSubmit} className="bg-white rounded-2xl border border-rose-100 p-10 shadow-xl space-y-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1">Attribute Name</label>
                      <input required value={attrForm.name} onChange={e => setAttrForm({ ...attrForm, name: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black" placeholder="e.g. Size" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1">VALUES (COMMA SEPARATED)</label>
                      <input
                        required
                        value={attrValuesInput}
                        onChange={e => setAttrValuesInput(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black"
                        placeholder="e.g. 50ml, 100ml"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-8">
                    <button type="button" onClick={closeForms} className="text-gray-400 hover:text-gray-600 font-black uppercase text-[13px] tracking-widest transition-colors">CANCEL</button>
                    <button type="submit" className="bg-[#e92c5d] text-white px-10 py-4 rounded-xl font-black uppercase text-[13px] tracking-widest shadow-lg transition-all hover:bg-[#c81d4a] active:scale-95">SAVE ATTRIBUTE</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attributes.map(attr => (
                  <div key={attr.id} className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">{attr.name}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem({ type: 'attribute', data: attr }); setAttrForm({ name: attr.name }); setAttrValuesInput(attr.values.map(v => v.value).join(', ')); }} className="text-gray-400 hover:text-blue-500"><Pencil size={16} /></button>
                        <button onClick={() => deleteAttribute(attr.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map(v => (<span key={v.id} className="bg-gray-50 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold border border-gray-100">{v.value}</span>))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Categories Tab */}
        {
          adminTab === 'categories' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Categories</h2><p className="text-slate-400 text-sm">Organize your products catalog.</p></div>
                <button onClick={() => setIsAdding('category')} className="bg-[#E92C5D] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#C81D4A] transition-all"><Plus size={18} /> Add Category</button>
              </div>
              {(isAdding === 'category' || editingItem?.type === 'category') && (
                <form onSubmit={handleCategorySubmit} className="bg-white rounded-2xl border border-rose-100 p-8 shadow-xl animate-in slide-in-from-top-4 duration-500 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Category Name</label><input required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Parent Category</label><select value={catForm.parentId || ''} onChange={e => setCatForm({ ...catForm, parentId: e.target.value || null })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold"><option value="">None (Top Level)</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <div className="flex justify-end gap-3"><button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px]">Cancel</button><button type="submit" className="bg-rose-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all hover:bg-rose-700">Save Category</button></div>
                </form>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">Category Name</th><th className="px-6 py-6">Parent</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {hierarchicalCategories.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-5"><div className="flex items-center gap-3" style={{ marginLeft: `${c.level * 24}px` }}>{c.level > 0 && <ChevronRight size={14} className="text-slate-300" />}<span className={`font-bold text-slate-700 ${c.level === 0 ? 'text-base' : 'text-sm'}`}>{c.name}</span></div></td>
                        <td className="px-6 py-5 text-slate-400 font-medium text-xs">{c.parentId ? categories.find(cat => cat.id === c.parentId)?.name : 'Top Level'}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => { setEditingItem({ type: 'category', data: c }); setCatForm({ name: c.name, parentId: c.parentId || null, image: c.image }); }} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-blue-500 shadow-sm"><Pencil size={18} /></button>
                          <button onClick={() => deleteCategory(c.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {/* Brands Tab */}
        {
          adminTab === 'brands' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Brands</h2><p className="text-slate-400 text-sm">Manage product brands and logos.</p></div>
                <button onClick={() => setIsAdding('brand')} className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl"><Plus size={18} /> Add Brand</button>
              </div>
              {(isAdding === 'brand' || editingItem?.type === 'brand') && (
                <form onSubmit={handleBrandSubmit} className="bg-white rounded-2xl border border-rose-100 p-8 shadow-xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Brand Name</label>
                        <input required value={brandForm.name} onChange={e => {
                          const name = e.target.value;
                          const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                          setBrandForm({ ...brandForm, name, slug: brandForm.slug || isAdding === 'brand' ? slug : brandForm.slug });
                        }} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Slug (URL Path)</label>
                        <input value={brandForm.slug} onChange={e => setBrandForm({ ...brandForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-rose-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Brand Logo (Optional)</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-gray-50 rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden group">
                          {brandForm.logo_url ? (
                            <>
                              <img src={brandForm.logo_url} className="w-full h-full object-contain p-2" alt="logo preview" />
                              <button type="button" onClick={() => setBrandForm({ ...brandForm, logo_url: '' })} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={20} />
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="text-gray-300" size={32} />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="cursor-pointer bg-[#e92c5d] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#c81d4a] transition-colors flex items-center gap-2 w-fit">
                            <Upload size={14} /> Upload Logo
                            <input type="file" className="hidden" accept="image/*" onChange={handleBrandLogoUpload} />
                          </label>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">Recommended size: 200x200px. <br /> Transparent PNG works best.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3"><button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px]">Cancel</button><button type="submit" className="bg-rose-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px]">Save Brand</button></div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {brands.map(brand => (
                  <div key={brand.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1.5 border border-gray-50 shadow-sm">{brand.logo_url ? <img src={brand.logo_url} className="max-h-full max-w-full object-contain" /> : <Globe className="text-gray-300" />}</div>
                      <span className="font-bold text-gray-700">{brand.name}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem({ type: 'brand', data: brand }); setBrandForm({ name: brand.name, slug: brand.slug || '', logo_url: brand.logo_url || '' }); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Pencil size={16} /></button>
                      <button onClick={() => deleteBrand(brand.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Orders Tab */}
        {
          adminTab === 'orders' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Order Management</h2><p className="text-slate-400 text-sm">Process incoming orders and update tracking status.</p></div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">Order ID</th><th className="px-6 py-6">Customer</th><th className="px-6 py-6">Date</th><th className="px-6 py-6">Total</th><th className="px-6 py-6">Status</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-5 font-black text-gray-800">#{order.id}</td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col"><span className="font-bold text-gray-700">{order.customerName}</span><span className="text-xs text-gray-400">{order.customerPhone}</span></div>
                        </td>
                        <td className="px-6 py-5 text-gray-400 font-bold text-sm">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-6 py-5 font-black text-gray-900">৳{order.total.toFixed(2)}</td>
                        <td className="px-6 py-5">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                        </td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => { setViewingOrder(order); setIsEditingOrder(false); }} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-rose-500 shadow-sm"><Eye size={18} /></button>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                          >
                            {['Pending', 'Processing', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewingOrder && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                  <div data-lenis-prevent className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl space-y-10 animate-in zoom-in-95 relative">
                    <div className="flex justify-between items-center border-b pb-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-black text-gray-800">Order Details <span className="text-rose-500">#{viewingOrder.id}</span></h3>
                        {!isEditingOrder && (
                          <div className="flex gap-2">
                            <button onClick={() => printInvoice(viewingOrder)} className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors">
                              <Printer size={12} /> Print Invoice
                            </button>
                            <button onClick={startEditingOrder} className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-colors">
                              <Edit3 size={12} /> Edit Order
                            </button>
                          </div>
                        )}
                      </div>
                      <button onClick={closeForms} className="text-gray-300 hover:text-red-500"><X size={32} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Customer Information</h4>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 text-sm">
                          {isEditingOrder ? (
                            <>
                              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name</label><input value={editingOrderData?.customerName} onChange={e => updateCustomerInfo('customerName', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-1 focus:ring-rose-500" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label><input value={editingOrderData?.customerEmail} onChange={e => updateCustomerInfo('customerEmail', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label><input value={editingOrderData?.customerPhone} onChange={e => updateCustomerInfo('customerPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" /></div>
                              </div>
                              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Street Address</label><input value={editingOrderData?.customerAddress} onChange={e => updateCustomerInfo('customerAddress', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">District</label><select value={editingOrderData?.customerDistrict} onChange={e => updateCustomerInfo('customerDistrict', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none"><option value="">Select District</option>{Object.keys(DISTRICT_AREA_DATA).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area</label><select value={editingOrderData?.customerArea} onChange={e => updateCustomerInfo('customerArea', e.target.value)} disabled={!editingOrderData?.customerDistrict} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none disabled:opacity-50"><option value="">Select Area</option>{editingOrderData?.customerDistrict && DISTRICT_AREA_DATA[editingOrderData.customerDistrict].map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-black text-gray-800">{viewingOrder.customerName}</p>
                              <p className="font-bold text-gray-500">{viewingOrder.customerEmail}</p>
                              <p className="font-bold text-gray-500">{viewingOrder.customerPhone}</p>
                              <p className="font-bold text-gray-500 pt-4 leading-relaxed">{viewingOrder.customerAddress}, {viewingOrder.customerArea}, {viewingOrder.customerDistrict}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Order Summary</h4>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3 font-bold text-sm">
                          <div className="flex justify-between"><span>Subtotal</span><span className="text-gray-800 font-black">৳{(isEditingOrder ? editingOrderData?.subtotal : viewingOrder.subtotal)?.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center"><span>Shipping Fee</span>{isEditingOrder ? (<div className="flex items-center gap-2"><span className="text-xs text-gray-400">৳</span><input type="number" className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-right text-sm font-black text-[#1a3a34] focus:ring-1 focus:ring-rose-500 outline-none" value={editingOrderData?.shippingCost} onChange={(e) => changeOrderShipping(parseFloat(e.target.value) || 0)} /></div>) : (<span className="text-gray-800 font-black">৳{viewingOrder.shippingCost.toFixed(2)}</span>)}</div>
                          <div className="flex justify-between text-rose-600"><span className="flex items-center gap-1.5">{viewingOrder.coupon_code && <Ticket size={12} />} Discount {viewingOrder.coupon_code && `(${viewingOrder.coupon_code})`}</span><span className="font-black">-৳{(isEditingOrder ? editingOrderData?.discount : viewingOrder.discount)?.toFixed(2)}</span></div>
                          <div className="flex justify-between text-lg font-black pt-3 border-t border-gray-200"><span>Total</span><span className="text-rose-600 text-xl font-black">৳{(isEditingOrder ? editingOrderData?.total : viewingOrder.total)?.toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center"><h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Package size={16} className="text-rose-500" /> Items Purchased</h4>{isEditingOrder && (<div className="relative"><button onClick={() => setShowProductPicker(!showProductPicker)} className="flex items-center gap-2 bg-[#e92c5d] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c81d4a] transition-all shadow-lg active:scale-95"><Plus size={14} /> Add Item</button>{showProductPicker && (<div className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-[2rem] shadow-2xl p-6 z-[110] animate-in slide-in-from-top-2 duration-300"><div className="relative mb-5"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input autoFocus placeholder="Search products..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-rose-50 focus:bg-white focus:border-rose-500 transition-all" value={orderProductSearch} onChange={(e) => setOrderProductSearch(e.target.value)} /></div><div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">{orderSearchFilteredProducts.map(p => (<div key={p.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-all"><div className="flex justify-between items-center mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl p-1 border border-gray-100 flex items-center justify-center"><img src={p.images?.[0] || ''} className="max-h-full max-w-full object-contain" /></div><span className="text-xs font-black text-gray-800 leading-tight">{p.name}</span></div><span className="text-[11px] font-black text-[#e92c5d] bg-white px-2 py-1 rounded-lg border border-rose-50 shadow-sm">৳{p.price}</span></div>{p.variants && p.variants.length > 0 ? (<div className="flex flex-wrap gap-2">{p.variants.map(v => (<button key={v.id} onClick={() => addProductToOrder(p, v)} className="text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 hover:bg-[#e92c5d] hover:text-white hover:border-[#e92c5d] transition-all">{Object.values(v.attributeValues).join(' / ')}</button>))}</div>) : (<button onClick={() => addProductToOrder(p)} className="w-full text-[9px] font-black uppercase tracking-widest bg-[#e92c5d] text-white py-2 rounded-xl hover:bg-[#c81d4a] transition-all shadow-md active:scale-95">Add Piece</button>)}</div>))}{orderSearchFilteredProducts.length === 0 && orderProductSearch && (<div className="text-center py-10"><Search size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-xs font-bold text-gray-400 italic">No products matched "{orderProductSearch}"</p></div>)}</div></div>)}</div>)}</div>
                      <div className="space-y-3">{(isEditingOrder ? editingOrderData?.items : viewingOrder.items)?.map((item, idx) => (<div key={idx} className="flex justify-between items-center p-5 bg-gray-50/50 rounded-[2rem] border border-gray-50 group hover:bg-rose-50/30 transition-all duration-300"><div className="flex items-center gap-5"><div className="w-14 h-14 bg-white rounded-2xl p-2 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden group-hover:scale-105 transition-transform"><img src={item.selectedVariantImage || item.images?.[0] || ''} className="max-h-full max-w-full object-contain" /></div><div><p className="font-black text-gray-800 text-[15px] leading-tight mb-1">{item.name}</p>{item.selectedVariantName && (<p className="text-[10px] font-black text-rose-500 uppercase tracking-widest inline-block bg-white px-2 py-0.5 rounded-lg border border-rose-50">{item.selectedVariantName}</p>)}</div></div><div className="flex items-center gap-10"><div className="flex items-center gap-5">{isEditingOrder ? (<div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm ring-4 ring-gray-100"><button onClick={() => changeOrderItemQty(idx, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"><Minus size={14} /></button><span className="w-8 text-center text-sm font-black text-[#1a3a34]">{item.quantity}</span><button onClick={() => changeOrderItemQty(idx, 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors"><Plus size={14} /></button></div>) : (<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty: <span className="text-gray-700 text-sm ml-1">{item.quantity}</span></p>)}</div><div className="text-right min-w-[120px]"><div className="text-base font-black text-[#1a3a34]">৳{(item.price * item.quantity).toFixed(2)}</div><div className="text-[10px] font-bold text-gray-400">৳{item.price.toFixed(2)} / unit</div></div>{isEditingOrder && (<button onClick={() => removeOrderItem(idx)} className="w-10 h-10 flex items-center justify-center bg-white text-gray-300 hover:text-red-500 hover:bg-red-50 border border-gray-100 rounded-2xl transition-all shadow-sm active:scale-90"><Trash2 size={18} /></button>)}</div></div>))}</div>
                    </div>
                    {isEditingOrder && (<div className="pt-12 flex gap-5 border-t border-gray-50"><button onClick={closeForms} className="flex-1 bg-gray-50 text-gray-400 font-black py-5 rounded-[1.2rem] uppercase text-xs tracking-widest hover:bg-gray-100 transition-all active:scale-95">Discard Changes</button><button onClick={saveOrderEdits} className="flex-[2] bg-[#e92c5d] text-white font-black py-5 rounded-[1.2rem] uppercase text-xs tracking-widest shadow-xl shadow-rose-100 hover:bg-[#c81d4a] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"><Check size={20} /> Update Order</button></div>)}
                  </div>
                </div>
              )}
            </div>
          )
        }

        {/* Coupons Tab */}
        {
          adminTab === 'coupons' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Promo Coupons</h2><p className="text-slate-400 text-sm">Create and manage marketing discount codes.</p></div>
                <button onClick={() => setIsAdding('coupon')} className="bg-[#e92c5d] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl"><Plus size={18} /> Add Coupon</button>
              </div>
              {(isAdding === 'coupon' || editingItem?.type === 'coupon') && (
                <form onSubmit={handleCouponSubmit} className="bg-white rounded-2xl border border-rose-100 p-8 shadow-xl space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Coupon Code</label><input required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Discount Type</label><select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as any })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold"><option value="Fixed">Fixed Amount</option><option value="Percentage">Percentage %</option></select></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Value</label><input required type="number" value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Min Spend</label><input required type="number" value={couponForm.minimumSpend} onChange={e => setCouponForm({ ...couponForm, minimumSpend: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Expiry Date</label><input required type="date" value={couponForm.expiryDate} onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2 flex items-center pt-6 ml-4"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={couponForm.autoApply} onChange={e => setCouponForm({ ...couponForm, autoApply: e.target.checked })} className="w-5 h-5 accent-rose-500" /><span className="text-xs font-black text-gray-500 uppercase">Auto-Apply</span></label></div>
                  </div>
                  <div className="flex justify-end gap-3"><button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px]">Cancel</button><button type="submit" className="bg-rose-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px]">Save Coupon</button></div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map(cp => (
                  <div key={cp.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="relative space-y-4">
                      <div className="flex justify-between items-center"><span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest">{cp.code}</span><div className="flex gap-2"><button onClick={() => { setEditingItem({ type: 'coupon', data: cp }); setCouponForm(cp); }} className="text-gray-300 hover:text-blue-500"><Pencil size={16} /></button><button onClick={() => deleteCoupon(cp.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></div></div>
                      <div className="space-y-1"><p className="font-black text-2xl text-gray-800">{cp.discountType === 'Fixed' ? `৳${cp.discountValue}` : `${cp.discountValue}%`} OFF</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Spend: ৳{cp.minimumSpend}</p></div>
                      <div className="pt-4 border-t flex items-center gap-2 text-xs font-bold text-gray-400"><RefreshCw size={14} /> Expires: {new Date(cp.expiryDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Reviews Tab */}
        {
          adminTab === 'reviews' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Customer Reviews</h2><p className="text-slate-400 text-sm">Moderate and respond to customer feedback.</p></div>
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 space-y-6 group">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4"><div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">{review.authorName.charAt(0)}</div><div><h4 className="font-black text-gray-800">{review.authorName}</h4><span className="text-[10px] font-black text-gray-400 uppercase">{review.productName} • {new Date(review.createdAt).toLocaleDateString()}</span></div></div>
                      <div className="flex items-center gap-4"><div className="flex text-yellow-400 gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} className={i <= review.rating ? "" : "text-gray-200"} />)}</div><button onClick={() => deleteReview(review.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button></div>
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed italic">"{review.comment}"</p>
                    {review.reply ? (
                      <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100"><span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-2">Merchant Response</span><p className="text-gray-800 text-sm font-bold">"{review.reply}"</p><button onClick={() => setReplyingTo(review.id)} className="text-[10px] font-black text-rose-500 uppercase mt-4 hover:underline">Edit Response</button></div>
                    ) : (
                      <button onClick={() => setReplyingTo(review.id)} className="bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all">Reply to Review</button>
                    )}
                  </div>
                ))}
              </div>
              {replyingTo && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
                  <form onSubmit={handleReplySubmit} className="bg-white rounded-[2rem] w-full max-w-lg p-10 shadow-2xl space-y-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center"><h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">Merchant Reply</h3><button type="button" onClick={() => setReplyingTo(null)} className="text-gray-300 hover:text-red-500"><X size={24} /></button></div>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} required placeholder="Write your response here..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 h-48 text-sm font-medium outline-none focus:border-rose-500 transition-all" />
                    <div className="flex gap-4"><button type="button" onClick={() => setReplyingTo(null)} className="flex-1 bg-gray-50 text-gray-400 font-black py-4 rounded-xl text-xs uppercase">Cancel</button><button type="submit" className="flex-1 bg-rose-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg">Submit Reply</button></div>
                  </form>
                </div>
              )}
            </div>
          )
        }

        {/* Users Tab */}
        {
          adminTab === 'users' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Registered Users</h2><p className="text-slate-400 text-sm">Manage user accounts and permission roles.</p></div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">User</th><th className="px-6 py-6">Role</th><th className="px-6 py-6">Registered On</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 flex items-center gap-4"><div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 font-black text-lg">{u.email.charAt(0).toUpperCase()}</div><div className="flex flex-col"><span className="font-bold text-gray-800">{u.full_name || 'Anonymous User'}</span><span className="text-xs text-gray-400">{u.email}</span></div></td>
                        <td className="px-6 py-5"><span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{u.role}</span></td>
                        <td className="px-6 py-5 text-gray-400 font-bold text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-right"><button onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'customer' : 'admin')} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">{u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {/* System Settings Tab */}
        {
          adminTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h2><p className="text-slate-400 text-sm">Configure store-wide parameters and shipping fees.</p></div>
              
              {/* Delivery Fees Configuration */}
              <div className="bg-white rounded-[2rem] border border-gray-100 p-10 space-y-10 shadow-sm">
                <div className="space-y-8">
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-3"><Truck className="text-rose-500" /> Delivery Fees Configuration</h3>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inside Dhaka (৳)</label><input type="number" value={shipForm.insideDhaka} onChange={e => setShipForm({ ...shipForm, insideDhaka: parseFloat(e.target.value) })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:bg-white focus:border-rose-500 transition-all" /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Outside Dhaka (৳)</label><input type="number" value={shipForm.outsideDhaka} onChange={e => setShipForm({ ...shipForm, outsideDhaka: parseFloat(e.target.value) })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:bg-white focus:border-rose-500 transition-all" /></div>
                  </div>
                </div>
                <div className="pt-6 border-t flex justify-end"><button onClick={() => updateShippingSettings(shipForm)} className="bg-rose-600 text-white font-black px-12 py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-rose-50 hover:bg-rose-700 transition-all">Save Changes</button></div>
              </div>

              {/* Store Identity */}
              <div className="bg-white rounded-[2rem] border border-gray-100 p-10 space-y-10 shadow-sm">
                <div className="space-y-8">
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-3"><Globe className="text-blue-500" /> Store Identity</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Name</label><input value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Logo</label>
                      <div className="flex items-center gap-4">
                        {storeForm.logo_url && <img src={storeForm.logo_url} alt="Logo" className="w-12 h-12 object-contain bg-gray-50 rounded-lg p-1 border border-gray-100" />}
                        <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-blue-500 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all flex items-center gap-2">
                          <ImageIcon size={16} /> Upload Logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label><input value={storeForm.address} onChange={e => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label><input value={storeForm.phone} onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label><input value={storeForm.email} onChange={e => setStoreForm({ ...storeForm, email: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                  </div>

                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-6">Social Media</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook URL</label><input value={storeForm.socials?.facebook || ''} onChange={e => setStoreForm({ ...storeForm, socials: { ...storeForm.socials, facebook: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="https://facebook.com/..." /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram URL</label><input value={storeForm.socials?.instagram || ''} onChange={e => setStoreForm({ ...storeForm, socials: { ...storeForm.socials, instagram: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="https://instagram.com/..." /></div>
                  </div>

                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-6">Floating Contact Widget</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={storeForm.floatingWidget?.isVisible ?? true} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), isVisible: e.target.checked } })} className="w-5 h-5 accent-rose-500" />
                        <span className="text-sm font-bold text-gray-700">Enable Widget</span>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Agent Image</label>
                      <div className="flex items-center gap-4">
                        {storeForm.floatingWidget?.supportImage && <img src={storeForm.floatingWidget.supportImage} className="w-12 h-12 object-cover rounded-full border border-gray-100" />}
                        <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-rose-500 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all flex items-center gap-2">
                          <ImageIcon size={16} /> Upload Image
                          <input type="file" accept="image/*" onChange={handleSupportImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Number</label><input value={storeForm.floatingWidget?.whatsapp || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), whatsapp: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-rose-500 transition-all" placeholder="e.g. 88017..." /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Messenger Username/ID</label><input value={storeForm.floatingWidget?.messenger || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), messenger: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-rose-500 transition-all" placeholder="e.g. username" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook Link</label><input value={storeForm.floatingWidget?.facebook || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), facebook: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-rose-500 transition-all" placeholder="https://facebook.com/..." /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram Link</label><input value={storeForm.floatingWidget?.instagram || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), instagram: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-rose-500 transition-all" placeholder="https://instagram.com/..." /></div>
                    </div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Phone</label><input value={storeForm.floatingWidget?.phone || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), phone: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-rose-500 transition-all" placeholder="e.g. +8801..." /></div>
                  </div>

                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-6">Footer Settings</h4>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Footer Description</label>
                      <textarea value={storeForm.footer_description || ''} onChange={e => setStoreForm({ ...storeForm, footer_description: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all min-h-[100px]" placeholder="Brief description about your store..." />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">iOS App Link</label><input value={storeForm.app_links?.ios || ''} onChange={e => setStoreForm({ ...storeForm, app_links: { ...storeForm.app_links, ios: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="App Store URL" /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Android App Link</label><input value={storeForm.app_links?.android || ''} onChange={e => setStoreForm({ ...storeForm, app_links: { ...storeForm.app_links, android: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="Play Store URL" /></div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Quick Links</label>
                      {storeForm.footer_links?.map((link, idx) => (
                        <div key={idx} className="flex gap-4">
                          <input value={link.label} onChange={e => {
                            const newLinks = [...(storeForm.footer_links || [])];
                            newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                            setStoreForm({ ...storeForm, footer_links: newLinks });
                          }} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="Label" />
                          <input value={link.url} onChange={e => {
                            const newLinks = [...(storeForm.footer_links || [])];
                            newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                            setStoreForm({ ...storeForm, footer_links: newLinks });
                          }} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="URL" />
                          <button onClick={() => setStoreForm({ ...storeForm, footer_links: storeForm.footer_links?.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-500 bg-red-50 p-3 rounded-xl"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setStoreForm({ ...storeForm, footer_links: [...(storeForm.footer_links || []), { label: '', url: '' }] })} className="w-full py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-white hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Add Link</button>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t flex justify-end"><button onClick={() => updateStoreInfo(storeForm)} className="bg-blue-600 text-white font-black px-12 py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-blue-50 hover:bg-blue-700 transition-all">Update Identity</button></div>
              </div>

              {/* Technical Warning */}
              <div className="bg-amber-50 rounded-[2rem] border border-amber-100 p-10 flex items-start gap-6"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0"><AlertTriangle /></div><div><h4 className="font-black text-amber-800 uppercase text-sm tracking-widest mb-2">Technical Warning</h4><p className="text-sm text-amber-700/80 leading-relaxed font-medium">Changing shipping settings affects all active checkouts instantly.</p></div></div>
            </div>
          )
        }
      </main >
      
    </div >
  );
};

export default Admin;