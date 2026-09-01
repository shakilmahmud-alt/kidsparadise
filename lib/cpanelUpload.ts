/**
 * Uploads files directly to cPanel hosting (https://kidsparadise.com.bd/uploads/...)
 * Automatically puts videos into /uploads/videos/, products into /uploads/products/,
 * banners into /uploads/banners/, and general media into /uploads/media/
 */

export const uploadToCpanel = async (file: File, folder: string = 'media'): Promise<string> => {
  let targetFolder = folder.replace(/^\/+/, '') || 'media';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'];

  // Auto route videos to 'videos' folder
  if (file.type.startsWith('video/') || videoExts.includes(ext)) {
    targetFolder = 'videos';
  }

  // 1. Convert file to Base64 (100% ModSecurity-safe for cPanel)
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file for upload'));
    reader.readAsDataURL(file);
  });

  const payload = {
    action: 'upload',
    name: file.name,
    folder: targetFolder,
    file: base64
  };

  // 2. Try direct post to cPanel api.php
  try {
    const res = await fetch('https://kidsparadise.com.bd/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (directErr) {
    console.warn('Direct cPanel fetch encountered an issue, trying /api/upload proxy...', directErr);
  }

  // 3. Fallback to /api/upload server proxy
  try {
    const proxyRes = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.success && proxyData.url) {
        return proxyData.url;
      }
    }
  } catch (proxyErr) {
    console.error('Proxy upload failed:', proxyErr);
  }

  throw new Error(`Failed to upload ${file.name} to cPanel /uploads/${targetFolder}/`);
};

export default uploadToCpanel;
