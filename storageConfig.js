const multer = require('multer');
const { supabase, bucketName } = require('./supabaseConfig');

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const uploadToSupabase = async (file) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('Invalid file data');
        }

        const fileName = `pyq-${Date.now()}-${file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')}`;
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
                cacheControl: '3600'
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Error in uploadToSupabase:', error);
        throw error;
    }
};

module.exports = { upload, uploadToSupabase };