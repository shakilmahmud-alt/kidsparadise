import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, Search, Copy, Check, Trash2, ExternalLink, Image as ImageIcon, 
  FileText, RefreshCw, AlertCircle, Eye, X, HardDrive, CheckCircle2, Film, Folder, Play,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Square, AlertTriangle
} from 'lucide-react';
import { MediaItem } from '../types';
import { uploadToCpanel } from '../lib/cpanelUpload';

export const MediaManager: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'video' | 'products' | 'banners'>('all');
  const [targetFolder, setTargetFolder] = useState<'media' | 'videos' | 'products' | 'banners'>('media');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch paginated media items
  const fetchMedia = useCallback(async (page: number = 1, search: string = searchQuery, filter: string = selectedFilter) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: search.trim(),
        filter: filter
      });

      const res = await fetch(`/api/media?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.media) {
          setMediaList(data.media);
          setTotalItems(Number(data.total || data.media.length));
          setTotalPages(Number(data.totalPages || Math.ceil((data.total || 1) / pageSize)));
          setCurrentPage(page);
          setSelectedIds([]);
          return;
        }
      }

      // Direct cPanel bridge fallback with MySQL pagination
      let whereClause = 'WHERE 1=1';
      if (search.trim()) {
        whereClause += ` AND (name LIKE '%${search.trim()}%' OR url LIKE '%${search.trim()}%')`;
      }
      if (filter === 'video') {
        whereClause += ' AND (file_type LIKE "%video%" OR url LIKE "%.mp4" OR url LIKE "%.webm" OR url LIKE "%.mov")';
      } else if (filter === 'image') {
        whereClause += ' AND (file_type LIKE "%image%" OR url LIKE "%.jpg" OR url LIKE "%.jpeg" OR url LIKE "%.png" OR url LIKE "%.webp")';
      } else if (filter === 'products') {
        whereClause += ' AND (url LIKE "%/products/%" OR name LIKE "%product%")';
      } else if (filter === 'banners') {
        whereClause += ' AND (url LIKE "%/banners/%" OR url LIKE "%slide%" OR name LIKE "%banner%")';
      }

      const offset = (page - 1) * pageSize;
      const countRes = await fetch('https://kidsparadise.com.bd/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
        },
        body: JSON.stringify({
          action: 'query',
          sql: `SELECT count(*) as total FROM media ${whereClause}`
        })
      });

      let totalCount = 0;
      if (countRes.ok) {
        const countData = await countRes.json();
        totalCount = Number(countData.results?.[0]?.total || 0);
        setTotalItems(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize) || 1);
      }

      const dataRes = await fetch('https://kidsparadise.com.bd/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
        },
        body: JSON.stringify({
          action: 'query',
          sql: `SELECT * FROM media ${whereClause} ORDER BY id DESC LIMIT ${pageSize} OFFSET ${offset}`
        })
      });

      if (dataRes.ok) {
        const data = await dataRes.json();
        if (data.results) {
          setMediaList(data.results.map((m: any) => ({
            id: String(m.id),
            name: m.name,
            url: m.url,
            fileType: m.file_type || 'image/jpeg',
            size: Number(m.size || 0),
            createdAt: m.created_at
          })));
          setCurrentPage(page);
          setSelectedIds([]);
        }
      }
    } catch (err: any) {
      console.error('Error loading media:', err);
      setErrorMessage('Failed to load media items. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, searchQuery, selectedFilter]);

  // Initial load
  useEffect(() => {
    fetchMedia(1, '', 'all');
  }, []);

  // Search handler
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchMedia(1, query, selectedFilter);
  };

  // Filter handler
  const handleFilterChange = (filter: 'all' | 'image' | 'video' | 'products' | 'banners') => {
    setSelectedFilter(filter);
    setCurrentPage(1);
    fetchMedia(1, searchQuery, filter);
  };

  // Bulk Selection Toggles
  const toggleSelectAll = () => {
    if (selectedIds.length === mediaList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mediaList.map(m => m.id));
    }
  };

  const toggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Chunked File Upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const totalFiles = files.length;
    let successfulCount = 0;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(file.name);
      const effectiveFolder = isVideo ? 'videos' : targetFolder;

      setUploadProgress(`Starting ${file.name}...`);

      try {
        // Chunked cPanel Upload with live progress
        const uploadedUrl = await uploadToCpanel(file, effectiveFolder, (percent) => {
          setUploadProgress(`Uploading ${i + 1}/${totalFiles}: ${file.name} (${percent}%)...`);
        });

        successfulCount++;
      } catch (err: any) {
        console.error(`Error uploading ${file.name}:`, err);
        setErrorMessage(`Upload failed for ${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    setUploadProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (successfulCount > 0) {
      setSuccessMessage(`Successfully uploaded ${successfulCount} file(s) directly to cPanel!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchMedia(1, searchQuery, selectedFilter);
    }
  };

  // Permanent Delete Single Item from cPanel & DB
  const handleDeleteSingle = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this file from cPanel storage and database? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      // 1. Send delete request
      const res = await fetch(`/api/media?id=${id}`, {
        method: 'DELETE'
      });

      // 2. Direct cPanel bridge delete fallback
      await fetch('https://kidsparadise.com.bd/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
        },
        body: JSON.stringify({
          action: 'delete_media',
          ids: [id]
        })
      });

      setMediaList(prev => prev.filter(m => m.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      setTotalItems(prev => Math.max(0, prev - 1));
      if (previewItem?.id === id) setPreviewItem(null);

      setSuccessMessage('File permanently deleted from cPanel storage and database.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Permanent Bulk Delete from cPanel & DB
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} file(s) from cPanel storage and database? This will free up server disk space and cannot be undone.`)) return;

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      // 1. Send bulk delete request
      await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      // 2. Direct cPanel bridge bulk delete
      await fetch('https://kidsparadise.com.bd/api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': 'kidsparadise_jwt_secret_key_2026'
        },
        body: JSON.stringify({
          action: 'delete_media',
          ids: selectedIds
        })
      });

      const deletedCount = selectedIds.length;
      setMediaList(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setTotalItems(prev => Math.max(0, prev - deletedCount));
      setSelectedIds([]);

      setSuccessMessage(`Successfully deleted ${deletedCount} file(s) permanently from cPanel storage!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(`Bulk delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy URL with clipboard feedback
  const handleCopyUrl = (item: MediaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Format bytes into readable format
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return 'cPanel Asset';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans text-slate-800 relative pb-16">
      
      {/* Header & cPanel Storage Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1d293f] tracking-tight">
              cPanel Media Library
            </h2>
            <span className="bg-rose-50 text-[#F0264C] font-bold text-xs px-3 py-1 rounded-full border border-rose-100">
              {totalItems.toLocaleString()} Total Files
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Browse, upload, and permanently delete files from your cPanel storage (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">/public_html/uploads/</code>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold">
            <HardDrive size={15} className="text-emerald-600" />
            <span>Direct cPanel Server Storage Active</span>
          </div>

          <button
            onClick={() => fetchMedia(currentPage, searchQuery, selectedFilter)}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all cursor-pointer"
            title="Refresh Library"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Target Folder Selector & Upload Dropzone */}
      <div className="bg-white border-2 border-dashed border-rose-200 hover:border-[#F0264C] rounded-2xl p-8 text-center transition-all bg-rose-50/20 group space-y-6">
        
        {/* Destination Folder Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5 mr-2">
            <Folder size={14} className="text-[#F0264C]" /> Destination cPanel Folder:
          </span>
          {[
            { id: 'media', label: '/uploads/media/' },
            { id: 'products', label: '/uploads/products/' },
            { id: 'videos', label: '/uploads/videos/' },
            { id: 'banners', label: '/uploads/banners/' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTargetFolder(f.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
                targetFolder === f.id
                  ? 'bg-[#F0264C] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.mp4,.webm,.mov,.avi,.pdf,.doc,.docx,.xlsx"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-[#F0264C] rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-105 transition-transform">
            {isUploading ? (
              <RefreshCw size={28} className="animate-spin" />
            ) : (
              <Upload size={28} />
            )}
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-800">
              {isUploading ? 'Uploading to cPanel via Chunked Stream...' : 'Drag & drop files here, or browse from computer'}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Chunked upload supports files of any size (Videos, MP4, Large Images, PDFs).
            </p>
            {uploadProgress && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-bold text-[#F0264C] animate-pulse">
                  {uploadProgress}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-[#F0264C] hover:bg-[#d01c3f] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
          >
            <Upload size={14} /> Browse & Upload to cPanel
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-emerald-600 hover:text-emerald-900"><X size={14} /></button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-500 hover:text-red-800"><X size={14} /></button>
        </div>
      )}

      {/* Search, Filter & Bulk Select Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        
        {/* Search & Select All */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={toggleSelectAll}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              selectedIds.length > 0 && selectedIds.length === mediaList.length
                ? 'bg-[#F0264C] text-white border-[#F0264C]'
                : selectedIds.length > 0
                ? 'bg-rose-50 text-[#F0264C] border-rose-200'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Select all files on this page"
          >
            {selectedIds.length > 0 && selectedIds.length === mediaList.length ? (
              <CheckSquare size={16} />
            ) : (
              <Square size={16} />
            )}
            <span className="hidden sm:inline">Select Page ({mediaList.length})</span>
          </button>

          <div className="relative flex-1 sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search all 5,378+ cPanel files..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F0264C] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'image', label: 'Images' },
            { id: 'video', label: 'Videos' },
            { id: 'products', label: 'Products' },
            { id: 'banners', label: 'Banners' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-rose-50 text-[#F0264C] border border-rose-200 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Pagination Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <div>
          Showing <span className="font-bold text-gray-800">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> - <span className="font-bold text-gray-800">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-bold text-[#F0264C]">{totalItems.toLocaleString()}</span> cPanel files
        </div>
        <div className="text-gray-400">
          Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span> (100 per page)
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-xs">
          <RefreshCw size={32} className="animate-spin text-[#F0264C] mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Loading page {currentPage} of cPanel media files...</p>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-xs">
          <ImageIcon size={40} className="text-gray-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-gray-700">No media files found</h4>
          <p className="text-xs text-gray-400 mt-1">Upload your first file to cPanel or try another search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {mediaList.map((item) => {
            const isVideo = item.fileType.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(item.url);
            const isImage = (item.fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.url)) && !isVideo;
            const isCopied = copiedId === item.id;
            const isSelected = selectedIds.includes(item.id);

            return (
              <div 
                key={item.id}
                onClick={() => setPreviewItem(item)}
                className={`group bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer relative ${
                  isSelected 
                    ? 'border-[#F0264C] ring-2 ring-rose-200' 
                    : 'border-gray-200/80 hover:border-rose-200'
                }`}
              >
                {/* Selection Checkbox on Card */}
                <div 
                  onClick={(e) => toggleSelectItem(item.id, e)}
                  className={`absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all shadow-sm ${
                    isSelected 
                      ? 'bg-[#F0264C] text-white ring-2 ring-white' 
                      : 'bg-white/80 backdrop-blur-xs text-gray-400 hover:text-gray-800 opacity-70 group-hover:opacity-100'
                  }`}
                  title="Select for bulk delete"
                >
                  {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={14} />}
                </div>

                {/* Thumbnail Preview Area */}
                <div className="relative h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {isVideo ? (
                    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center text-white">
                      <Film size={36} className="text-rose-400 opacity-80" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play size={16} className="text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">VIDEO</span>
                    </div>
                  ) : isImage ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-1">
                      <FileText size={36} />
                      <span className="text-[10px] font-bold uppercase">{item.fileType.split('/')[1] || 'FILE'}</span>
                    </div>
                  )}

                  {/* Hover Overlay with Preview & Direct Link */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                      className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm transition-all"
                      title="Preview"
                    >
                      <Eye size={14} />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm transition-all"
                      title="Open in new tab"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {/* Details and Actions */}
                <div className="p-3 bg-white space-y-2 border-t border-gray-100">
                  <div>
                    <h5 className="font-bold text-xs text-gray-800 truncate" title={item.name}>
                      {item.name}
                    </h5>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                      <span className="truncate max-w-[90px]">{formatBytes(item.size)}</span>
                      {item.createdAt && (
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>

                  {/* Copy URL & Delete Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={(e) => handleCopyUrl(item, e)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        isCopied 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-rose-50 hover:bg-[#F0264C] text-[#F0264C] hover:text-white border border-rose-100'
                      }`}
                      title="Copy Public cPanel URL"
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} strokeWidth={2.5} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy URL
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(item.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Permanently delete from cPanel storage"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls Bar */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            Page <span className="font-bold text-gray-800">{currentPage}</span> of <span className="font-bold text-gray-800">{totalPages}</span> ({totalItems.toLocaleString()} total items)
          </div>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              onClick={() => fetchMedia(1, searchQuery, selectedFilter)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => fetchMedia(Math.max(1, currentPage - 1), searchQuery, selectedFilter)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage;
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => fetchMedia(pageNum, searchQuery, selectedFilter)}
                  disabled={isLoading}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#F0264C] text-white shadow-xs'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              onClick={() => fetchMedia(Math.min(totalPages, currentPage + 1), searchQuery, selectedFilter)}
              disabled={currentPage === totalPages || isLoading}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              onClick={() => fetchMedia(totalPages, searchQuery, selectedFilter)}
              disabled={currentPage === totalPages || isLoading}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#F0264C] text-white text-xs font-bold flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">files selected</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            <span>Permanently Delete from cPanel ({selectedIds.length})</span>
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cancel selection"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Large Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-gray-800 truncate max-w-md">
                  {previewItem.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  cPanel File &bull; {previewItem.createdAt ? new Date(previewItem.createdAt).toLocaleString() : 'Uploaded Asset'}
                </p>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-50/50">
              {previewItem.fileType.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(previewItem.url) ? (
                <video
                  src={previewItem.url}
                  controls
                  className="max-h-[380px] w-full rounded-xl shadow-md bg-black"
                />
              ) : previewItem.fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(previewItem.url) ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-md border border-gray-100"
                />
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <FileText size={64} className="mx-auto mb-2 text-[#F0264C]" />
                  <p className="text-sm font-semibold">{previewItem.fileType}</p>
                </div>
              )}

              {/* URL Box */}
              <div className="w-full mt-6 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                  <span>Direct cPanel Public URL</span>
                  <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 size={12} /> Ready to use
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={previewItem.url}
                    className="flex-1 bg-gray-50 px-3 py-2 rounded-xl text-xs text-gray-700 font-mono select-all outline-none border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(previewItem)}
                    className="px-4 py-2 bg-[#F0264C] hover:bg-[#d01c3f] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === previewItem.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === previewItem.id ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                    title="Open in new tab"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MediaManager;
