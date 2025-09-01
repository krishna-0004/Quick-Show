import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImageFromUrl = async (imageUrl, folder = "movies") => {
    try {
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder, 
            resource_type: "image",
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        throw new Error("Cloudinary upload failed: "+ error.message);
    }
};

export const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        return true;
    } catch (err) {
        throw new Error("Cloudinary delete failed: "+ err.message);
    }
};