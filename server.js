import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentHandler from './api/payment.js';
import paymentSuccessHandler from './api/payment-success.js';
import paymentFailHandler from './api/payment-fail.js';
import paymentCancelHandler from './api/payment-cancel.js';
import paymentIpnHandler from './api/payment-ipn.js';
import imagekitAuthHandler from './api/imagekit-auth.js';
import sendInvoiceHandler from './api/send-invoice.js';
import sitemapHandler from './api/sitemap.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Wrapper to handle Vercel-style handlers in Express
const vercelWrapper = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

app.post('/api/payment', vercelWrapper(paymentHandler));
app.post('/api/payment-success', vercelWrapper(paymentSuccessHandler));
app.get('/api/payment-success', vercelWrapper(paymentSuccessHandler));
app.post('/api/payment-fail', vercelWrapper(paymentFailHandler));
app.get('/api/payment-fail', vercelWrapper(paymentFailHandler));
app.post('/api/payment-cancel', vercelWrapper(paymentCancelHandler));
app.get('/api/payment-cancel', vercelWrapper(paymentCancelHandler));
app.post('/api/payment-ipn', vercelWrapper(paymentIpnHandler));

app.get('/api/imagekit-auth', vercelWrapper(imagekitAuthHandler));
app.post('/api/send-invoice', vercelWrapper(sendInvoiceHandler));
app.get('/api/sitemap', vercelWrapper(sitemapHandler));

app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
});

