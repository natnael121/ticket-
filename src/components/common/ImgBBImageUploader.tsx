import React, { useState } from 'react';
import { uploadImageToImgBB } from '../../services/imgbbService';
import { UploadCloud, Image as ImageIcon, Loader2, X, CheckCircle2 } from 'lucide-react';

interface ImgBBImageUploaderProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  aspect?: 'banner' | 'square';
}

export const ImgBBImageUploader: React.FC<ImgBBImageUploaderProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Upload image (Banner, Logo, Screenshot)',
  aspect = 'banner'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const imageUrl = await uploadImageToImgBB(file, file.name);
      onChange(imageUrl);
    } catch (err: any) {
      console.error('ImgBB upload error:', err);
      setUploadError(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
        {label}
      </label>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900/60 p-2">
          <div
            className={`relative rounded-lg overflow-hidden bg-slate-950 ${
              aspect === 'banner' ? 'h-36 sm:h-44 w-full' : 'h-28 w-28'
            }`}
          >
            <img src={value} alt="Uploaded preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
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
              <CheckCircle2 className="w-3.5 h-3.5" /> Image uploaded via ImgBB
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
              <span className="text-xs font-medium">Compressing & Uploading to ImgBB...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-200 transition">
              <div className="p-3 rounded-full bg-slate-800 border border-slate-700 group-hover:border-blue-500/50 group-hover:bg-blue-500/10">
                <UploadCloud className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-200">{placeholder}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WEBP (Max 10MB)</p>
              </div>
            </div>
          )}
        </label>
      )}

      {uploadError && (
        <p className="text-xs text-red-400 font-medium mt-1 flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> {uploadError}
        </p>
      )}
    </div>
  );
};
