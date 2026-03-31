const mongoose = require('mongoose');
const Product = require('./models/Product');

const dbUrl = 'mongodb+srv://shagun:FyG9RSNuCsn5AEdE@cluster0.mrhlmeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const localImageMapping = [
    {
        title: "Official Hall Ticket & ID Folder",
        filename: "Official Hall Ticket & ID Folder.png"
    },
    {
        title: "Casio Scientific Calculator (fx-991EX)",
        filename: "casio scientific calculator.png"
    },
    {
        title: "Cotton White Lab Coat (Full Sleeve)",
        filename: "cotton white lab coat.png"
    },
    {
        title: "Engineering Mechanics (S.S. Bhavikatti)",
        filename: "engineering mechanics.png"
    },
    {
        title: "Frameless Dorm Wall Mirror",
        filename: "frameless dorm wall mirror.png"
    },
    {
        title: "Milton Insulated Steel Flask (500ml)",
        filename: "milton insulated steel flask.png"
    },
    {
        title: "Mini Drafter for Engineering Graphics",
        filename: "mini drafter for engineering graphics.png"
    },
    {
        title: "Multi-Socket Spike Guard Extension",
        filename: "multi socket spike guard extension.png"
    },
    {
        title: "Sturdy Blue Campus Umbrella",
        filename: "sturdy blue campus umbrella.png"
    },
    {
        title: "High-Grip 6mm Yoga Mat",
        filename: "yoga matt.png"
    }
];

async function syncLocalImages() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to DB...');

        let updatedCount = 0;
        for (const mapping of localImageMapping) {
            const product = await Product.findOne({ title: mapping.title });
            if (product) {
                // Update images array to point to local path using the correct object structure
                product.images = [{ url: `/images/${mapping.filename}` }];
                await product.save();
                console.log(`Updated images for: ${mapping.title} -> ${mapping.filename}`);
                updatedCount++;
            } else {
                console.log(`Product not found with title: ${mapping.title}`);
            }
        }

        console.log(`Successfully synced ${updatedCount} products with local images.`);
        process.exit(0);
    } catch (err) {
        console.error('Error syncing images:', err);
        process.exit(1);
    }
}

syncLocalImages();
