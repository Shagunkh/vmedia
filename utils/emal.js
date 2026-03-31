const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "vitforall2025@gmail.com",
        pass: "oxdfqvuwkzxqyylo"
    }
});

// ============ EXISTING EMAIL FUNCTIONS ============

// Send welcome email to new user
async function sendWelcomeEmail(email, username) {
    const mailOptions = {
        from: `"VMedia" <${process.env.EMAIL_USERNAME}>`,
        to: email,
        subject: 'Welcome to VMedia!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h1 style="color: #00d8ff;">Welcome to VMedia!</h1>
                    <p style="color: #e2e8f0; font-size: 16px;">Hello ${username},</p>
                    <p style="color: #94a3b8;">Thank you for joining VMedia! We're excited to have you on board.</p>
                    <a href="${process.env.BASE_URL}" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #00d8ff, #008cff); color: white; text-decoration: none; border-radius: 50px;">Explore VMedia</a>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
}

// Send interest email to seller
async function sendInterestEmailToSeller(product, buyer, seller) {
    const productLink = `${process.env.BASE_URL}/marketplace/product/${product._id}`;
    const chatLink = `${process.env.BASE_URL}/marketplace/my-chats`;
    
    const mailOptions = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: seller.email,
        subject: `📢 Someone is interested in your product: ${product.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #00d8ff;">New Interest!</h2>
                    <p style="color: #e2e8f0;">Hello ${seller.username},</p>
                    <p style="color: #94a3b8;"><strong>${buyer.username}</strong> is interested in your product:</p>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #f97316; margin: 0;">${product.title}</h3>
                        <p style="color: #e2e8f0; margin: 5px 0;">Price: ₹${product.price}</p>
                    </div>
                    <p style="color: #94a3b8;">Buyer Contact:</p>
                    <p style="color: #e2e8f0;">📞 ${buyer.phone}<br>✉️ ${buyer.email}</p>
                    <div style="margin: 20px 0;">
                        <a href="${productLink}" style="display: inline-block; padding: 10px 20px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; margin: 5px;">View Product</a>
                        <a href="${chatLink}" style="display: inline-block; padding: 10px 20px; background: #00d8ff; color: white; text-decoration: none; border-radius: 8px; margin: 5px;">Go to Chats</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px;">Login to VMedia to chat with the buyer and finalize the deal.</p>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Interest email sent to seller ${seller.email}`);
    } catch (error) {
        console.error('Error sending interest email to seller:', error);
    }
}

// Send confirmation email to buyer
async function sendBuyerConfirmationEmail(product, buyer, seller) {
    const productLink = `${process.env.BASE_URL}/marketplace/product/${product._id}`;
    const chatLink = `${process.env.BASE_URL}/marketplace/my-chats`;
    
    const mailOptions = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: buyer.email,
        subject: `✅ Interest Confirmed: ${product.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #10b981;">Interest Confirmed!</h2>
                    <p style="color: #e2e8f0;">Hello ${buyer.username},</p>
                    <p style="color: #94a3b8;">You have shown interest in:</p>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #f97316; margin: 0;">${product.title}</h3>
                        <p style="color: #e2e8f0; margin: 5px 0;">Price: ₹${product.price}</p>
                    </div>
                    <p style="color: #94a3b8;">Seller Contact:</p>
                    <p style="color: #e2e8f0;">✉️ ${seller.email}</p>
                    <div style="margin: 20px 0;">
                        <a href="${productLink}" style="display: inline-block; padding: 10px 20px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; margin: 5px;">View Product</a>
                        <a href="${chatLink}" style="display: inline-block; padding: 10px 20px; background: #00d8ff; color: white; text-decoration: none; border-radius: 8px; margin: 5px;">Go to Chats</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px;">Login to VMedia to chat with the seller and finalize the deal.</p>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to buyer ${buyer.email}`);
    } catch (error) {
        console.error('Error sending confirmation email to buyer:', error);
    }
}

// ============ DEAL CONFIRMATION EMAILS ============

// Send auto-sold notification
async function sendAutoSoldNotification(item, confirmedUser, otherUser, isFood = false) {
    const itemType = isFood ? 'food stall' : 'product';
    const itemTitle = isFood ? item.vendorName : item.title;
    const itemLink = isFood 
        ? `${process.env.BASE_URL}/nightmess/item/${item._id}`
        : `${process.env.BASE_URL}/marketplace/product/${item._id}`;
    
    const confirmedEmail = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: confirmedUser.email,
        subject: `🎉 Deal Confirmed: ${itemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #10b981;">Deal Confirmed! 🎉</h2>
                    <p style="color: #e2e8f0;">Hello ${confirmedUser.username},</p>
                    <p style="color: #94a3b8;">The deal for <strong>${itemTitle}</strong> has been confirmed and marked as sold.</p>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <p style="color: #e2e8f0;">Thank you for using VMedia Marketplace!</p>
                    </div>
                    <a href="${itemLink}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #00d8ff, #008cff); color: white; text-decoration: none; border-radius: 50px;">View Item</a>
                </div>
            </div>
        `
    };
    
    const otherEmail = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: otherUser.email,
        subject: `🎉 Deal Confirmed: ${itemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #10b981;">Deal Confirmed! 🎉</h2>
                    <p style="color: #e2e8f0;">Hello ${otherUser.username},</p>
                    <p style="color: #94a3b8;">The deal for <strong>${itemTitle}</strong> has been confirmed and marked as sold.</p>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <p style="color: #e2e8f0;">Thank you for using VMedia Marketplace!</p>
                    </div>
                    <a href="${itemLink}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #00d8ff, #008cff); color: white; text-decoration: none; border-radius: 50px;">View Item</a>
                </div>
            </div>
        `
    };
    
    try {
        await Promise.all([
            transporter.sendMail(confirmedEmail),
            transporter.sendMail(otherEmail)
        ]);
        console.log(`Auto-sold notification emails sent for ${itemTitle}`);
    } catch (error) {
        console.error('Error sending auto-sold notification:', error);
    }
}

// Send deal reminder
async function sendDealReminder(item, seller, buyer, isFood = false) {
    const itemType = isFood ? 'food stall' : 'product';
    const itemTitle = isFood ? item.vendorName : item.title;
    const itemLink = isFood 
        ? `${process.env.BASE_URL}/nightmess/item/${item._id}`
        : `${process.env.BASE_URL}/marketplace/product/${item._id}`;
    
    const sellerEmail = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: seller.email,
        subject: `⏰ Reminder: Pending Deal for ${itemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #f59e0b;">Pending Deal Reminder ⏰</h2>
                    <p style="color: #e2e8f0;">Hello ${seller.username},</p>
                    <p style="color: #94a3b8;">You have a pending deal for <strong>${itemTitle}</strong> that has not been confirmed.</p>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <p style="color: #e2e8f0;">Buyer: ${buyer.username}</p>
                        <p style="color: #e2e8f0;">Interest shown on: ${new Date(item.interestCreatedAt).toLocaleDateString()}</p>
                    </div>
                    <p style="color: #94a3b8;">Please log in to your account and confirm the deal to complete the transaction.</p>
                    <a href="${itemLink}" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; border-radius: 50px;">View Deal</a>
                </div>
            </div>
        `
    };
    
    const buyerEmail = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: buyer.email,
        subject: `⏰ Reminder: Pending Deal for ${itemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #f59e0b;">Pending Deal Reminder ⏰</h2>
                    <p style="color: #e2e8f0;">Hello ${buyer.username},</p>
                    <p style="color: #94a3b8;">You have a pending deal for <strong>${itemTitle}</strong> that has not been confirmed.</p>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <p style="color: #e2e8f0;">Seller: ${seller.username}</p>
                        <p style="color: #e2e8f0;">Interest shown on: ${new Date(item.interestCreatedAt).toLocaleDateString()}</p>
                    </div>
                    <p style="color: #94a3b8;">Please log in to your account and confirm the deal to complete the transaction.</p>
                    <a href="${itemLink}" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; border-radius: 50px;">View Deal</a>
                </div>
            </div>
        `
    };
    
    try {
        await Promise.all([
            transporter.sendMail(sellerEmail),
            transporter.sendMail(buyerEmail)
        ]);
        console.log(`Deal reminder emails sent for ${itemTitle} (reminder ${item.reminderCount + 1}/2)`);
    } catch (error) {
        console.error('Error sending deal reminder:', error);
    }
}

// Send stale interest notification
async function sendStaleInterestNotification(item, seller, isFood = false) {
    const itemType = isFood ? 'food stall' : 'product';
    const itemTitle = isFood ? item.vendorName : item.title;
    
    const email = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: seller.email,
        subject: `📦 Item Expired: ${itemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #ef4444;">Item Expired 📦</h2>
                    <p style="color: #e2e8f0;">Hello ${seller.username},</p>
                    <p style="color: #94a3b8;">Your <strong>${itemTitle}</strong> has been marked as expired due to no activity for 15 days.</p>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <p style="color: #e2e8f0;">Interest shown on: ${new Date(item.interestCreatedAt).toLocaleDateString()}</p>
                        <p style="color: #e2e8f0;">No deal confirmation received within the time period.</p>
                    </div>
                    <p style="color: #94a3b8;">The item has been removed from the marketplace. You can list it again if you still want to sell it.</p>
                    <a href="${process.env.BASE_URL}/marketplace/add-product" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #00d8ff, #008cff); color: white; text-decoration: none; border-radius: 50px;">List New Item</a>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(email);
        console.log(`Stale interest notification sent to ${seller.email} for ${itemTitle}`);
    } catch (error) {
        console.error('Error sending stale interest notification:', error);
    }
}

// Send deal confirmation notification (when user confirms in chat)
async function sendDealConfirmationNotification(item, confirmUser, otherUser, isFood = false) {
    const itemType = isFood ? 'food stall' : 'product';
    const itemTitle = isFood ? item.vendorName : item.title;
    const itemLink = isFood 
        ? `${process.env.BASE_URL}/nightmess/item/${item._id}`
        : `${process.env.BASE_URL}/marketplace/product/${item._id}`;
    
    const otherEmail = {
        from: `"VMedia Marketplace" <${process.env.EMAIL_USERNAME}>`,
        to: otherUser.email,
        subject: `🤝 Deal Update: ${itemTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a1a, #0f0f1a); border-radius: 20px;">
                <div style="text-align: center;">
                    <h2 style="color: #f97316;">Deal Update! 🤝</h2>
                    <p style="color: #e2e8f0;">Hello ${otherUser.username},</p>
                    <p style="color: #94a3b8;"><strong>${confirmUser.username}</strong> has confirmed the deal for <strong>${itemTitle}</strong>.</p>
                    <p style="color: #94a3b8;">Log in now to confirm the deal and complete the transaction.</p>
                    <a href="${itemLink}" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; border-radius: 50px;">Confirm Deal Now</a>
                </div>
            </div>
        `
    };
    
    try {
        await transporter.sendMail(otherEmail);
        console.log(`Deal confirmation notification sent to ${otherUser.email}`);
    } catch (error) {
        console.error('Error sending deal confirmation notification:', error);
    }
}

module.exports = {
    sendWelcomeEmail,
    sendInterestEmailToSeller,
    sendBuyerConfirmationEmail,
    sendAutoSoldNotification,
    sendDealReminder,
    sendStaleInterestNotification,
    sendDealConfirmationNotification
};