export default async function handler(req, res) {
    console.log('IPN received:', req.body);
    return res.status(200).json({ received: true });
}
