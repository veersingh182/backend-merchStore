// backend/emailService.js
const nodemailer = require('nodemailer');
const PlaceOrder = require('../Models/PlaceOrder');

// Create a transporter using your email service provider's SMTP settings
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'Gmail', 'Outlook', etc.
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Function to send an email to the customer with rating form
const sendEmailToCustomer = async (orderId) => {
  try {
    const order = await PlaceOrder.findOne({ orderId });

    if (!order) {
      throw new Error('Order not found');
    }
    const customerEmail = order.Email;
    const mailOptions = {
      from: process.env.GMAIL_USEREmail,
      to: customerEmail,
      subject: 'Delivery Feedback',
      html: `
        <h1>Thank you for your recent purchase!</h1>
        <p>We hope you're enjoying your product. Please take a moment to rate your delivery experience:</p>
        <form action="http://your_backend_url/rate-delivery" method="POST">
          <input type="hidden" name="orderId" value="${deliveryDetails.orderId}">
          <label>
            <input type="radio" name="rating" value="1"> 1 Star
          </label>
          <label>
            <input type="radio" name="rating" value="2"> 2 Stars
          </label>
          <label>
            <input type="radio" name="rating" value="3"> 3 Stars
          </label>
          <label>
            <input type="radio" name="rating" value="4"> 4 Stars
          </label>
          <label>
            <input type="radio" name="rating" value="5"> 5 Stars
          </label>
          <br>
          <button type="submit">Submit Rating</button>
        </form>
        <p>Thank you for your feedback!</p>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendEmailToCustomer };
