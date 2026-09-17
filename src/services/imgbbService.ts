/**
 * ImgBB Image Upload Service
 * Handles uploading images (banners, logos, payment screenshots) to ImgBB with automatic compression
 * and fallback micro-compression Data URLs (<60KB) to prevent Firestore payload size limits.
 */

const IMGBB_API_KEYS = [
  import.meta.env.VITE_IMGBB_API_KEY,
  'f6f560dbdcf0c91aea57b3cd55097799',
  'd480e60ed7471926bdf1a52003fdf54a'
].filter(Boolean) as string[];

const IMGBB_API_URL = import.meta.env.VITE_IMGBB_API_URL || 'https://api.imgbb.com/1/upload';

/**
 * Curated High-Quality Event Cover Presets for 1-Click Banner Selection
 */
export interface EventCoverPreset {
  id: string;
  category: string;
  title: string;
  url: string;
}

export const CURATED_EVENT_PRESETS: EventCoverPreset[] = [
  {
    id: 'tech_1',
    category: 'tech',
    title: 'Modern Tech Conference',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'music_1',
    category: 'music',
    title: 'Live Music Concert',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'party_1',
    category: 'party',
    title: 'Nightlife & DJ Party',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'business_1',
    category: 'business',
    title: 'Corporate Summit & Networking',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sports_1',
    category: 'sports',
    title: 'Sports & Fitness Festival',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'arts_1',
    category: 'arts',
    title: 'Art Exhibition & Culture',
    url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80'
  }
];

/**
 * Resizes and compresses an image Blob before uploading
 */
export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.80): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Generates an ultra-compressed micro base64 Data URL (<60KB) as a safe fallback
 * so that offline/failed API uploads will NEVER crash Firestore (1MB limit) or localStorage.
 */
export async function compressToMicroDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.55);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = () => resolve('');
  });
}

/**
 * Uploads an image to ImgBB and returns the direct URL.
 * Falls back gracefully to a micro-compressed Data URL if network/API fails.
 */
export async function uploadImageToImgBB(file: File, name?: string): Promise<string> {
  const compressedBlob = await compressImage(file);

  for (const apiKey of IMGBB_API_KEYS) {
    try {
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('image', compressedBlob, name || file.name);

      if (name) {
        formData.append('name', name);
      }

      const response = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (data.success && data.data && data.data.url) {
        return data.data.url;
      }
    } catch (err) {
      console.warn(`[ImgBB] Upload attempt failed with key ${apiKey.substring(0, 6)}...`, err);
    }
  }

  // Safe fallback to micro-compressed Data URL (<60KB) if all API keys fail
  console.warn('[ImgBB] All API upload attempts failed, generating safe micro base64 fallback URL...');
  return await compressToMicroDataUrl(file);
}
