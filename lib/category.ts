import { Category, Product } from '../types';

/**
 * Normalizes any category string or slug:
 * Decodes URI encoding, converts HTML entities (&amp; -> &), lowercases, and trims.
 */
export function cleanCategoryString(str: string): string {
  if (!str) return '';
  try {
    str = decodeURIComponent(str);
  } catch (e) {}
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Generates a clean URL slug from any category or product name.
 * Converts special characters (&, /, +, commas, etc.) into clean hyphens.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return cleanCategoryString(text)
    .replace(/&/g, '') // remove & or replace with and
    .replace(/[\/\\]+/g, '-') // slashes to hyphen
    .replace(/[^a-z0-9\s-_]/g, '') // remove remaining special chars
    .trim()
    .replace(/[\s_]+/g, '-') // spaces and underscores to hyphen
    .replace(/-+/g, '-') // remove duplicate hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens from ends
}

/**
 * Known aliases across WooCommerce, database imports, and URL routing
 */
export const CATEGORY_ALIASES: Record<string, string[]> = {
  'gear-travel': ['gear & travel', 'gear and travel', 'gear-travel'],
  'gear & travel': ['gear-travel', 'gear & travel', 'gear and travel'],
  'baby-care-hygiene': ['care & hygiene', 'baby care & hygiene', 'care-hygiene', 'baby-care-hygiene'],
  'care-hygiene': ['care & hygiene', 'baby care & hygiene', 'care-hygiene', 'baby-care-hygiene'],
  'care & hygiene': ['care & hygiene', 'baby care & hygiene', 'care-hygiene', 'baby-care-hygiene'],
  'baby care & hygiene': ['care & hygiene', 'baby care & hygiene', 'care-hygiene', 'baby-care-hygiene'],
  'baby-stationery': ['stationery', 'baby stationery', 'baby-stationery'],
  'stationery': ['stationery', 'baby stationery', 'baby-stationery'],
  'furniture-bedding': ['furniture & bedding', 'furniture and bedding', 'furniture-bedding'],
  'furniture & bedding': ['furniture & bedding', 'furniture and bedding', 'furniture-bedding'],
  'toys': ['toys', 'toys & games', 'toy'],
  'apparels': ['apparels', 'apparel', "boy's fashion", "girl's fashion", "baby's fashion"],
  'car-seats': ['car seats', 'baby car seat', 'car seat', 'car-seats'],
  'stroller': ['stroller', 'strollers', 'baby stroller'],
  'baby-walker': ['baby walker', 'walker', 'walkers', 'baby-walker'],
  'baby-cots': ['baby cots', 'baby cot', 'cot', 'cots', 'crib', 'baby-cots'],
  'high-chair': ['high chair', 'high chairs', 'wooden baby high chair', 'high-chair'],
  'diapers-wipes-potty': ['diapers, wipes & potty', 'diapers', 'potty', 'wipes', 'diapers-wipes-potty'],
  'bathing-essentials': ['bathing essentials', 'bath tubs', 'bath tub', 'bathing-essentials']
};

/**
 * Returns the ordered array of ancestor categories leading up to the given category:
 * [RootParent, SubCategory, SubSubCategory, Category]
 */
export function getCategoryAncestors(category: Partial<Category> | null | undefined, categories: Category[]): Category[] {
  if (!category) return [];
  const fullCategory = categories.find(c => c.id === category.id || (category.slug && (c.slug === category.slug || slugify(c.name) === slugify(category.slug)))) || (category as Category);
  const trail: Category[] = [fullCategory];
  const visited = new Set<string>([String(fullCategory.id)]);
  let current: any = fullCategory;

  while (current) {
    const pId = current.parentId || current.parent_id;
    if (!pId || pId === '0' || pId === 0) break;
    const parent = categories.find(c => String(c.id) === String(pId));
    if (parent && !visited.has(String(parent.id))) {
      trail.unshift(parent);
      visited.add(String(parent.id));
      current = parent;
    } else {
      break;
    }
  }

  return trail;
}

/**
 * Computes the full hierarchical path string for a category (e.g. "furniture-bedding/baby-cots")
 */
export function getCategoryPath(category: Partial<Category> | null | undefined, categories: Category[]): string {
  if (!category) return '';
  // If it's a partial category or matched category
  const fullCategory = categories.find(c => c.id === category.id || (category.slug && (c.slug === category.slug || slugify(c.name) === slugify(category.slug)))) || category as Category;
  const ancestors = getCategoryAncestors(fullCategory, categories);
  return ancestors
    .map(c => slugify(c.slug || c.name))
    .filter(Boolean)
    .join('/');
}

/**
 * Returns the full hierarchical URL for any category (e.g. "/category/furniture-bedding/baby-cots/")
 */
export function getCategoryUrl(category: Partial<Category> | string | null | undefined, categories: Category[] = []): string {
  if (!category) return '/products';

  if (typeof category === 'string') {
    const found = findCategoryBySlugOrName(categories, category);
    if (found) {
      const path = getCategoryPath(found, categories);
      return `/category/${path}/`;
    }
    const clean = slugify(category);
    return clean ? `/category/${clean}/` : '/products';
  }

  // If category object was passed
  const found = categories.find(c => c.id === category.id || (category.slug && (c.slug === category.slug || slugify(c.name) === slugify(category.slug)))) || category;
  const path = getCategoryPath(found as Category, categories);
  return path ? `/category/${path}/` : '/products';
}

/**
 * Finds a category from categories list by full hierarchical path, single slug, name, ID, or alias.
 * Supports:
 * - "furniture-bedding/baby-cots"
 * - "baby-cots"
 * - "Baby Cots"
 */
export function findCategoryByPathOrSlug(categories: Category[], pathOrSlug: string): Category | null {
  if (!pathOrSlug || !categories || categories.length === 0) return null;

  // Clean raw path (remove leading/trailing slashes, lowercase)
  const cleanPath = pathOrSlug.replace(/^\/+|\/+$/g, '').trim();
  const segments = cleanPath.split('/').map(s => slugify(s)).filter(Boolean);

  if (segments.length === 0) return null;

  const leafSlug = segments[segments.length - 1];

  // 1. If multi-segment path, find categories matching the leaf slug and verify parent trail
  if (segments.length > 1) {
    const matchingLeaves = categories.filter(c => {
      const cSlug = slugify(c.slug || c.name);
      return cSlug === leafSlug || cleanCategoryString(c.slug || '') === leafSlug || cleanCategoryString(c.name) === leafSlug;
    });

    if (matchingLeaves.length > 0) {
      for (const candidate of matchingLeaves) {
        const candidatePath = getCategoryPath(candidate, categories);
        const candidateSegments = candidatePath.split('/').map(s => slugify(s));
        
        // Exact path match
        if (candidateSegments.join('/') === segments.join('/')) {
          return candidate;
        }

        // Suffix match (e.g. if path has fewer or extra segments)
        if (candidateSegments[candidateSegments.length - 1] === leafSlug) {
          const parentSegment = segments[segments.length - 2];
          const candidateParentSegment = candidateSegments[candidateSegments.length - 2];
          if (parentSegment === candidateParentSegment) {
            return candidate;
          }
        }
      }

      // If no exact parent match, return the first leaf match
      return matchingLeaves[0];
    }
  }

  // 2. Direct match or alias match via findCategoryBySlugOrName
  return findCategoryBySlugOrName(categories, leafSlug);
}

/**
 * Finds a category from categories list by slug, name, ID, or alias.
 */
export function findCategoryBySlugOrName(categories: Category[], queryStr: string): Category | null {
  if (!queryStr || !categories || categories.length === 0) return null;

  const clean = cleanCategoryString(queryStr);
  const cleanSlug = slugify(clean);

  // 1. Direct match on slug, name, ID, or slugified name
  for (const c of categories) {
    const cSlug = cleanCategoryString(c.slug || '');
    const cName = cleanCategoryString(c.name);
    const cId = String(c.id).trim();

    if (
      cSlug === clean ||
      cSlug === cleanSlug ||
      cName === clean ||
      slugify(cName) === cleanSlug ||
      cId === clean
    ) {
      return c;
    }
  }

  // 2. Match through known aliases
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    const cleanKey = cleanCategoryString(key);
    const cleanKeySlug = slugify(cleanKey);

    if (clean === cleanKey || cleanSlug === cleanKeySlug || aliases.includes(clean) || aliases.some(a => slugify(a) === cleanSlug)) {
      const matched = categories.find(c => {
        const cSlug = cleanCategoryString(c.slug || '');
        const cName = cleanCategoryString(c.name);
        return (
          cSlug === cleanKey ||
          cSlug === cleanKeySlug ||
          cName === cleanKey ||
          slugify(cName) === cleanKeySlug ||
          aliases.includes(cSlug) ||
          aliases.includes(cName) ||
          aliases.some(a => slugify(a) === slugify(cSlug) || slugify(a) === slugify(cName))
        );
      });
      if (matched) return matched;
    }
  }

  // 3. Loose word match (e.g. "car-seats" matches "Car Seats" or "Assemble Toys")
  const words = cleanSlug.split('-').filter(Boolean);
  if (words.length > 0) {
    const looseMatch = categories.find(c => {
      const cWords = slugify(c.name).split('-').filter(Boolean);
      return words.length === cWords.length && words.every(w => cWords.includes(w));
    });
    if (looseMatch) return looseMatch;
  }

  return null;
}

/**
 * Recursively retrieves a category and all its descendants (children, grandchildren, etc.)
 */
export function getCategoryFamily(categories: Category[], category: Category): {
  allCategories: Category[];
  targetNames: Set<string>;
  targetSlugs: Set<string>;
} {
  const allCategories: Category[] = [category];

  const getChildren = (catId: string | number) => {
    const directChildren = categories.filter(c => String(c.parentId) === String(catId));
    for (const child of directChildren) {
      allCategories.push(child);
      getChildren(child.id);
    }
  };

  getChildren(category.id);

  const targetNames = new Set<string>();
  const targetSlugs = new Set<string>();

  for (const c of allCategories) {
    const cleanN = cleanCategoryString(c.name);
    const cleanS = cleanCategoryString(c.slug || '');
    const sSlug = slugify(cleanN);

    if (cleanN) targetNames.add(cleanN);
    if (cleanS) {
      targetNames.add(cleanS);
      targetSlugs.add(cleanS);
    }
    if (sSlug) targetSlugs.add(sSlug);

    // Expand aliases if available
    const aliases = CATEGORY_ALIASES[cleanS] || CATEGORY_ALIASES[cleanN] || CATEGORY_ALIASES[sSlug];
    if (aliases) {
      aliases.forEach(a => {
        targetNames.add(cleanCategoryString(a));
        targetSlugs.add(slugify(a));
      });
    }
  }

  return { allCategories, targetNames, targetSlugs };
}

/**
 * Checks whether a given product belongs to the category or any of its descendants.
 * Includes intelligent keyword fallback for subcategories.
 */
export function isProductInCategory(
  product: Product,
  targetFamily: { targetNames: Set<string>; targetSlugs: Set<string> },
  category?: Category | null
): boolean {
  const prodCats = Array.isArray(product.category)
    ? product.category
    : [product.category].filter(Boolean);

  // 1. Direct Category Match
  for (const cat of prodCats) {
    const cleanC = cleanCategoryString(String(cat));
    const sSlug = slugify(cleanC);

    if (targetFamily.targetNames.has(cleanC) || targetFamily.targetSlugs.has(sSlug)) {
      return true;
    }
  }

  // 2. Smart Keyword Fallback (Especially for specific subcategories like "Car Seats", "Stroller", etc.)
  if (category) {
    const catName = cleanCategoryString(category.name);
    const catSlug = slugify(catName);

    // Check specific high-intent subcategory patterns in title
    if (catSlug === 'car-seats' || catName === 'car seats') {
      return /\b(car seat|car seats|isofix)\b/i.test(product.name);
    }
    if (catSlug === 'stroller' || catName === 'stroller' || catName === 'strollers') {
      return /\b(stroller|strollers|pram)\b/i.test(product.name);
    }
    if (catSlug === 'baby-walker' || catName === 'baby walker') {
      return /\b(walker|walkers|baby walker)\b/i.test(product.name);
    }
    if (catSlug === 'baby-cots' || catName === 'baby cots') {
      return /\b(cot|cots|crib|cribs)\b/i.test(product.name);
    }
    if (catSlug === 'high-chair' || catName === 'high chair') {
      return /\b(high chair|highchair|feeding chair)\b/i.test(product.name);
    }
    if (catSlug === 'baby-bibs' || catName === 'baby bibs') {
      return /\b(bib|bibs)\b/i.test(product.name);
    }
    if (catSlug === 'air-bed' || catName === 'air bed') {
      return /\b(air bed|inflatable bed)\b/i.test(product.name);
    }
    if (catSlug === 'vehicles' || catName === 'vehicles') {
      return /\b(car|jeep|bike|motorcycle|ride on|vehicle|truck|train)\b/i.test(product.name);
    }
    if (catSlug === 'remote-controlled' || catName === 'remote controlled') {
      return /\b(r\/c|remote control|rc car|rc drone)\b/i.test(product.name);
    }
  }

  return false;
}
