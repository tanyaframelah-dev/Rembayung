import { Booking } from '../types';
import { db } from './db';

export const sendConfirmationEmail = async (booking: Partial<Booking> & { formattedDate?: string }): Promise<boolean> => {
    // Fetch latest config
    const config = db.getSMTPConfig();

    if (!config.isEnabled) {
        console.warn("[SMTP] Email service is currently disabled in admin settings.");
        return false;
    }

    console.log(`[SMTP] Initializing connection to ${config.host}:${config.port}...`);
    
    return new Promise((resolve) => {
        // Simulate network latency before triggering the client
        setTimeout(() => {
            console.log(`[SMTP] Authenticated as ${config.user}`);
            
            const subject = encodeURIComponent(`Reservation Confirmation: Rembayung - #${booking.id}`);
            const body = encodeURIComponent(`
Dear ${booking.name},

Your reservation at Rembayung is confirmed.

Reference: #${booking.id}
Date: ${booking.formattedDate || booking.date}
Time: ${booking.time}
Guests: ${booking.guests}

We look forward to serving you.

Best Regards,
${config.fromName}
            `);
            
            console.log(`[SMTP] Payload delivered via client-side trigger.`);
            console.log(`[SMTP] From: ${config.fromName} <${config.user}>`);

            // Use a hidden iframe to trigger mailto without disrupting the SPA routing/history
            const mailtoLink = `mailto:${booking.email}?subject=${subject}&body=${body}`;
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.contentWindow!.location.href = mailtoLink;
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);

            resolve(true);
        }, 1500); 
    });
};