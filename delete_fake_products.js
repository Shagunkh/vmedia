const mongoose = require('mongoose');
const Product = require('./models/Product');

const dbUrl = 'mongodb+srv://shagun:FyG9RSNuCsn5AEdE@cluster0.mrhlmeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function deleteOldFakeProducts() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to DB...');

        // Find products where at least one image public_id starts with 'fake_'
        const result = await Product.deleteMany({
            'images.public_id': { $regex: /^fake_/ }
        });

        console.log(`Successfully deleted ${result.deletedCount} old fake products.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

deleteOldFakeProducts();
