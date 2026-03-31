const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/user');

const dbUrl = 'mongodb+srv://shagun:FyG9RSNuCsn5AEdE@cluster0.mrhlmeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const freshFakeProducts = [
    {
        title: "Mini Drafter for Engineering Graphics",
        description: "Perfect for ED labs. Clear scales and sturdy build. In very good condition.",
        price: 360,
        category: 'Stationery',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1531403070002-da667303e230'
    },
    {
        title: "Casio Scientific Calculator (fx-991EX)",
        description: "Standard calculator allowed for all university exams. 1 year used, working perfectly.",
        price: 920,
        category: 'Stationery',
        condition: 'Like New',
        imageUrl: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c'
    },
    {
        title: "Cotton White Lab Coat (Full Sleeve)",
        description: "Size L. Heavy cotton material, used for 2 semesters. Freshly laundered at home.",
        price: 400,
        category: 'Clothing',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae'
    },
    {
        title: "Dorm LED Study Lamp",
        description: "Adjustable height and brightness. Very helpful for late-night exam prep.",
        price: 380,
        category: 'Furniture',
        condition: 'Like New',
        imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c'
    },
    {
        title: "Multi-Socket Spike Guard Extension",
        description: "4-socket extension cord with 2 USB ports. Protects your laptop from power surges.",
        price: 290,
        category: 'Electronics',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586'
    },
    {
        title: "Sturdy Blue Campus Umbrella",
        description: "Big enough for two people. Very strong build, perfect for Campus weather.",
        price: 260,
        category: 'Others',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1521124434241-112613915152'
    },
    {
        title: "Classmate 5-Subject Spiral Notebook",
        description: "All pages are unused. High quality paper. Got it as a gift but don't need it.",
        price: 180,
        category: 'Stationery',
        condition: 'New',
        imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db'
    },
    {
        title: "Engineering Mechanics (S.S. Bhavikatti)",
        description: "Very useful book for first year mechanics. Clear diagrams and solved examples.",
        price: 340,
        category: 'Books',
        condition: 'Fair',
        imageUrl: 'https://images.unsplash.com/photo-1532012197367-63baf043aa51'
    },
    {
        title: "Boat Bassheads wired Earphones",
        description: "Excellent sound and powerful bass. Mic works perfectly for online classes.",
        price: 450,
        category: 'Electronics',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
    },
    {
        title: "High-Grip 6mm Yoga Mat",
        description: "Used for 6 months. Good for home or hostel room floor exercise.",
        price: 640,
        category: 'Sports',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1599447292180-45fd84092ef4'
    },
    {
        title: "Official Hall Ticket & ID Folder",
        description: "Durable clear folder for all important academic documents. Keeps them waterproof.",
        price: 110,
        category: 'Stationery',
        condition: 'New',
        imageUrl: 'https://images.unsplash.com/photo-1586282391269-52136ccd4b1a'
    },
    {
        title: "Frameless Dorm Wall Mirror",
        description: "Easy to mount on any door or wall. No cracks or major scratches.",
        price: 240,
        category: 'Furniture',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1587329310686-914152f45280'
    },
    {
        title: "Milton Insulated Steel Flask (500ml)",
        description: "Keeps tea hot for 6+ hours. Very handy during late nights in the hostel.",
        price: 520,
        category: 'Others',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1602143307185-84e9074912a2'
    },
    {
        title: "Magnetic Desktop Whiteboard",
        description: "Small whiteboard for writing your daily schedules. Marker included.",
        price: 280,
        category: 'Furniture',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd'
    },
    {
        title: "Water-Resistant Campus Backpack",
        description: "Blue color with multiple compartments. Fits a laptop and lunch box comfortably.",
        price: 880,
        category: 'Clothing',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
    }
];

async function insertFreshFakeProducts() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to DB...');

        const users = await User.find().limit(5);
        if (users.length === 0) {
            console.log('No users found!');
            process.exit(1);
        }

        const productDocs = freshFakeProducts.map((p, index) => {
            const seller = users[index % users.length];
            return {
                title: p.title,
                description: p.description,
                price: p.price,
                category: p.category,
                condition: p.condition,
                seller: seller._id,
                sellerPhone: seller.phone || '9955501234',
                sellerEmail: seller.email,
                status: 'sold',
                dealStatus: 'sold',
                images: [{ url: p.imageUrl, public_id: 'fake_' + Date.now() + '_' + index }],
                soldDate: new Date(Date.now() - (60 + index) * 24 * 60 * 60 * 1000) // Older dates for trust
            };
        });

        await Product.insertMany(productDocs);
        console.log(`Successfully inserted ${productDocs.length} FRESH student products!`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

insertFreshFakeProducts();
