
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string[];
  images: string[];
  badge?: string;
  unit?: string;
  shortDescription?: string;
  description: string; // Used as long description
  sku?: string;
  slug?: string;
  brand?: string;
  isFeatured?: boolean;
  stock?: number;
  variants?: Variant[];
  filterAttributes?: { name: string; options: string[] }[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface Variant {
  id: string;
  attributeValues: { [attributeName: string]: string };
  price: number; // Current selling price
  originalPrice?: number; // Strikethrough price
  sku: string;
  stock: number;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  slug?: string;
  parentId?: string | null;
  itemCount: number;
}

export interface AttributeValue {
  id: string;
  value: string;
}

export interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'Fixed' | 'Percentage';
  discountValue: number;
  minimumSpend: number;
  expiryDate: string;
  status: 'Active' | 'Inactive';
  autoApply: boolean;
  createdAt: string;
  isAutoApplied?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariantId?: string;
  selectedVariantName?: string;
  selectedVariantImage?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerDistrict?: string;
  customerArea?: string;
  date: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  items: CartItem[];
  coupon_code?: string;
}

export interface ShippingSettings {
  insideDhaka: number;
  outsideDhaka: number;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  full_name?: string;
  created_at: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  district: string;
  area: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
}

export type ViewMode = 'home' | 'products' | 'admin';
export interface Banner {
  id: string;
  type: 'slider' | 'right_top' | 'right_bottom';
  title?: string;
  subtitle?: string;
  image_url: string;
  link?: string;
  sort_order?: number;
  is_active: boolean;
}

export type AdminTab = 'products' | 'orders' | 'shipping' | 'settings' | 'attributes' | 'categories' | 'brands' | 'coupons' | 'reviews' | 'users' | 'reports' | 'pages' | 'banners' | 'layout' | 'blog';

export interface StoreInfo {
  name: string;
  logo_url?: string;
  address: string;
  phone: string;
  email: string;
  socials: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  footer_description?: string;
  footer_links?: { label: string; url: string }[];
  app_links?: { ios?: string; android?: string };
  floatingWidget?: {
    whatsapp?: string;
    messenger?: string;
    facebook?: string;
    instagram?: string;
    phone?: string;
    supportImage?: string;
    isVisible?: boolean;
  };
}

export interface HomeSection {
  id: string;
  title: string;
  type: 'slider' | 'grid' | 'grid-no-banner' | 'banner-full' | 'banner-double' | 'banner-triple';
  filterType: 'category' | 'sale' | 'featured' | 'all';
  filterValue?: string;
  sortOrder: number;
  isActive: boolean;
  banner?: {
    title: string;
    description: string;
    imageUrl: string;
    buttonText: string;
    link: string;
  };
  banners?: {
    imageUrl: string;
    link?: string;
  }[];
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML content
  author: string;
  date: string;
  imageUrl: string;
  slug: string;
  tags: string[];
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  createdAt: string;
}

