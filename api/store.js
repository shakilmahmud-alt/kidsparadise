import { query } from '../lib/db.js';
import { verifyToken } from './auth.js';

// Safe JSON parser helper
function safeJson(val, defaultVal = null) {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return defaultVal;
  }
}

export default async function handler(req, res) {
  const user = verifyToken(req);
  const path = req.path || (req.url ? req.url.split('?')[0] : '') || '';
  const method = req.method;

  try {
    // 1. Unified Store Initial Data: GET /api/store-data
    if (method === 'GET' && (path === '/api/store-data' || path.endsWith('/store-data'))) {
      const [
        products,
        categories,
        brands,
        coupons,
        reviews,
        settingsRows,
        attributes,
        pages
      ] = await Promise.all([
        query('SELECT * FROM products ORDER BY created_at DESC'),
        query('SELECT * FROM categories ORDER BY name ASC'),
        query('SELECT * FROM brands ORDER BY name ASC'),
        query('SELECT * FROM coupons ORDER BY created_at DESC'),
        query('SELECT * FROM reviews ORDER BY created_at DESC'),
        query('SELECT * FROM settings'),
        query('SELECT * FROM attributes ORDER BY name ASC'),
        query('SELECT * FROM pages ORDER BY created_at DESC')
      ]);

      const formattedProducts = products.map(p => ({
        id: String(p.id),
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        category: p.category ? p.category.split(',').map(c => c.trim()) : [],
        brand: p.brand || undefined,
        unit: p.unit || undefined,
        sku: p.sku || undefined,
        images: safeJson(p.images, p.image_url ? [p.image_url] : []),
        shortDescription: p.short_description || undefined,
        description: p.description || '',
        badge: p.badge || undefined,
        isFeatured: Boolean(p.is_featured),
        variants: safeJson(p.variants, []),
        filterAttributes: safeJson(p.filter_attributes, [])
      }));

      const formattedCategories = categories.map(c => ({
        id: String(c.id),
        name: c.name,
        slug: c.slug,
        image: c.image_url || '',
        parentId: c.parent_id ? String(c.parent_id) : null,
        itemCount: Number(c.item_count || 0)
      }));

      const formattedBrands = brands.map(b => ({
        id: String(b.id),
        name: b.name,
        slug: b.slug,
        logo_url: b.logo_url
      }));

      const formattedCoupons = coupons.map(c => ({
        id: String(c.id),
        code: c.code,
        discountType: c.discount_type,
        discountValue: Number(c.discount_value),
        minimumSpend: Number(c.minimum_spend),
        expiryDate: c.expiry_date,
        status: c.status,
        autoApply: Boolean(c.auto_apply),
        createdAt: c.created_at
      }));

      const formattedReviews = reviews.map(r => ({
        id: String(r.id),
        productId: String(r.product_id),
        productName: r.product_name || '',
        authorName: r.author_name,
        rating: Number(r.rating),
        comment: r.comment || '',
        reply: r.reply || undefined,
        createdAt: r.created_at
      }));

      const settingsMap = {};
      settingsRows.forEach(row => {
        settingsMap[row.key_name] = safeJson(row.value_data, row.value_data);
      });

      const formattedAttributes = attributes.map(a => ({
        id: String(a.id),
        name: a.name,
        values: safeJson(a.values_list, [])
      }));

      const formattedPages = pages.map(pg => ({
        id: String(pg.id),
        title: pg.title,
        slug: pg.slug,
        content: safeJson(pg.content, []),
        status: pg.status
      }));

      return res.status(200).json({
        products: formattedProducts,
        categories: formattedCategories,
        brands: formattedBrands,
        coupons: formattedCoupons,
        reviews: formattedReviews,
        settings: settingsMap,
        attributes: formattedAttributes,
        pages: formattedPages
      });
    }

    // 2. Orders API
    if (path.startsWith('/api/orders') || path.includes('/orders')) {
      if (method === 'GET') {
        let ordersSql = 'SELECT * FROM orders ORDER BY created_at DESC';
        let params = [];
        if (user && user.role !== 'admin') {
          ordersSql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
          params = [user.id];
        }
        const rows = await query(ordersSql, params);
        const mapped = rows.map(o => ({
          id: String(o.id),
          customerName: o.customer_name,
          customerEmail: o.customer_email || '',
          customerPhone: o.customer_phone || '',
          customerAddress: o.customer_address || '',
          customerDistrict: o.customer_district || '',
          customerArea: o.customer_area || '',
          date: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
          total: Number(o.total || 0),
          subtotal: Number(o.subtotal || 0),
          shippingCost: Number(o.shipping_cost || 0),
          discount: Number(o.discount || 0),
          status: o.status || 'Pending',
          items: safeJson(o.items, []),
          coupon_code: o.coupon_code || undefined,
          paymentMethod: o.payment_method || 'Cash on Delivery',
          paymentStatus: o.payment_status || 'Unpaid'
        }));
        return res.status(200).json({ orders: mapped });
      }

      if (method === 'POST') {
        const {
          customerName, customerEmail, customerPhone,
          customerAddress, customerDistrict, customerArea,
          subtotal, shippingCost, discount, total,
          items, couponCode, paymentMethod
        } = req.body;

        const result = await query(
          `INSERT INTO orders (
            customer_name, customer_email, customer_phone,
            customer_address, customer_district, customer_area,
            subtotal, shipping_cost, discount, total,
            status, items, coupon_code, user_id, payment_method, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, 'Unpaid')`,
          [
            customerName, customerEmail, customerPhone,
            customerAddress, customerDistrict, customerArea,
            subtotal || 0, shippingCost || 0, discount || 0, total || 0,
            JSON.stringify(items || []), couponCode || null,
            user?.id || null, paymentMethod || 'Cash on Delivery'
          ]
        );

        const newOrder = {
          id: String(result.insertId),
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          customerDistrict,
          customerArea,
          subtotal: Number(subtotal || 0),
          shippingCost: Number(shippingCost || 0),
          discount: Number(discount || 0),
          total: Number(total || 0),
          status: 'Pending',
          items: items || [],
          coupon_code: couponCode,
          date: new Date().toISOString(),
          paymentMethod: paymentMethod || 'Cash on Delivery'
        };

        return res.status(201).json({ order: newOrder });
      }

      if (method === 'PUT') {
        const id = req.params?.id || path.split('/').pop();
        const { status, payment_status } = req.body;
        if (status) {
          await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        }
        if (payment_status) {
          await query('UPDATE orders SET payment_status = ? WHERE id = ?', [payment_status, id]);
        }
        return res.status(200).json({ success: true });
      }

      if (method === 'DELETE') {
        const id = req.params?.id || path.split('/').pop();
        await query('DELETE FROM orders WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
      }
    }

    // 3. Products CRUD
    if (path.startsWith('/api/products') || path.includes('/products')) {
      if (method === 'POST') {
        const p = req.body;
        const result = await query(
          `INSERT INTO products (
            name, slug, price, original_price, category, brand, unit, sku,
            images, image_url, short_description, description, badge,
            is_featured, variants, filter_attributes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.name, p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
            p.price || 0, p.originalPrice || null,
            Array.isArray(p.category) ? p.category.join(', ') : (p.category || ''),
            p.brand || null, p.unit || null, p.sku || null,
            JSON.stringify(p.images || []), p.images?.[0] || null,
            p.shortDescription || null, p.description || '',
            p.badge || null, p.isFeatured ? 1 : 0,
            JSON.stringify(p.variants || []), JSON.stringify(p.filterAttributes || [])
          ]
        );
        return res.status(201).json({ id: result.insertId });
      }

      if (method === 'PUT') {
        const id = req.params?.id || path.split('/').pop();
        const p = req.body;
        await query(
          `UPDATE products SET
            name = ?, slug = ?, price = ?, original_price = ?, category = ?,
            brand = ?, unit = ?, sku = ?, images = ?, image_url = ?,
            short_description = ?, description = ?, badge = ?,
            is_featured = ?, variants = ?, filter_attributes = ?
          WHERE id = ?`,
          [
            p.name, p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
            p.price || 0, p.originalPrice || null,
            Array.isArray(p.category) ? p.category.join(', ') : (p.category || ''),
            p.brand || null, p.unit || null, p.sku || null,
            JSON.stringify(p.images || []), p.images?.[0] || null,
            p.shortDescription || null, p.description || '',
            p.badge || null, p.isFeatured ? 1 : 0,
            JSON.stringify(p.variants || []), JSON.stringify(p.filterAttributes || []),
            id
          ]
        );
        return res.status(200).json({ success: true });
      }

      if (method === 'DELETE') {
        const id = req.params?.id || path.split('/').pop();
        await query('DELETE FROM products WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
      }
    }

    // 4. Categories CRUD
    if (path.startsWith('/api/categories') || path.includes('/categories')) {
      if (method === 'POST') {
        const { name, slug, image, parentId } = req.body;
        const result = await query(
          'INSERT INTO categories (name, slug, image_url, parent_id) VALUES (?, ?, ?, ?)',
          [name, slug || name.toLowerCase().replace(/\s+/g, '-'), image || null, parentId || null]
        );
        return res.status(201).json({ id: result.insertId });
      }

      if (method === 'PUT') {
        const id = req.params?.id || path.split('/').pop();
        const { name, slug, image, parentId } = req.body;
        await query(
          'UPDATE categories SET name = ?, slug = ?, image_url = ?, parent_id = ? WHERE id = ?',
          [name, slug, image || null, parentId || null, id]
        );
        return res.status(200).json({ success: true });
      }

      if (method === 'DELETE') {
        const id = req.params?.id || path.split('/').pop();
        await query('DELETE FROM categories WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
      }
    }

    // 5. Brands CRUD
    if (path.startsWith('/api/brands') || path.includes('/brands')) {
      if (method === 'POST') {
        const { name, slug, logo_url } = req.body;
        const result = await query(
          'INSERT INTO brands (name, slug, logo_url) VALUES (?, ?, ?)',
          [name, slug || name.toLowerCase().replace(/\s+/g, '-'), logo_url || null]
        );
        return res.status(201).json({ id: result.insertId });
      }

      if (method === 'DELETE') {
        const id = req.params?.id || path.split('/').pop();
        await query('DELETE FROM brands WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
      }
    }

    // 6. Coupons CRUD
    if (path.startsWith('/api/coupons') || path.includes('/coupons')) {
      if (method === 'POST') {
        const c = req.body;
        const result = await query(
          `INSERT INTO coupons (code, discount_type, discount_value, minimum_spend, expiry_date, status, auto_apply)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.code, c.discountType, c.discountValue, c.minimumSpend || 0, c.expiryDate || null, c.status || 'Active', c.autoApply ? 1 : 0]
        );
        return res.status(201).json({ id: result.insertId });
      }

      if (method === 'PUT') {
        const id = req.params?.id || path.split('/').pop();
        const c = req.body;
        await query(
          `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, minimum_spend = ?, expiry_date = ?, status = ?, auto_apply = ? WHERE id = ?`,
          [c.code, c.discountType, c.discountValue, c.minimumSpend || 0, c.expiryDate || null, c.status || 'Active', c.autoApply ? 1 : 0, id]
        );
        return res.status(200).json({ success: true });
      }

      if (method === 'DELETE') {
        const id = req.params?.id || path.split('/').pop();
        await query('DELETE FROM coupons WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
      }
    }

    // 7. Settings (Upsert key-value)
    if (path.startsWith('/api/settings') || path.includes('/settings')) {
      if (method === 'POST') {
        const { key, value } = req.body;
        await query(
          'INSERT INTO settings (key_name, value_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_data = VALUES(value_data)',
          [key, JSON.stringify(value)]
        );
        return res.status(200).json({ success: true });
      }
    }

    // 8. Reviews
    if (path.startsWith('/api/reviews') || path.includes('/reviews')) {
      if (method === 'POST') {
        const { productId, productName, authorName, rating, comment } = req.body;
        const result = await query(
          'INSERT INTO reviews (product_id, product_name, author_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
          [productId, productName || '', authorName, rating || 5, comment || '']
        );
        return res.status(201).json({ id: result.insertId });
      }
      if (method === 'PUT') {
        const id = req.params?.id || path.split('/').pop();
        const { reply } = req.body;
        await query('UPDATE reviews SET reply = ? WHERE id = ?', [reply, id]);
        return res.status(200).json({ success: true });
      }
    }

    // 9. Addresses
    if (path.startsWith('/api/addresses') || path.includes('/addresses')) {
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      if (method === 'GET') {
        const addresses = await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [user.id]);
        return res.status(200).json({
          addresses: addresses.map(a => ({
            id: String(a.id),
            userId: String(a.user_id),
            fullName: a.full_name,
            phone: a.phone,
            addressLine: a.address_line,
            district: a.district,
            area: a.area,
            isDefault: Boolean(a.is_default)
          }))
        });
      }

      if (method === 'POST') {
        const { fullName, phone, addressLine, district, area, isDefault } = req.body;
        if (isDefault) {
          await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [user.id]);
        }
        const result = await query(
          'INSERT INTO addresses (user_id, full_name, phone, address_line, district, area, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user.id, fullName, phone, addressLine, district, area, isDefault ? 1 : 0]
        );
        return res.status(201).json({ id: result.insertId });
      }

      if (method === 'DELETE') {
        const id = req.params?.id || path.split('/').pop();
        await query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, user.id]);
        return res.status(200).json({ success: true });
      }
    }

    // 10. Wishlist
    if (path.startsWith('/api/wishlist') || path.includes('/wishlist')) {
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      if (method === 'GET') {
        const rows = await query('SELECT product_id FROM wishlist WHERE user_id = ?', [user.id]);
        return res.status(200).json({ productIds: rows.map(r => String(r.product_id)) });
      }

      if (method === 'POST') {
        const { productId } = req.body;
        await query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [user.id, productId]);
        return res.status(200).json({ success: true });
      }

      if (method === 'DELETE') {
        const productId = req.params?.id || path.split('/').pop();
        await query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [user.id, productId]);
        return res.status(200).json({ success: true });
      }
    }

    // 11. Pages CRUD
    if (path.startsWith('/api/pages') || path.includes('/pages')) {
      if (method === 'POST') {
        const { title, slug, content, status } = req.body;
        const result = await query(
          'INSERT INTO pages (title, slug, content, status) VALUES (?, ?, ?, ?)',
          [title, slug || title.toLowerCase().replace(/\s+/g, '-'), JSON.stringify(content || []), status || 'Published']
        );
        return res.status(201).json({ id: result.insertId });
      }

      if (method === 'PUT') {
        const id = req.params?.id || path.split('/').pop();
        const { title, slug, content, status } = req.body;
        await query(
          'UPDATE pages SET title = ?, slug = ?, content = ?, status = ? WHERE id = ?',
          [title, slug, JSON.stringify(content || []), status || 'Published', id]
        );
        return res.status(200).json({ success: true });
      }

      if (method === 'DELETE') {
        const id = req.params?.id || path.split('/').pop();
        await query('DELETE FROM pages WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
      }
    }

    return res.status(404).json({ error: 'Store endpoint not found' });
  } catch (error) {
    console.warn('Store API Handler Notice (DB Connection):', error.message);
    if (method === 'GET' && (path === '/api/store-data' || path.endsWith('/store-data'))) {
      return res.status(200).json({
        products: [],
        categories: [],
        brands: [],
        coupons: [],
        reviews: [],
        settings: {
          shipping_fees: { insideDhaka: 60, outsideDhaka: 120 },
          store_info: { name: 'KidsParadise', address: 'Dhaka, Bangladesh', phone: '+880 1711 111111', email: 'support@kidsparadise.com.bd' }
        },
        attributes: [],
        pages: [],
        db_status: 'offline',
        db_message: 'Connect cPanel MySQL in .env to load live products'
      });
    }
    return res.status(500).json({ error: error.message });
  }
}
