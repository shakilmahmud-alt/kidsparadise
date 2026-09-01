import { uploadToCpanel } from './cpanelUpload';

/**
 * Direct cPanel Uploader Bridge
 * All uploads across the application are saved directly to cPanel hosting (/public_html/uploads/...)
 */
export const uploadToImageKit = async (file: File, folder: string = 'media'): Promise<string> => {
  return await uploadToCpanel(file, folder);
};

export default uploadToImageKit;
