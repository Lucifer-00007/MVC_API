const nodemailer = require("nodemailer");
const { readFileSync } = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const { NODEMAILER_CONFIG } = require("../config");

//Email transporter
const transporter = nodemailer.createTransport(NODEMAILER_CONFIG);

async function emailManager(options) {
  await transporter.verify();

  return await transporter.sendMail(options);
}

const emailsDir = path.resolve(__dirname, "templates");

//Signup Welcome -  name ,url(whrool.com/play-stattion)
//signup otp -  otp, name
//Reset pin otp - otp, name
//Reset Success - name , url (whrool.com)
//payment succes - name, invoice data
//payment failure - name, try again(whrool.com/subscription),login(whrool.com)
//payment reminder - name invoice data, renew(whrool.com/subscription), login(whrool.com)

//Emails
//------------------------------------------------------------------------------------//

//Email Confirmation Otp Template
const sendSignupConfirmationOtp = async ({to, otp, name}) => {
  const emailFile = readFileSync(
    path.join(emailsDir, "email_confirmation.html"),
    {
      encoding: "utf8",
    }
  );
  const emailTemplate = Handlebars.compile(emailFile);
  const defaultPayload = {
    from: "whrool21@gmail.com",
    subject: "Signup Confirmation OTP | Whrool.com",
    to,
    html: emailTemplate({
      otp,
      name,
    }),
  };
  return await emailManager(defaultPayload);
};

//Reset Pin otp Template
const sendResetPinOtp = async ({to, otp, name}) => {
  const emailFile = readFileSync(path.join(emailsDir, "reset_pin.html"), {
    encoding: "utf8",
  });
  const emailTemplate = Handlebars.compile(emailFile);
  const defaultPayload = {
    from: "whrool21@gmail.com",
    subject: "Reset Pin OTP | Whrool.com",
    to,
    html: emailTemplate({
      otp,
      name,
    }),
  };
  return await emailManager(defaultPayload);
};

//Payment Success Template
const sendPaymentSuccessEmail = async (
  to,
  name,
  invoiceId,
  description,
  purchaseDate,
  dueDate,
  total
) => {
  const emailFile = readFileSync(path.join(emailsDir, "payment_success.html"), {
    encoding: "utf8",
  });
  const emailTemplate = Handlebars.compile(emailFile);
  const defaultPayload = {
    from: "whrool21@gmail.com",
    subject: "Payment Successfull | Whrool.com",
    to,
    html: emailTemplate({
      name,
      invoiceId,
      description,
      purchaseDate,
      dueDate,
      total,
    }),
  };
  return await emailManager(defaultPayload);
};

//Payment Failure Template
const sendPaymentFailureEmail = async (to, name, amount, paymentId) => {
  const emailFile = readFileSync(path.join(emailsDir, "payment_failure.html"), {
    encoding: "utf8",
  });
  const emailTemplate = Handlebars.compile(emailFile);
  const defaultPayload = {
    from: "whrool21@gmail.com",
    subject: "Payment Failed!! | Whrool.com",
    to,
    html: emailTemplate({
      name,
      amount,
      paymentId,
    }),
  };
  return await emailManager(defaultPayload);
};

const sendPaymentReminderEmail = async (to,name,description,dueDate) => {
  const emailFile = readFileSync(path.join(emailsDir, "payment_reminder.html"), {
    encoding: "utf8",
  });
  const emailTemplate = Handlebars.compile(emailFile);
  const defaultPayload = {
    from: "whrool21@gmail.com",
    subject: "Payment Reminder!! | Whrool.com",
    to,
    html: emailTemplate({
      name,
      description,
      dueDate,
    }),
  };
  return await emailManager(defaultPayload);
}



//Otp Email
//Legacy Code
//---------------------------------------------
const sendContactUsEmail = async ({to,name,email,mobile_no,location,message})=>{
  const defaultPayload = {
    from: "whrool21@gmail.com",
    subject: `${name} is Contacting You | Whrool.com`,
    to,
    text: `${name} \n ${email} \n ${mobile_no} \n ${location} \n ${message}`
    // html: emailTemplate({
    //   otp,
    //   name,
    // }),
  };
  return await emailManager(defaultPayload);
}

const sendOtpEmail = async (payload) => {
  const defaultPayload = {
    from: "whrool21@gmail.com",
    subject: "Whrool.com Signup OTP",
    //text:"Default OTP is 123456"
  };
  return await emailManager({ ...defaultPayload, ...payload });
};

//Confirmation Email
//---------------------------------------------
const sendConfirmationEmail = () => {};

//Alert Emails
//--------------------------------------------

//Support Emails
//--------------------------------------------

module.exports = {
  sendOtpEmail,
  sendResetPinOtp,
  sendSignupConfirmationOtp,
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
  sendPaymentReminderEmail,
  sendContactUsEmail
};
