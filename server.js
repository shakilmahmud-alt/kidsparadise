import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authHandler from './api/auth.js';
import storeHandler from './api/store.js';
import paymentHandler from './api/payment.js';
import paymentSuccessHandler from './api/payment-success.js';
import paymentFailHandler from './api/payment-fail.js';
import paymentCancelHandler from './api/payment-cancel.js';
import paymentIpnHandler from './api/payment-ipn.js';
import imagekitAuthHandler from './api/imagekit-auth.js';
import sendInvoiceHandler from './api/send-invoice.js';
import sitemapHandler from './api/sitemap.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Wrapper to handle Vercel-style handlers in Express
const vercelWrapper = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

// 1. Auth routes
app.all('/api/auth', vercelWrapper(authHandler));
app.all('/api/auth/:action', vercelWrapper(authHandler));

// 2. Store routes
app.all('/api/store-data', vercelWrapper(storeHandler));
app.all('/api/products', vercelWrapper(storeHandler));
app.all('/api/products/:id', vercelWrapper(storeHandler));
app.all('/api/categories', vercelWrapper(storeHandler));
app.all('/api/categories/:id', vercelWrapper(storeHandler));
app.all('/api/brands', vercelWrapper(storeHandler));
app.all('/api/brands/:id', vercelWrapper(storeHandler));
app.all('/api/orders', vercelWrapper(storeHandler));
app.all('/api/orders/:id', vercelWrapper(storeHandler));
app.all('/api/coupons', vercelWrapper(storeHandler));
app.all('/api/coupons/:id', vercelWrapper(storeHandler));
app.all('/api/settings', vercelWrapper(storeHandler));
app.all('/api/reviews', vercelWrapper(storeHandler));
app.all('/api/reviews/:id', vercelWrapper(storeHandler));
app.all('/api/addresses', vercelWrapper(storeHandler));
app.all('/api/addresses/:id', vercelWrapper(storeHandler));
app.all('/api/wishlist', vercelWrapper(storeHandler));
app.all('/api/wishlist/:id', vercelWrapper(storeHandler));
app.all('/api/pages', vercelWrapper(storeHandler));
app.all('/api/pages/:id', vercelWrapper(storeHandler));

// 3. Payment routes
app.post('/api/payment', vercelWrapper(paymentHandler));
app.post('/api/payment-success', vercelWrapper(paymentSuccessHandler));
app.get('/api/payment-success', vercelWrapper(paymentSuccessHandler));
app.post('/api/payment-fail', vercelWrapper(paymentFailHandler));
app.get('/api/payment-fail', vercelWrapper(paymentFailHandler));
app.post('/api/payment-cancel', vercelWrapper(paymentCancelHandler));
app.get('/api/payment-cancel', vercelWrapper(paymentCancelHandler));
app.post('/api/payment-ipn', vercelWrapper(paymentIpnHandler));

// 4. Utility routes
app.get('/api/imagekit-auth', vercelWrapper(imagekitAuthHandler));
app.post('/api/send-invoice', vercelWrapper(sendInvoiceHandler));
app.get('/api/sitemap', vercelWrapper(sitemapHandler));

// 5. Serve Frontend static assets
app.use(express.static(path.join(__dirname, 'dist')));

// 6. SPA fallback for client-side routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`KidsParadise Server running on port ${PORT}`);
});



