/**
 * Helper to upload files directly to cPanel hosting (https://kidsparadise.com.bd/uploads/...)
 * with automatic ImageKit cloud fallback if cPanel bridge is unreachable.
 */
import { uploadToImageKit } from './imagekit';

export const uploadToCpanel = async (file: File, folder: string = '/general'): Promise<string> => {
  try {
    // 1. Convert file to Base64 (100% ModSecurity-safe for cPanel)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 2. Post to cPanel api.php
    const res = await fetch('https://kidsparadise.com.bd/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
      },
      body: JSON.stringify({
        action: 'upload',
        name: file.name,
        file: base64
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }

    // 3. Fallback to ImageKit if cPanel returned an error or api.php is waiting for update
    console.warn('cPanel upload returned non-success, using ImageKit fallback...');
    return await uploadToImageKit(file, folder);
  } catch (err: any) {
    console.warn('cPanel direct upload failed, falling back to ImageKit:', err.message);
    return await uploadToImageKit(file, folder);
  }
};

export default uploadToCpanel;
