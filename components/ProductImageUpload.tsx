import React, { useState } from 'react';
import { uploadToCpanel } from '../lib/cpanelUpload';
import api from '../lib/api';

const ProductImageUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToCpanel(file, 'products');
      await api.addProduct({
        name: file.name.replace(/\.[^/.]+$/, ''),
        images: [imageUrl]
      });
      alert('Image uploaded to cPanel uploads successfully!');
    } catch (error: any) {
      console.error('Save Error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-3">
      <h3 className="font-bold text-gray-800">Upload Product Image</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#fff0f3] file:text-[#e92c5d] hover:file:bg-[#ffe3e8] cursor-pointer"
      />
      {uploading && <p className="text-xs text-[#e92c5d] font-bold animate-pulse">Uploading directly to cPanel uploads/products...</p>}
    </div>
  );
};

export default ProductImageUpload;