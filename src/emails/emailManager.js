const { readFileSync } = require("fs");
const path = require("path");
// const Handlebars = require("handlebars");

const emailsDir = path.resolve(__dirname, "templates");

//Email send Otp Template
const emailOtpFile = readFileSync(
    path.join(emailsDir, "emailOtp.html"),
    {
      encoding: "utf8",
    }
);

module.exports = {
  emailOtpFile
};
