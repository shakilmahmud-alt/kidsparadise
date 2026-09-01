/**
 * Serverless /api/upload proxy for Vercel
 * Forwards any upload or chunked upload payload to cPanel https://kidsparadise.com.bd/api.php server-to-server
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};

    const cpanelRes = await fetch('https://kidsparadise.com.bd/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
      },
      body: JSON.stringify(payload)
    });

    const data = await cpanelRes.json();
    return res.status(cpanelRes.status).json(data);
  } catch (error) {
    console.error('Server Upload Proxy Error:', error);
    return res.status(500).json({ error: error.message || 'Upload proxy failed' });
  }
}
