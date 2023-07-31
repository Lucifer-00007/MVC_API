const NODEMAILER_CONFIG = {
    host: "smtp.gmail.com",
    domain: "gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: "files.backup.777@gmail.com",
        pass: "lxjezcwjggymzblh"
    },
    tls: {
        secure: false,
        ignoreTLS: true,
        rejectUnauthorized: false
    }
};

module.exports = { NODEMAILER_CONFIG, };