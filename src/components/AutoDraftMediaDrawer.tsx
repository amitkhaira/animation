import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Film,
  Trash2,
  Plus,
  MonitorPlay,
  Layers,
  Sparkles,
  Search,
  FolderOpen
} from 'lucide-react';

export interface MediaAssetItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'background';
  createdAt?: number;
}

interface AutoDraftMediaDrawerProps {
  onAddMediaToStage: (media: MediaAssetItem) => void;
  onSetAsBackground: (url: string, name?: string) => void;
  onClose?: () => void;
}

// Built-in high quality stock media assets
const STOCK_MEDIA: MediaAssetItem[] = [
  {
    id: 'stock_bg_village',
    name: 'Village Path Day',
    type: 'background',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/thumbnails/2026-04-09/Village_Scene_Walk.webp'
  },
  {
    id: 'stock_bg_kirana',
    name: 'Kirana Shop Closed',
    type: 'background',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/thumbnails/2026-04-09/Kirana_Shop_Closed.webp'
  },
  {
    id: 'stock_bg_kitchen',
    name: 'Western Kitchen',
    type: 'background',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/thumbnails/2026-04-09/Western_Kitchen_1.webp'
  },
  {
    id: 'stock_bg_forest',
    name: 'Deep Forest',
    type: 'background',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/thumbnails/2026-04-09/Dark_Jungle_1.webp'
  },
  {
    id: 'stock_elem_tree',
    name: 'Banyan Tree',
    type: 'image',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/layers/2026-04-09/Large_Tree_34.webp'
  },
  {
    id: 'stock_elem_bench',
    name: 'Village Bench',
    type: 'image',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/layers/2026-04-09/Bench.webp'
  },
  {
    id: 'stock_elem_sun',
    name: 'Golden Sun',
    type: 'image',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/layers/2026-04-09/Sun_1.webp'
  },
  {
    id: 'stock_elem_clouds',
    name: 'Fluffy Clouds',
    type: 'image',
    url: 'https://assets.autodraft.kr/canvas-animations/scenes/layers/2026-04-09/Clouds_1.webp'
  }
];

export const AutoDraftMediaDrawer: React.FC<AutoDraftMediaDrawerProps> = ({
  onAddMediaToStage,
  onSetAsBackground
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userUploads, setUserUploads] = useState<MediaAssetItem[]>(() => {
    try {
      const saved = localStorage.getItem('autodraft_media_uploads');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'uploads' | 'stock'>(() => {
    const p = new URLSearchParams(window.location.search).get('media_tab');
    if (p === 'uploads' || p === 'stock') return p;
    return userUploads.length > 0 ? 'uploads' : 'stock';
  });
  const [filterType, setFilterType] = useState<'all' | 'image' | 'background'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Save user uploads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('autodraft_media_uploads', JSON.stringify(userUploads));
    } catch (_) {}
  }, [userUploads]);

  // Handle local file selection via file picker or drop
  const handleProcessFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return;
      }
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const newItem: MediaAssetItem = {
            id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            url: dataUrl,
            type: isVideo ? 'video' : 'image',
            createdAt: Date.now()
          };
          setUserUploads((prev) => [newItem, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteUpload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserUploads((prev) => prev.filter((item) => item.id !== id));
  };

  const displayedList = (activeTab === 'uploads' ? userUploads : STOCK_MEDIA).filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <aside className="w-80 h-full bg-[#11131e] border-r border-[#1f2333] flex flex-col z-20 select-none">
      {/* 1. Header */}
      <div className="p-3 border-b border-[#1f2333] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Media Library</h2>
        </div>
        <span className="text-[10px] text-gray-400 bg-[#1a1e2e] px-2 py-0.5 rounded-full border border-gray-700/50">
          {activeTab === 'uploads' ? `${userUploads.length} uploaded` : `${STOCK_MEDIA.length} stock`}
        </span>
      </div>

      {/* 2. Upload Button & Drag-Drop Box */}
      <div className="p-3 border-b border-[#1f2333]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-[#2c3248] hover:border-blue-500/60 bg-[#161a29]/60 hover:bg-[#1a1f33]'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-1.5">
            <UploadCloud className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-gray-200">Upload from Computer</span>
          <span className="text-[10px] text-gray-400 mt-0.5 text-center">
            Drop PNG, JPG, SVG, WebP, GIF or browse
          </span>
        </div>
      </div>

      {/* 3. Tab Switcher (Uploads vs Stock) */}
      <div className="flex px-3 pt-2 space-x-1 border-b border-[#1f2333]">
        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'uploads'
              ? 'bg-[#1a1f33] text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>My Uploads</span>
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'stock'
              ? 'bg-[#1a1f33] text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stock Assets</span>
        </button>
      </div>

      {/* 4. Filter Tags & Search */}
      <div className="p-3 space-y-2 border-b border-[#1f2333]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161a29] border border-[#252a3d] rounded-lg pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex space-x-1 text-[10px]">
          {(['all', 'image', 'background'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                filterType === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1e2e] text-gray-400 hover:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Media Grid List */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {displayedList.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500 p-4">
            <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium">
              {activeTab === 'uploads' ? 'No uploads yet' : 'No stock items match'}
            </p>
            <p className="text-[10px] mt-1 text-gray-600">
              {activeTab === 'uploads'
                ? 'Upload an image from your computer above to use it on the stage'
                : 'Try searching for something else'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {displayedList.map((item) => (
              <div
                key={item.id}
                className="group relative bg-[#171a2a] border border-[#23283e] hover:border-blue-500/80 rounded-xl overflow-hidden transition-all shadow-sm flex flex-col"
              >
                {/* Thumbnail */}
                <div className="w-full h-24 bg-[#0d0f18] flex items-center justify-center overflow-hidden relative">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  )}

                  {/* Delete button for user uploads */}
                  {activeTab === 'uploads' && (
                    <button
                      onClick={(e) => handleDeleteUpload(item.id, e)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-md bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Hover Quick Action Buttons */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                    <button
                      onClick={() => onAddMediaToStage(item)}
                      className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center justify-center space-x-1 shadow"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to Stage</span>
                    </button>
                    <button
                      onClick={() => onSetAsBackground(item.url, item.name)}
                      className="w-full py-1 bg-[#23283e] hover:bg-[#2d3450] text-gray-200 rounded text-[10px] font-semibold flex items-center justify-center space-x-1 shadow"
                      title="Use as Stage Background"
                    >
                      <MonitorPlay className="w-3 h-3 text-emerald-400" />
                      <span>Set as BG</span>
                    </button>
                  </div>
                </div>

                {/* Caption */}
                <div className="p-1.5 bg-[#141724]">
                  <p className="text-[11px] font-medium text-gray-300 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <span className="text-[9px] text-gray-500 uppercase">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
