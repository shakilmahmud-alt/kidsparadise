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
    .toLowerCase()
    .trim();
}

/**
 * Generates a clean URL slug from any category name
 */
export function slugify(text: string): string {
  return cleanCategoryString(text)
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Known aliases across WooCommerce, database imports, and URL routing
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
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
