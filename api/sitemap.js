import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://upbkfhtbbqxsloihejvz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FVSNVq1PgVxtkrerDHO_Qw_5I_Qo83X';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function sitemapHandler(req, res) {
  try {
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
        }
      });
    };

    const baseUrl = 'https://kidsparadise.com.bd';

    const urls = [
      { loc: `${baseUrl}/`, priority: '1.0' },
      { loc: `${baseUrl}/products`, priority: '0.8' },
      { loc: `${baseUrl}/blog`, priority: '0.8' }
    ];

    const [
      { data: products },
      { data: categories },
      { data: blogs },
      { data: pages }
    ] = await Promise.all([
      supabase.from('products').select('slug, created_at'),
      supabase.from('categories').select('slug'),
      supabase.from('blog_posts').select('slug, created_at'),
      supabase.from('pages').select('slug, created_at')
    ]);

    if (products) {
      products.forEach(p => {
        if (p.slug) {
          urls.push({
            loc: `${baseUrl}/product/${p.slug}`,
            lastmod: p.created_at ? new Date(p.created_at).toISOString() : undefined,
            priority: '0.9'
          });
        }
      });
    }

    if (categories) {
      categories.forEach(c => {
        if (c.slug) {
          urls.push({
            loc: `${baseUrl}/category/${c.slug}`,
            priority: '0.7'
          });
        }
      });
    }

    if (blogs) {
      blogs.forEach(b => {
        if (b.slug) {
          urls.push({
            loc: `${baseUrl}/blog/${b.slug}`,
            lastmod: b.created_at ? new Date(b.created_at).toISOString() : undefined,
            priority: '0.7'
          });
        }
      });
    }

    if (pages) {
      pages.forEach(p => {
        if (p.slug) {
          urls.push({
            loc: `${baseUrl}/${p.slug}`,
            lastmod: p.created_at ? new Date(p.created_at).toISOString() : undefined,
            priority: '0.6'
          });
        }
      });
    }

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    urls.forEach(u => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${escapeXml(encodeURI(u.loc))}</loc>\n`;
      if (u.lastmod) {
        sitemap += `    <lastmod>${u.lastmod}</lastmod>\n`;
      }
      sitemap += `    <priority>${u.priority}</priority>\n`;
      sitemap += `  </url>\n`;
    });
    
    sitemap += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
