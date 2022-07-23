const sgMail = require('@sendgrid/mail');

const sendgridAPIKey = process.env.SENDGRID_API_KEY;
const sendgridFrom = process.env.SENDGRID_FROM;

sgMail.setApiKey(sendgridAPIKey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: sendgridFrom,
    subject: 'Welcome to the task manager app',
    text: `Hello, ${name}. Welcome to the task manager app!`
  });
};

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: sendgridFrom,
    subject: 'I\'ll miss you! Sad to see you go, miss you already!',
    text: `We're so happy for you, but so sad to see you go, ${name}...`
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};
