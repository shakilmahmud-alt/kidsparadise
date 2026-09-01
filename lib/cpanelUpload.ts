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
    reader.onerror = (e) => reject(new Error('Failed to read file for upload'));
    reader.readAsDataURL(file);
  });

  // 2. Post directly to cPanel api.php
  const res = await fetch('https://kidsparadise.com.bd/api.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
    },
    body: JSON.stringify({
      action: 'upload',
      name: file.name,
      folder: targetFolder,
      file: base64
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`cPanel Upload Error (HTTP ${res.status}): ${text || 'Please update api.php on cPanel'}`);
  }

  const data = await res.json();
  if (data.success && data.url) {
    return data.url;
  }

  throw new Error(data.error || 'Failed to save file in cPanel uploads/' + targetFolder);
};

export default uploadToCpanel;
