const mongoose = require('mongoose');
const Product = require('./models/Product');

const dbUrl = 'mongodb+srv://shagun:FyG9RSNuCsn5AEdE@cluster0.mrhlmeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function removeAllFakeProducts() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to DB...');

        const result = await Product.deleteMany({
            'images.public_id': { $regex: /^fake_/ }
        });

        console.log(`Deleted ${result.deletedCount} fake products.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

removeAllFakeProducts();
