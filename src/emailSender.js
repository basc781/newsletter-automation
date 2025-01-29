const nodemailer = require('nodemailer');

async function sendEmail(htmlContent) {
    console.log('Setting up email transport...');
    console.log('Using email:', process.env.GMAIL_USER); // Will log email without showing full address

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        debug: true // Enable debug logging
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: 'bascouwenberg@livewallgroup.com',
        bcc: 'julotvansanten@livewallgroup.com, eelco@livewallgroup.com, milanbrock@livewallgroup.com, dionvanlitsenburg@livewallgroup.com, larshoeijmans@livewallgroup.com, aidangeggie@livewallgroup.com, dwikyvanbosstraten@livewallgroup.com, thijs@yourcrew.online, jarnovanoutvorst@livewallgroup.com, koen.w@100procent.email, julotvansanten@hotmail.com', // Add more cool peopl
        subject: `Tech News AI Digest - MACH8 -  ${new Date().toLocaleDateString()}`,
        html: htmlContent
    };

    try {
        console.log('Attempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Detailed error:', error);
        throw error;
    }
}

module.exports = { sendEmail }; 