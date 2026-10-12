/**
 * Adire & Co - Store Owner Order Notification via Resend
 * Fully error-isolated: never throws uncaught exceptions.
 */

import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return null;
  }
  try {
    return new Resend(apiKey.trim());
  } catch (err) {
    console.warn('[email] Failed to initialize Resend:', err?.message || err);
    return null;
  }
}

/**
 * Sends a notification email to the store owner when an order is confirmed paid.
 * @param {object} order
 * @returns {Promise<{ success: boolean, id?: string }>}
 */
export async function sendOrderPaidEmail(order) {
  if (!order) return { success: false };

  const resend = getResendClient();
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL || 'orders@adireandco.com';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Adire & Co Orders <onboarding@resend.dev>';

  if (!resend) {
    console.log('[email] RESEND_API_KEY not configured. Skipping email notification for order:', order.reference);
    return { success: true };
  }

  const itemsHtml = (order.items || [])
    .map(
      (item, idx) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${idx + 1}. ${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${Number(item.price).toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₦${Number(item.lineTotal).toLocaleString()}</td>
        </tr>`
    )
    .join('');

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #1F3A93;">
        <h1 style="color: #1F3A93; margin: 0; font-size: 24px;">Adire & Co.</h1>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">New Paid Order Received (Lagos Atelier)</p>
      </div>

      <div style="padding: 20px 0;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #166534; font-weight: bold; font-size: 15px;">
            Payment Verified: ₦${Number(order.totalNaira).toLocaleString()}
          </p>
          <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">
            Reference: <span style="font-family: monospace; font-weight: bold;">${order.reference}</span>
          </p>
        </div>

        <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 16px;">Customer Details:</h3>
        <table style="width: 100%; font-size: 13px; margin-bottom: 20px;">
          <tr><td style="width: 130px; color: #64748b;">Full Name:</td><td><strong>${order.customer?.fullName || 'N/A'}</strong></td></tr>
          <tr><td style="color: #64748b;">Phone:</td><td><a href="tel:${order.customer?.phone}" style="color: #1F3A93; text-decoration: none;">${order.customer?.phone || 'N/A'}</a></td></tr>
          <tr><td style="color: #64748b;">Email:</td><td>${order.customer?.email || 'N/A'}</td></tr>
          <tr><td style="color: #64748b;">Delivery Address:</td><td>${order.customer?.address || 'N/A'}</td></tr>
          ${order.customer?.note ? `<tr><td style="color: #64748b;">Order Note:</td><td><em>"${order.customer.note}"</em></td></tr>` : ''}
        </table>

        <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 16px;">Order Items:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <thead>
            <tr style="background: #f8fafc; color: #475569; text-align: left;">
              <th style="padding: 8px;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Unit Price</th>
              <th style="padding: 8px; text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px solid #e2e8f0; padding-top: 10px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748b;">Subtotal:</span>
            <span>₦${Number(order.subtotalNaira).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Lagos Delivery Fee:</span>
            <span>₦${Number(order.deliveryFeeNaira).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #1F3A93; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <span>Total Paid:</span>
            <span>₦${Number(order.totalNaira).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8;">
        Adire & Co. Lagos, Nigeria &bull; Automated Payment Notification via Paystack
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject: `New Paid Order (${order.reference}) - ₦${Number(order.totalNaira).toLocaleString()} from ${order.customer?.fullName || 'Customer'}`,
      html: emailHtml,
    });

    if (error) {
      console.warn('[email] Resend send error:', error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.warn('[email] Error sending email via Resend:', err?.message || err);
    return { success: false };
  }
}
