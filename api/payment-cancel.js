export default async function handler(req, res) {
    let frontendUrl = process.env.VITE_APP_URL;
    if (!frontendUrl) {
        if (req.headers['host'] && req.headers['host'].includes('localhost')) {
            frontendUrl = 'http://localhost:5173';
        } else if (req.headers['host']) {
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            frontendUrl = `${protocol}://${req.headers['host']}`;
        } else {
            frontendUrl = 'http://localhost:5173';
        }
    }

    console.log('Payment cancelled callback received');
    return res.redirect(303, `${frontendUrl}/checkout?payment_error=Payment%20was%20cancelled.`);
}
