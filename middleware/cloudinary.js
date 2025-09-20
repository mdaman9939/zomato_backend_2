const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // e.g., "mycloudname"
  api_key: process.env.CLOUDINARY_API_KEY, // your API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // your API secret
});

module.exports = cloudinary;
