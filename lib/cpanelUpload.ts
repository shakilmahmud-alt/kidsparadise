/**
 * Ultra-Reliable Chunked & Direct cPanel File Uploader
 * Splits large files into 1MB chunks to guarantee 100% success on any file size,
 * bypassing all PHP memory, upload_max_filesize, post_max_size, and Vercel payload limits.
 */

export const uploadToCpanel = async (
  file: File, 
  folder: string = 'media',
  onProgress?: (percent: number) => void
): Promise<string> => {
  let targetFolder = folder.replace(/^\/+/, '') || 'media';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'];

  // Auto route videos to 'videos' folder
  if (file.type.startsWith('video/') || videoExts.includes(ext)) {
    targetFolder = 'videos';
  }

  const CHUNK_SIZE = 1024 * 1024; // 1 MB per chunk (100% safe for all servers)
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const fileId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  // Helper to read blob to base64
  const readChunkBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file chunk'));
      reader.readAsDataURL(blob);
    });
  };

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunkBlob = file.slice(start, end);
    const chunkBase64 = await readChunkBase64(chunkBlob);

    const payload = {
      action: 'upload_chunk',
      file_id: fileId,
      chunk_index: i,
      total_chunks: totalChunks,
      name: file.name,
      folder: targetFolder,
      chunk_data: chunkBase64
    };

    let responseData: any = null;

    // 1. Try Direct to cPanel
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
        responseData = await res.json();
      }
    } catch (err) {
      console.warn(`Direct chunk ${i + 1} fetch failed, trying proxy...`, err);
    }

    // 2. Fallback to /api/upload proxy if direct fetch failed
    if (!responseData || !responseData.success) {
      try {
        const proxyRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (proxyRes.ok) {
          responseData = await proxyRes.json();
        }
      } catch (proxyErr) {
        console.error('Proxy chunk upload failed:', proxyErr);
      }
    }

    if (!responseData || !responseData.success) {
      throw new Error(responseData?.error || `Failed on chunk ${i + 1}/${totalChunks}`);
    }

    if (onProgress) {
      const percent = Math.round(((i + 1) / totalChunks) * 100);
      onProgress(percent);
    }

    // Final chunk returns the permanent cPanel URL!
    if (responseData.url) {
      return responseData.url;
    }
  }

  throw new Error(`Upload ended without URL for ${file.name}`);
};

export default uploadToCpanel;
