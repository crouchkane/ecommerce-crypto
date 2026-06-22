const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

const sendVerificationEmail = async (email, verificationLink) => {
  const html = `
    <h2>Email Verification</h2>
    <p>Click the link below to verify your email:</p>
    <a href="${verificationLink}">Verify Email</a>
    <p>Link expires in 24 hours.</p>
  `;
  await sendEmail(email, 'Email Verification', html);
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const html = `
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>Link expires in 1 hour.</p>
  `;
  await sendEmail(email, 'Password Reset', html);
};

const sendOrderConfirmationEmail = async (email, order) => {
  const html = `
    <h2>Order Confirmation</h2>
    <p>Order Number: ${order.order_number}</p>
    <p>Total: $${order.total}</p>
    <p>Status: ${order.status}</p>
    <p>Thank you for your purchase!</p>
  `;
  await sendEmail(email, 'Order Confirmation', html);
};

const sendPaymentSubmittedEmail = async (email, orderNumber) => {
  const html = `
    <h2>Payment Submitted</h2>
    <p>Your payment proof for order ${orderNumber} has been received.</p>
    <p>Our team will review it shortly.</p>
  `;
  await sendEmail(email, 'Payment Submitted', html);
};

const sendPaymentApprovedEmail = async (email, orderNumber) => {
  const html = `
    <h2>Payment Approved</h2>
    <p>Your payment for order ${orderNumber} has been approved.</p>
    <p>Your order is now being processed.</p>
  `;
  await sendEmail(email, 'Payment Approved', html);
};

const sendPaymentRejectedEmail = async (email, orderNumber, reason) => {
  const html = `
    <h2>Payment Rejected</h2>
    <p>Your payment for order ${orderNumber} has been rejected.</p>
    <p>Reason: ${reason}</p>
    <p>Please submit a new payment proof.</p>
  `;
  await sendEmail(email, 'Payment Rejected', html);
};

const sendOrderStatusUpdateEmail = async (email, orderNumber, status) => {
  const html = `
    <h2>Order Status Update</h2>
    <p>Your order ${orderNumber} status has been updated to: ${status}</p>
  `;
  await sendEmail(email, 'Order Status Update', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendPaymentSubmittedEmail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendOrderStatusUpdateEmail,
};
