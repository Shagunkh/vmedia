const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || 'dyfrbqmho',
  api_key: process.env.CLOUD_API_KEY || '357776164396942',
  api_secret: process.env.CLOUD_API_SECRET || 'AeadLvQ3dPiErMU--NJoVb6wHAs'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'PYQ/pages',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

module.exports = { storage, cloudinary };