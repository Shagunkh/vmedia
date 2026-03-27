const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "vitforall2025@gmail.com",
        pass: "oxdfqvuwkzxqyylo"
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email transporter ready');
    }
});

// Helper function to format currency
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
};

// Send email to seller when someone is interested
const sendInterestEmailToSeller = async (product, buyer, seller) => {
    const productUrl = `${process.env.BASE_URL}/marketplace/product/${product._id}`;
    const formattedPrice = formatPrice(product.price);
    
    const mailOptions = {
        from: `"VMALL Marketplace" <vitforall2025@gmail.com>`,
        to: seller.email,
        subject: `🔔 New Interest! ${buyer.username} wants to buy ${product.title}`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Interest - VMALL</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 40px 20px;
                    }
                    
                    .email-wrapper {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        animation: fadeIn 0.5s ease-out;
                    }
                    
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    /* Header Section */
                    .email-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 40px 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .email-header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -20%;
                        width: 200px;
                        height: 200px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 50%;
                    }
                    
                    .email-header::after {
                        content: '';
                        position: absolute;
                        bottom: -30%;
                        left: -10%;
                        width: 300px;
                        height: 300px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 50%;
                    }
                    
                    .header-icon {
                        width: 80px;
                        height: 80px;
                        background: rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                        animation: pulse 2s infinite;
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    
                    .header-icon svg {
                        width: 40px;
                        height: 40px;
                    }
                    
                    .email-header h1 {
                        color: white;
                        font-size: 32px;
                        font-weight: 800;
                        margin-bottom: 10px;
                        letter-spacing: -0.5px;
                    }
                    
                    .email-header p {
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 16px;
                    }
                    
                    /* Content Section */
                    .email-content {
                        padding: 40px 30px;
                    }
                    
                    .greeting {
                        margin-bottom: 30px;
                    }
                    
                    .greeting h2 {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 8px;
                    }
                    
                    .greeting p {
                        color: #6b7280;
                        font-size: 16px;
                    }
                    
                    /* Product Card */
                    .product-card {
                        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
                        border-radius: 20px;
                        overflow: hidden;
                        margin: 30px 0;
                        border: 1px solid #e5e7eb;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }
                    
                    .product-image {
                        width: 100%;
                        height: 280px;
                        object-fit: cover;
                        background: #f3f4f6;
                    }
                    
                    .product-details {
                        padding: 24px;
                    }
                    
                    .product-title {
                        font-size: 22px;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 12px;
                    }
                    
                    .product-description {
                        color: #6b7280;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-bottom: 16px;
                    }
                    
                    .product-price {
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 8px 20px;
                        border-radius: 40px;
                        font-size: 20px;
                        font-weight: 700;
                    }
                    
                    /* Buyer Info Card */
                    .info-card {
                        background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
                        border-radius: 20px;
                        padding: 24px;
                        margin: 30px 0;
                        border-left: 4px solid #f59e0b;
                    }
                    
                    .info-card h3 {
                        font-size: 18px;
                        font-weight: 700;
                        color: #92400e;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .info-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 0;
                        border-bottom: 1px solid rgba(245, 158, 11, 0.2);
                    }
                    
                    .info-item:last-child {
                        border-bottom: none;
                    }
                    
                    .info-icon {
                        width: 40px;
                        height: 40px;
                        background: white;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .info-icon svg {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .info-text {
                        flex: 1;
                    }
                    
                    .info-label {
                        font-size: 12px;
                        color: #92400e;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        font-weight: 600;
                    }
                    
                    .info-value {
                        font-size: 16px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-top: 2px;
                    }
                    
                    /* Button */
                    .cta-button {
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-decoration: none;
                        padding: 14px 32px;
                        border-radius: 50px;
                        font-weight: 600;
                        font-size: 16px;
                        margin: 20px 0;
                        transition: all 0.3s ease;
                        text-align: center;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    
                    .cta-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                    }
                    
                    /* Safety Tips */
                    .safety-tips {
                        background: #f3f4f6;
                        border-radius: 16px;
                        padding: 20px;
                        margin: 30px 0 20px;
                    }
                    
                    .safety-tips h4 {
                        font-size: 14px;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .safety-tips ul {
                        margin-left: 20px;
                        color: #6b7280;
                        font-size: 13px;
                    }
                    
                    .safety-tips li {
                        margin: 8px 0;
                    }
                    
                    /* Footer */
                    .email-footer {
                        background: #f9fafb;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    }
                    
                    .footer-links {
                        margin-bottom: 20px;
                    }
                    
                    .footer-links a {
                        color: #667eea;
                        text-decoration: none;
                        font-size: 13px;
                        margin: 0 10px;
                    }
                    
                    .footer-links a:hover {
                        text-decoration: underline;
                    }
                    
                    .copyright {
                        color: #9ca3af;
                        font-size: 12px;
                    }
                    
                    @media (max-width: 600px) {
                        .email-wrapper {
                            border-radius: 16px;
                        }
                        
                        .email-content {
                            padding: 24px 20px;
                        }
                        
                        .product-image {
                            height: 200px;
                        }
                        
                        .product-title {
                            font-size: 18px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <!-- Header -->
                    <div class="email-header">
                        <div class="header-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h1>🎉 New Interest!</h1>
                        <p>Someone wants to buy your item</p>
                    </div>
                    
                    <!-- Content -->
                    <div class="email-content">
                        <div class="greeting">
                            <h2>Hello ${seller.username}!</h2>
                            <p><strong>${buyer.username}</strong> is interested in your product. Here are the details:</p>
                        </div>
                        
                        <!-- Product Card -->
                        <div class="product-card">
                           
                                <h3 class="product-title">${product.title}</h3>
                                <p class="product-description">${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}</p>
                                <div class="product-price">${formattedPrice}</div>
                            </div>
                        </div>
                        
                        <!-- Buyer Information -->
                        <div class="info-card">
                            <h3>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#92400e" stroke-width="2" stroke-linecap="round"/>
                                    <circle cx="12" cy="7" r="4" stroke="#92400e" stroke-width="2"/>
                                </svg>
                                Buyer Contact Information
                            </h3>
                            <div class="info-item">
                                
                                <div class="info-text">
                                    <div class="info-label">Name</div>
                                    <div class="info-value">${buyer.username}</div>
                                </div>
                            </div>
                            <div class="info-item">
                               
                                <div class="info-text">
                                    <div class="info-label">Email</div>
                                    <div class="info-value">${buyer.email}</div>
                                </div>
                            </div>
                            <div class="info-item">
                               
                                <div class="info-text">
                                    <div class="info-label">Mobile</div>
                                    <div class="info-value">${buyer.phone || 'Not provided'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- CTA Button -->
                        <a href="${productUrl}" class="cta-button">
                            View Product & Start Chat → 
                        </a>
                        
                        <!-- Safety Tips -->
                        <div class="safety-tips">
                            <h4>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="#f59e0b" stroke-width="2"/>
                                    <path d="M3 12L12 17L21 12" stroke="#f59e0b" stroke-width="2"/>
                                    <path d="M3 17L12 22L21 17" stroke="#f59e0b" stroke-width="2"/>
                                </svg>
                                Safety Tips
                            </h4>
                            <ul>
                                <li>✓ Always meet in a safe, public location</li>
                                <li>✓ Verify the product condition before payment</li>
                                <li>✓ Use secure payment methods</li>
                                <li>✓ Never share sensitive personal information</li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="email-footer">
                        <div class="footer-links">
                            <a href="${process.env.BASE_URL}">Marketplace</a>
                            <a href="${process.env.BASE_URL}/aboutus">About Us</a>
                            <a href="${process.env.BASE_URL}/contact">Contact</a>
                        </div>
                        <div class="copyright">
                            <p>This is an automated message from VMALL Marketplace</p>
                            <p>&copy; 2024 VMALL - Campus Marketplace. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Interest email sent to seller: ${seller.email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email to seller:', error);
        return false;
    }
};

// Send email to buyer with seller details
const sendBuyerConfirmationEmail = async (product, buyer, seller) => {
    const productUrl = `${process.env.BASE_URL}/marketplace/product/${product._id}`;
    const formattedPrice = formatPrice(product.price);
    
    const mailOptions = {
        from: `"VMALL Marketplace" <vitforall2025@gmail.com>`,
        to: buyer.email,
        subject: `Interest Confirmed! ${product.title}`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Interest Confirmed - VMALL</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 40px 20px;
                    }
                    
                    .email-wrapper {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                        animation: fadeIn 0.5s ease-out;
                    }
                    
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .email-header {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        padding: 40px 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .email-header::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -20%;
                        width: 200px;
                        height: 200px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 50%;
                    }
                    
                    .header-icon {
                        width: 80px;
                        height: 80px;
                        background: rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                        animation: bounce 1s ease;
                    }
                    
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    
                    .email-header h1 {
                        color: white;
                        font-size: 32px;
                        font-weight: 800;
                        margin-bottom: 10px;
                    }
                    
                    .email-header p {
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 16px;
                    }
                    
                    .email-content {
                        padding: 40px 30px;
                    }
                    
                    .greeting {
                        margin-bottom: 30px;
                    }
                    
                    .greeting h2 {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 8px;
                    }
                    
                    .product-card {
                        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
                        border-radius: 20px;
                        overflow: hidden;
                        margin: 30px 0;
                        border: 1px solid #e5e7eb;
                    }
                    
                    .product-image {
                        width: 100%;
                        height: 280px;
                        object-fit: cover;
                    }
                    
                    .product-details {
                        padding: 24px;
                    }
                    
                    .product-title {
                        font-size: 22px;
                        font-weight: 700;
                        color: #1f2937;
                        margin-bottom: 12px;
                    }
                    
                    .product-description {
                        color: #6b7280;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-bottom: 16px;
                    }
                    
                    .product-price {
                        display: inline-block;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        padding: 8px 20px;
                        border-radius: 40px;
                        font-size: 20px;
                        font-weight: 700;
                    }
                    
                    .info-card {
                        background: linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%);
                        border-radius: 20px;
                        padding: 24px;
                        margin: 30px 0;
                        border-left: 4px solid #667eea;
                    }
                    
                    .info-card h3 {
                        font-size: 18px;
                        font-weight: 700;
                        color: #5b21b6;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .info-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 0;
                        border-bottom: 1px solid rgba(102, 126, 234, 0.2);
                    }
                    
                    .info-item:last-child {
                        border-bottom: none;
                    }
                    
                    .info-icon {
                        width: 40px;
                        height: 40px;
                        background: white;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .info-text {
                        flex: 1;
                    }
                    
                    .info-label {
                        font-size: 12px;
                        color: #5b21b6;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        font-weight: 600;
                    }
                    
                    .info-value {
                        font-size: 16px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-top: 2px;
                    }
                    
                    .cta-button {
                        display: inline-block;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        text-decoration: none;
                        padding: 14px 32px;
                        border-radius: 50px;
                        font-weight: 600;
                        font-size: 16px;
                        margin: 20px 0;
                        transition: all 0.3s ease;
                        text-align: center;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    
                    .cta-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
                    }
                    
                    .safety-tips {
                        background: #fef3c7;
                        border-radius: 16px;
                        padding: 20px;
                        margin: 30px 0 20px;
                    }
                    
                    .safety-tips h4 {
                        font-size: 14px;
                        font-weight: 700;
                        color: #92400e;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .safety-tips ul {
                        margin-left: 20px;
                        color: #92400e;
                        font-size: 13px;
                    }
                    
                    .safety-tips li {
                        margin: 8px 0;
                    }
                    
                    .email-footer {
                        background: #f9fafb;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    }
                    
                    .footer-links {
                        margin-bottom: 20px;
                    }
                    
                    .footer-links a {
                        color: #10b981;
                        text-decoration: none;
                        font-size: 13px;
                        margin: 0 10px;
                    }
                    
                    .copyright {
                        color: #9ca3af;
                        font-size: 12px;
                    }
                    
                    @media (max-width: 600px) {
                        .email-wrapper {
                            border-radius: 16px;
                        }
                        
                        .email-content {
                            padding: 24px 20px;
                        }
                        
                        .product-image {
                            height: 200px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="email-header">
                        <div class="header-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h1>Interest Confirmed!</h1>
                        <p>Your interest has been sent to the seller</p>
                    </div>
                    
                    <div class="email-content">
                        <div class="greeting">
                            <h2>Hello ${buyer.username}!</h2>
                            <p>You've successfully shown interest in:</p>
                        </div>
                        
                        <div class="product-card">
                            
                            <div class="product-details">
                                <h3 class="product-title">${product.title}</h3>
                                <p class="product-description">${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}</p>
                                <div class="product-price">${formattedPrice}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <h3>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#5b21b6" stroke-width="2"/>
                                    <circle cx="12" cy="7" r="4" stroke="#5b21b6" stroke-width="2"/>
                                </svg>
                                Seller Contact Information
                            </h3>
                            <div class="info-item">
                               
                                <div class="info-text">
                                    <div class="info-label">Name</div>
                                    <div class="info-value">${seller.username}</div>
                                </div>
                            </div>
                            <div class="info-item">
                               
                                <div class="info-text">
                                    <div class="info-label">Email</div>
                                    <div class="info-value">${seller.email}</div>
                                </div>
                            </div>
                            <div class="info-item">
                                
                                <div class="info-text">
                                    <div class="info-label">Mobile</div>
                                    <div class="info-value">${product.sellerPhone || 'Not provided'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <a href="${productUrl}" class="cta-button">
                            View Product & Start Chat →
                        </a>
                        
                        <div class="safety-tips">
                            <h4>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="#f59e0b" stroke-width="2"/>
                                    <path d="M3 12L12 17L21 12" stroke="#f59e0b" stroke-width="2"/>
                                    <path d="M3 17L12 22L21 17" stroke="#f59e0b" stroke-width="2"/>
                                </svg>
                                Safety Tips
                            </h4>
                            <ul>
                                <li>✓ Always meet in a safe, public location</li>
                                <li>✓ Verify the product condition before payment</li>
                                <li>✓ Use secure payment methods</li>
                                <li>✓ Never share sensitive personal information</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="email-footer">
                        <div class="footer-links">
                            <a href="${process.env.BASE_URL}">Marketplace</a>
                            <a href="${process.env.BASE_URL}/aboutus">About Us</a>
                            <a href="${process.env.BASE_URL}/contact">Contact</a>
                        </div>
                        <div class="copyright">
                            <p>This is an automated message from VMALL Marketplace</p>
                            <p>&copy; 2024 VMALL - Campus Marketplace. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent to buyer: ${buyer.email}`);
        return true;
    } catch (error) {
        console.error(' Error sending email to buyer:', error);
        return false;
    }
};

module.exports = {
    sendInterestEmailToSeller,
    sendBuyerConfirmationEmail
};