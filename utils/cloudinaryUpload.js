const cloudinary = require("../cloudinary"); // import your cloudinary config
const path = require("path");

async function uploadImage(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "chatbot",
    });
    console.log("Image URL:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

module.exports = uploadImage;
