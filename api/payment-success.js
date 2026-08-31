export default async function handler(req, res) {
    const tranId = req.body?.tran_id || req.query?.tran_id || req.body?.tranId || req.query?.tranId;
    
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

    console.log('Payment success callback received for transaction:', tranId, 'Redirecting to:', frontendUrl);
    const redirectUrl = tranId ? `${frontendUrl}/order-success/${tranId}` : `${frontendUrl}/`;
    return res.redirect(303, redirectUrl);
}
