import { Product } from '../types';

/**
 * Helper to escape characters for safe regex creation
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Common English plural/singular stemming for search
 */
function getWordVariants(word: string): string[] {
  const w = word.toLowerCase().trim();
  const variants = new Set<string>([w]);

  if (w.endsWith('ies') && w.length > 4) {
    variants.add(w.slice(0, -3) + 'y'); // e.g. "batteries" -> "battery"
  } else if (w.endsWith('es') && w.length > 4) {
    variants.add(w.slice(0, -2)); // e.g. "dresses" -> "dress", "boxes" -> "box"
  } else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    variants.add(w.slice(0, -1)); // e.g. "cars" -> "car", "toys" -> "toy"
  } else {
    // Add simple plural
    variants.add(w + 's');
    if (w.endsWith('sh') || w.endsWith('ch') || w.endsWith('x') || w.endsWith('s')) {
      variants.add(w + 'es');
    }
  }

  return Array.from(variants);
}

export interface SearchScoreResult {
  matches: boolean;
  score: number;
}

/**
 * Computes a smart relevance score for a product given a user search query.
 *
 * Enforces word-boundary sensitivity for short keywords (e.g. "car", "toy", "bed", "oil", "bag")
 * so "car" NEVER matches "Care & Hygiene", "carrier", "carpet", "scarf", or "carry".
 */
export function scoreProductSearch(product: Product, query: string): SearchScoreResult {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    return { matches: true, score: 0 };
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { matches: true, score: 0 };
  }

  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const sku = (product.sku || '').toLowerCase();
  
  // Format categories safely
  const categories: string[] = Array.isArray(product.category)
    ? product.category.map(c => String(c).toLowerCase().replace(/&amp;/g, '&'))
    : String(product.category || '').split(',').map(c => c.trim().toLowerCase().replace(/&amp;/g, '&'));

  let totalScore = 0;
  let allTokensMatched = true;

  for (const token of tokens) {
    let tokenScore = 0;
    const variants = getWordVariants(token);
    const variantsPattern = variants.map(v => escapeRegExp(v)).join('|');
    
    // Strict word boundary regex: matches "car" or "cars" only as a standalone word
    const wordBoundaryRegex = new RegExp(`\\b(?:${variantsPattern})\\b`, 'i');
    // Prefix regex for longer terms (e.g. "stroll" matches "stroller")
    const prefixRegex = new RegExp(`\\b(?:${variantsPattern})`, 'i');

    // 1. Direct SKU match
    if (sku) {
      if (sku === token) {
        tokenScore += 1000;
      } else if (sku.includes(token)) {
        tokenScore += 400;
      }
    }

    // 2. Product Name / Title match
    if (wordBoundaryRegex.test(name)) {
      tokenScore += 200;
      // Bonus if title starts with the token
      if (name.startsWith(token) || variants.some(v => name.startsWith(v))) {
        tokenScore += 80;
      }
    } else if (token.length >= 4 && prefixRegex.test(name)) {
      tokenScore += 100;
    } else if (token.length >= 5 && name.includes(token)) {
      tokenScore += 50;
    }

    // 3. Brand match (word-sensitive)
    if (brand && wordBoundaryRegex.test(brand)) {
      tokenScore += 120;
    }

    // 4. Category match (STRICT word boundary to avoid "car" matching "Care")
    for (const cat of categories) {
      if (wordBoundaryRegex.test(cat)) {
        tokenScore += 90;
        break;
      }
    }

    // 5. Description match (only as a small secondary bonus if whole word matches)
    if (product.description && token.length >= 3) {
      const desc = product.description.toLowerCase();
      if (wordBoundaryRegex.test(desc)) {
        tokenScore += 15;
      }
    }

    if (tokenScore === 0) {
      allTokensMatched = false;
    } else {
      totalScore += tokenScore;
    }
  }

  // Exact full phrase bonus in title
  if (tokens.length > 1 && name.includes(q)) {
    totalScore += 250;
  }

  return {
    matches: allTokensMatched && totalScore >= 50,
    score: totalScore
  };
}

/**
 * Filter and sort products by search relevance score descending.
 */
export function filterAndRankProducts(products: Product[], query: string): Product[] {
  const q = (query || '').trim();
  if (!q) return products;

  const scored: { product: Product; score: number }[] = [];

  for (const product of products) {
    const res = scoreProductSearch(product, q);
    if (res.matches) {
      scored.push({ product, score: res.score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(item => item.product);
}
