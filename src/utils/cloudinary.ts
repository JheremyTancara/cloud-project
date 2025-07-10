// Utilidades para subir imágenes y audios a Cloudinary
// NOTA: Necesitas tu cloud_name y upload_preset configurados en Cloudinary

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dyhuugw7d';
const IMAGE_UPLOAD_PRESET = 'ImagePost';
const AUDIO_UPLOAD_PRESET = 'songApp';

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', IMAGE_UPLOAD_PRESET);
  const res = await fetch(`${CLOUDINARY_URL}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
}

export async function uploadAudioToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', AUDIO_UPLOAD_PRESET);
  // Usar /video/upload para que Cloudinary ponga el header correcto y el navegador pueda reproducir el mp3
  const res = await fetch(`${CLOUDINARY_URL}/video/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) {
    console.error('Cloudinary upload error:', data);
    throw new Error('Upload failed: ' + (data.error?.message || JSON.stringify(data)));
  }
  return data.secure_url;
} 