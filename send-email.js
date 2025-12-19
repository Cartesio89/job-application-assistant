// Netlify Function: Send Email via SendGrid
// Path: netlify/functions/send-email.js

const sgMail = require('@sendgrid/mail');

// Set API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    try {
        const { to, from, subject, body, attachments } = JSON.parse(event.body);
        
        // Validate required fields
        if (!to || !from || !subject || !body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }
        
        // Prepare email message
        const msg = {
            to: to,
            from: from, // Must be verified in SendGrid
            subject: subject,
            text: body,
            attachments: attachments ? attachments.map(att => ({
                content: att.content, // Base64 encoded
                filename: att.filename,
                type: att.type,
                disposition: 'attachment'
            })) : []
        };
        
        // Send email
        await sgMail.send(msg);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'Email sent successfully',
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('SendGrid Error:', error);
        
        // Return error but don't expose sensitive info
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to send email',
                details: error.message 
            })
        };
    }
};
