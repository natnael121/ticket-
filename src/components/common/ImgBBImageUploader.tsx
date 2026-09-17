import React, { useState } from 'react';
import { uploadImageToImgBB, CURATED_EVENT_PRESETS, EventCoverPreset } from '../../services/imgbbService';
import { UploadCloud, Image as ImageIcon, Loader2, X, CheckCircle2, Link as LinkIcon, Sparkles } from 'lucide-react';

interface ImgBBImageUploaderProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  aspect?: 'banner' | 'square';
  selectedCategory?: string;
}

export const ImgBBImageUploader: React.FC<ImgBBImageUploaderProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Upload or choose image banner',
  aspect = 'banner',
  selectedCategory = 'all'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size exceeds 15MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const imageUrl = await uploadImageToImgBB(file, file.name);
      onChange(imageUrl);
    } catch (err: any) {
      console.error('ImgBB upload error:', err);
      setUploadError(err.message || 'Image processing failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const cleanUrl = urlInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('data:image')) {
      setUploadError('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }
    setUploadError(null);
    onChange(cleanUrl);
  };

  const handleSelectPreset = (preset: EventCoverPreset) => {
    setUploadError(null);
    onChange(preset.url);
  };

  // Filter presets if selected category matches
  const filteredPresets = selectedCategory && selectedCategory !== 'all'
    ? CURATED_EVENT_PRESETS.filter((p) => p.category === selectedCategory || p.category === 'all')
    : CURATED_EVENT_PRESETS;
  const displayPresets = filteredPresets.length > 0 ? filteredPresets : CURATED_EVENT_PRESETS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
          {label}
        </label>
        {!value && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-2 py-0.5 rounded-md font-medium transition ${
                activeTab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-2 py-0.5 rounded-md font-medium transition ${
                activeTab === 'url' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paste URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-2 py-0.5 rounded-md font-medium transition flex items-center gap-1 ${
                activeTab === 'presets' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" /> Presets
            </button>
          </div>
        )}
      </div>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900/80 p-2">
          <div
            className={`relative rounded-lg overflow-hidden bg-slate-950 ${
              aspect === 'banner' ? 'h-36 sm:h-44 w-full' : 'h-28 w-28'
            }`}
          >
            <img src={value} alt="Event Cover Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-red-500/90 text-white p-2 rounded-full hover:bg-red-600 transition shadow"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Banner Image Ready
            </span>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'upload' && (
            <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-3 text-blue-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-medium">Optimizing & Uploading Image...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-200 transition">
                  <div className="p-3 rounded-full bg-slate-800 border border-slate-700 group-hover:border-blue-500/50 group-hover:bg-blue-500/10">
                    <UploadCloud className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-200">{placeholder}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WEBP (Auto Compressed)</p>
                  </div>
                </div>
              )}
            </label>
          )}

          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 rounded-xl transition"
              >
                Use URL
              </button>
            </form>
          )}

          {activeTab === 'presets' && (
            <div className="grid grid-cols-3 gap-2">
              {displayPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="relative rounded-lg overflow-hidden border border-slate-800 hover:border-purple-500 cursor-pointer group h-16 bg-slate-950"
                >
                  <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[10px] font-medium text-white truncate leading-tight">{preset.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {uploadError && (
        <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> {uploadError}
        </p>
      )}
    </div>
  );
};
