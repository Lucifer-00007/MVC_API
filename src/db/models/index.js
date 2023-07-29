//all modules
// module.exports = {

//     Id: require('./id.model'),
//     Admin: require('./admin/admin.model'),
//     Interest: require('./interest/interest.model'),
//     Profession: require('./profession/profession.model'),
//     Qualification: require('./qualification/qualification.model'),
//     City: require('./city/city.model'),
//     Permission: require('./permission/permission.model'),
//     Payment: require('./subscription/payment.model'),
//     VerificationRequest: require('./request/verification.model'),
//     ResetPasswordRequest: require('./request/resetPassword.model'),
//     Coupon: require('./subscription/coupon.model'),
//     Ticket: require('./support/ticket.model'),
//     Token: require('./token.model'),
//     SkippedUser: require('./interaction/skip.model'),

//     Message: require('./chat/message.model'),
//     ReportedUser: require('./report/reported.model'),
//     ImageRejectionReason: require('./imageRejectionReason/imageRejection.model'),
//     Broadcast: require('./broadcast/broadcast.model'),
//     PaymentTable: require('./subscription/paymentTable.model'),

//     //Not sure or merge in user
//     Plan: require('./subscription/plan.model'),
//     User: require('./user.model')
// }


module.exports = {
    User: require('./user.model'),
    VerificationRequest: require('./verification.model'),
    Token: require('./token.model'),
}

