import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: 'Missing order details' });
  }

  try {
    let transporter;

    // Load SMTP settings from env if present
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback: Create dynamic test account on Ethereal Email for instant local testing
      console.log("Creating test SMTP credentials on smtp.ethereal.email...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const emailFrom = process.env.EMAIL_FROM || '"Kids Paradise" <no-reply@kidsparadise.com.bd>';

    // Responsive, high-grade HTML template optimized for standard desktop and mobile email clients
    const buildEmailHtml = (titleMessage) => {
      const dateStr = new Date(order.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Invoice #${order.id}</title>
          <style type="text/css">
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #eee; }
            .banner-msg { background-color: #fdf2f5; border: 1px solid #fbdce3; color: #e92c5d; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-weight: bold; font-size: 14px; text-align: center; }
            .logo-container img { height: 45px; object-fit: contain; }
            .store-details { font-size: 12px; color: #666; line-height: 1.5; margin: 5px 0 0; }
            .invoice-title { font-size: 22px; font-weight: bold; color: #333; margin: 0 0 5px 0; text-align: right; }
            .invoice-meta { font-size: 12px; color: #666; text-align: right; margin: 0; line-height: 1.5; }
            .bill-to { background: #fdfdfd; padding: 15px; border-radius: 8px; border: 1px solid #f0f0f0; margin-bottom: 25px; margin-top: 15px; }
            .bill-to h3 { margin: 0 0 6px 0; color: #e92c5d; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .bill-to p { margin: 2px 0; font-size: 13px; line-height: 1.4; color: #444; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 10px 5px; font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold; }
            td { padding: 10px 5px; border-bottom: 1px solid #eee; font-size: 13px; color: #444; }
            .variant-text { font-size: 11px; color: #888; margin-top: 2px; }
            .totals-container { width: 100%; max-width: 250px; margin-left: auto; margin-bottom: 20px; }
            .row { display: table; width: 100%; padding: 4px 0; font-size: 13px; }
            .col-label { display: table-cell; text-align: left; color: #666; }
            .col-val { display: table-cell; text-align: right; color: #333; font-weight: bold; }
            .total-row { border-top: 2px solid #eee; padding-top: 10px; margin-top: 8px; font-size: 15px; font-weight: bold; }
            .total-row .col-label { color: #e92c5d; }
            .total-row .col-val { color: #e92c5d; font-weight: bold; }
            .footer { border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 11px; color: #999; margin-top: 30px; }
            .footer a { color: #e92c5d; text-decoration: none; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="banner-msg">
              ${titleMessage}
            </div>
            
            <table style="width: 100%; margin-bottom: 15px;">
              <tr>
                <td style="border: none; padding: 0; vertical-align: top; width: 50%;">
                  <div class="logo-container">
                    <img src="https://kidsparadise.com.bd/wp-content/uploads/2026/08/kp-logo-1.1.png" alt="Kids Paradise" />
                  </div>
                  <p class="store-details">
                    <strong>Address:</strong> Pallabi Mirpur 11.5 Bus Stand, Dhaka-1216<br />
                    <strong>Mobile:</strong> 01797007260<br />
                    <strong>Email:</strong> support@kidsparadise.com.bd
                  </p>
                </td>
                <td style="border: none; padding: 0; vertical-align: top; text-align: right; width: 50%;">
                  <h2 class="invoice-title">INVOICE</h2>
                  <p class="invoice-meta">
                    <strong>Order:</strong> #${order.id}<br />
                    <strong>Date:</strong> ${dateStr}<br />
                    <strong>Status:</strong> ${order.status}
                  </p>
                </td>
              </tr>
            </table>

            <div class="bill-to">
              <h3>Bill To</h3>
              <p><strong>${order.customerName}</strong></p>
              <p>${[order.customerAddress, order.customerArea, order.customerDistrict].filter(Boolean).join(', ')}</p>
              <p>${order.customerPhone}</p>
              <p>${order.customerEmail || ''}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center; width: 40px;">Qty</th>
                  <th style="text-align: right; width: 70px;">Price</th>
                  <th style="text-align: right; width: 70px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.name}</strong>
                      ${item.selectedVariantName ? `<div class="variant-text">${item.selectedVariantName}</div>` : ''}
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">৳${item.price.toFixed(2)}</td>
                    <td style="text-align: right;">৳${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals-container">
              <div class="row">
                <span class="col-label">Subtotal:</span>
                <span class="col-val">৳${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="col-label">Shipping:</span>
                <span class="col-val">৳${order.shippingCost.toFixed(2)}</span>
              </div>
              ${order.discount > 0 ? `
              <div class="row" style="color: #e92c5d">
                <span class="col-label">Discount:</span>
                <span class="col-val">-৳${order.discount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="row total-row">
                <span class="col-label">Total:</span>
                <span class="col-val">৳${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for shopping with <a href="https://www.kidsparadise.com.bd">Kids Paradise</a>!</p>
              <p style="font-size: 10px; margin-top: 10px; color: #ccc;">This is an automated transaction confirmation. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
      </html>
      `;
    };

    const adminEmail = 'msmraqeeb@gmail.com';
    const customerEmail = order.customerEmail;

    // 1. Send Email to Customer
    const customerSubject = `🛍️ Order Confirmed! Invoice #${order.id} - Kids Paradise`;
    const customerTitle = `Thank you for your order, ${order.customerName}! Your invoice details are listed below.`;
    
    let customerMailOptions = {
      from: emailFrom,
      to: customerEmail,
      subject: customerSubject,
      html: buildEmailHtml(customerTitle)
    };

    const customerInfo = await transporter.sendMail(customerMailOptions);
    console.log(`Email sent to Customer (${customerEmail}): ${customerInfo.messageId}`);
    const customerPreview = !process.env.SMTP_HOST ? nodemailer.getTestMessageUrl(customerInfo) : null;
    if (customerPreview) {
      console.log(`Customer Email Preview Link: ${customerPreview}`);
    }

    // 2. Send Email to Admin
    const adminSubject = `🔔 New Order Received! Invoice #${order.id} - Kids Paradise`;
    const adminTitle = `New Order Alert! Invoice #${order.id} has been placed by ${order.customerName}.`;

    let adminMailOptions = {
      from: emailFrom,
      to: adminEmail,
      subject: adminSubject,
      html: buildEmailHtml(adminTitle)
    };

    const adminInfo = await transporter.sendMail(adminMailOptions);
    console.log(`Email sent to Admin (${adminEmail}): ${adminInfo.messageId}`);
    const adminPreview = !process.env.SMTP_HOST ? nodemailer.getTestMessageUrl(adminInfo) : null;
    if (adminPreview) {
      console.log(`Admin Email Preview Link: ${adminPreview}`);
    }

    res.status(200).json({
      success: true,
      message: 'Invoices sent successfully',
      customerMessageId: customerInfo.messageId,
      adminMessageId: adminInfo.messageId,
      testPreviewCustomer: customerPreview,
      testPreviewAdmin: adminPreview
    });

  } catch (error) {
    console.error('Error sending invoice emails:', error);
    res.status(500).json({ error: 'Failed to send invoice emails', details: error.message });
  }
}
