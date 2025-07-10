import axios from "axios";

export async function uploadImageToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ImagePost");
  const res = await axios.post("https://api.cloudinary.com/v1_1/dyhuugw7d/image/upload", formData);
  return res.data.secure_url;
}

export async function uploadSongToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "songApp");
  const res = await axios.post("https://api.cloudinary.com/v1_1/dyhuugw7d/video/upload", formData);
  return res.data.secure_url;
} 