const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/user');

const dbUrl = 'mongodb+srv://shagun:FyG9RSNuCsn5AEdE@cluster0.mrhlmeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const cheapFakeProducts = [
    {
        title: "White Lab Coat (Size M)",
        description: "Gently used for biology labs. Clean and well-maintained. No stains.",
        price: 450,
        category: 'Clothing',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557'
    },
    {
        title: "Scientific Calculator Casio Classwiz",
        description: "Used for 1 year. Essential for engineering and math courses. Working perfectly.",
        price: 980,
        category: 'Stationery',
        condition: 'Like New',
        imageUrl: 'https://images.unsplash.com/photo-1594818821917-001a40356616'
    },
    {
        title: "Engineering Drafter & Set",
        description: "Complete mini drafter set for engineering graphics. Includes board clips.",
        price: 350,
        category: 'Stationery',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592dea58fe22'
    },
    {
        title: "Ethernet Cable (3 Meters)",
        description: "CAT6 cable for high-speed hostel internet. Durable and works great.",
        price: 150,
        category: 'Electronics',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8'
    },
    {
        title: "Adjustable Neck Table Lamp",
        description: "LED lamp with three brightness levels. Perfect for focused night study.",
        price: 420,
        category: 'Furniture',
        condition: 'Like New',
        imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c'
    },
    {
        title: "Power Strip (4 Sockets)",
        description: "Heavy-duty extension cord. Safely charge laptop and phone simultaneously.",
        price: 260,
        category: 'Electronics',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586'
    },
    {
        title: "Large Campus Umbrella",
        description: "Strong build, can withstand heavy wind. Essential for the monsoon season.",
        price: 220,
        category: 'Others',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1521124434241-112613915152'
    },
    {
        title: "Data Structures in C++ (Textbook)",
        description: "Standard course book. No markings or underlines inside. Very helpful for exams.",
        price: 400,
        category: 'Books',
        condition: 'Like New',
        imageUrl: 'https://images.unsplash.com/photo-1532012197367-63baf043aa51'
    },
    {
        title: "Wired Bass Earbuds",
        description: "Deep bass, clear mic. Good for listening to lectures on the go.",
        price: 350,
        category: 'Electronics',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
    },
    {
        title: "Anti-Skid Yoga Mat",
        description: "Used for only one semester. Keeps you fit in the hostel room.",
        price: 680,
        category: 'Sports',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1599447292180-45fd84092ef4'
    },
    {
        title: "Transparent Exam Clipboard",
        description: "Allowed in all mid-sem and final exams. No scratches on the surface.",
        price: 100,
        category: 'Stationery',
        condition: 'Good',
        imageUrl: 'https://plus.unsplash.com/premium_photo-1661331828761-a0be1d668874'
    },
    {
        title: "Folding Dorm Mirror",
        description: "Small and portable. Fits easily on any desk surface.",
        price: 180,
        category: 'Furniture',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1587329310686-914152f45280'
    },
    {
        title: "Insulated Coffee/Water Mug",
        description: "Keeps beverages hot or cold for long durations. Leak-proof lid.",
        price: 450,
        category: 'Others',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1602143307185-84e9074912a2'
    },
    {
        title: "Hall Ticket File Folder",
        description: "Securely stores all your academic certificates and hall tickets.",
        price: 120,
        category: 'Stationery',
        condition: 'New',
        imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4'
    },
    {
        title: "Lightweight Daily Backpack",
        description: "Fits 14-inch laptop. Great for carrying notebooks and essentials to class.",
        price: 850,
        category: 'Clothing',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
    }
];

async function insertCheapFakeProducts() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to DB...');

        const users = await User.find().limit(5);
        if (users.length === 0) {
            console.log('No users found!');
            process.exit(1);
        }

        const productDocs = cheapFakeProducts.map((p, index) => {
            const seller = users[index % users.length];
            return {
                title: p.title,
                description: p.description,
                price: p.price,
                category: p.category,
                condition: p.condition,
                seller: seller._id,
                sellerPhone: seller.phone || '9855512345',
                sellerEmail: seller.email,
                status: 'sold',
                dealStatus: 'sold',
                images: [{ url: p.imageUrl, public_id: 'fake_' + Date.now() + '_' + index }],
                soldDate: new Date(Date.now() - (45 + index) * 24 * 60 * 60 * 1000) // Set even older to avoid "Recently Sold" clash
            };
        });

        await Product.insertMany(productDocs);
        console.log(`Successfully inserted ${productDocs.length} cheap student products!`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

insertCheapFakeProducts();
