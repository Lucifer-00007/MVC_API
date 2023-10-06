const {
    Payment,
    User,
    City,
    PaymentTable,
    Coupon,
    Plan,
    Id,
  } = require("../../db/models");
  const Razorpay = require("razorpay");
  const crypto = require("crypto");
  const { AddDaysToDate } = require("../../libs/time");
  
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });
  
  const PaymentController = {
    redirect: async (req, res) => {
      try {
        // res.status(200).redirect(`https://payments.squbesoftsol.com?name=sachin`);
        res.status(200).redirect(`http://192.168.1.124:3002?name=sachin`);
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    },
    createOrder: async (req, res) => {
      try {
        //Authentication
  
        const { plan_type, coupon_name } = req.body;
        console.log(req.user);
        //Validation
        if (!plan_type) {
          throw new Error("plan_type is missing in body!");
        }
  
        //Getting the user from db
        const user = await User.findById(req.user._id);
        let paymentCondition;
        if (user.age >= 18 && user.age < 25) paymentCondition = { C1824: 1 };
        if (user.age >= 25 && user.age < 31) paymentCondition = { C2530: 1 };
        if (user.age >= 31 && user.age < 46) paymentCondition = { C3145: 1 };
        if (user.age >= 46 && user.age < 61) paymentCondition = { C4660: 1 };
        if (user.age >= 61) paymentCondition = { C61: 1 };
  
        //Payment Table based on user age
        const payinfo = await PaymentTable.findOne({}, paymentCondition);
        if (!payinfo) {
          throw new Error("payinfo not found");
        }
  
        //Getting amount based on user planType
        let planAmount = payinfo[Object.keys(paymentCondition)[0]].get(plan_type);
  
        //multiply amount with time period
        if (plan_type === "QUARTERLY") planAmount *= 3;
        if (plan_type === "HALFYEARLY") planAmount *= 6;
        if (plan_type === "YEARLY") planAmount *= 12;
  
        //Applying Coupon if any
        const coupon = await Coupon.findOne({ name: coupon_name });
  
        //initially coupon amount will be ZERO
        let couponAmount = 0;
        let couponDetails = {
          isApplied: false,
          code: "NONE",
          amount: 0,
        };
  
        if (coupon) {
          //checking coupon type(amount/percentage)
          coupon.isPercentage
            ? //percentage based coupon
              (couponAmount = Math.floor((coupon.amount * planAmount) / 100))
            : //amount based coupon
              (couponAmount = coupon.amount);
          //setting coupon details
          couponDetails.isApplied = true;
          couponDetails.code = coupon?.name;
          couponDetails.amount = couponAmount;
        }
  
        const notes = [
          `${plan_type} PLAN`,
          couponAmount > 0 ? coupon?.name : "No Coupon",
        ];
  
        //Subtracting Coupon Amount from
        const initialAmount = planAmount;
        const amountAfterDiscount = planAmount - couponAmount;
        const taxAmount = Math.floor((amountAfterDiscount * 18) / (100 + 18));
  
        const currency = "INR";
  
        const options = {
          amount: amountAfterDiscount * 100,
          currency,
          receipt: `user ${Math.floor(Math.random() * 1000)}`,
          notes,
        };
  
        const response = await razorpay.orders.create(options);
  
        await Payment.create({
          userId: req.user._id,
          planType: plan_type,
          orderId: response.id,
          initialAmount,
          amountAfterDiscount,
          taxAmount,
          finalAmount: response.amount,
          currency: response.currency,
          coupon: couponDetails,
        });
  
        // res.writeHead(301,{Location:"http://localhost:3002/"})
        // res.status(200).redirect(`http://192.168.1.124:3002?name=sachin`);
        // res.status(301).redirect(`http://localhost:3002`);
        // res.status(200).redirect(`http://google.com`);
        res
          .status(200)
          .json({
            success: true,
            data: {
              order_id: response.id,
              currency: response.currency,
              amount: response.amount,
            },
          });
        // res.status(200).redirect(`https://payments.squbesoftsol.com?name=sachin`);
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    },
    confirmOrderPayment: async (req, res) => {
      try {
        //Authorization
  
        //code here....
        const { paymentId, orderId, razorpaySignature } = req.body;
        if (!paymentId || !orderId || !razorpaySignature) {
          throw new Error(
            "paymentId, orderId or razorpaySignature is missing in body!"
          );
        }
  
        //generating signature using paymentid and orderId
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_SECRET)
          .update(orderId + "|" + paymentId)
          .digest("hex");
  
        if (expectedSignature === razorpaySignature) {
          //updating payment with payment id when signature is verified
          const now = new Date();
  
          let newExpiryDate;
          let prevExpiryDate;
          let validFor;
  
          //Gets Payment document based on orderId
          const payment = await Payment.findOne({ orderId });
  
          //get the user
          const user = await User.findById(payment.userId);
  
          //Gets the user plan
          const plan = await Plan.findOne({ userId: user?._id });
  
          //checks user's previous plan
          //For Free Users
          if (user.plan === "FREE") {
            await User.findByIdAndUpdate(
              { _id: user?._id },
              { plan: "PRO" }
            );
            prevExpiryDate = now;
          }
  
          //For Already Pro Users
          if (user.plan === "PRO") {
            prevExpiryDate = plan.expiry;
          }
  
          switch (payment.planType) {
            case "MONTHLY":
              newExpiryDate = AddDaysToDate(prevExpiryDate, 30);
              validFor = 30;
              break;
            case "QUARTERLY":
              newExpiryDate = AddDaysToDate(prevExpiryDate, 90);
              validFor = 90;
              break;
            case "HALFYEARLY":
              newExpiryDate = AddDaysToDate(prevExpiryDate, 180);
              validFor = 180;
              break;
            case "YEARLY":
              newExpiryDate = AddDaysToDate(prevExpiryDate, 360);
              validFor = 360;
              break;
            default:
              newExpiryDate = prevExpiryDate;
              break;
          }
  
          //Gets the document which stores last generated IDs
          const ID = await Id.findOne();
          //Returns the new invoiceId by incrementing the last id by 1.
          const newInvoiceId = await ID.getInvoiceId();
  
          payment.paymentId = paymentId;
          payment.isSignatureVerified = true;
          payment.success = true;
          payment.validFor = validFor;
          payment.invoiceId = newInvoiceId;
          await payment.save();
          await ID.save();
  
          //updating the plan
          plan.expiry = newExpiryDate;
          plan.type = payment.planType;
          plan.lastPayment = payment._id;
          await plan.save();
        } else {
          //if signature verification fails
          throw new Error("payment-not-verified");
        }
  
        res
          .status(200)
          .json({ success: true, data: { message: "your payment is verified" } });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    },
    search: async (req, res) => {
      try {
        const {} = req.body;
        //base don paymentid and userId
        res.status(200).json({ success: true, data: { message: "you payment" } });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    },
    searchPayments: async (req, res) => {
      try {
        const { paymentId, userId, email } = req.body;
  
        if (email) {
          const user = await User.findOne({ email }).select("name");
          const payment = await Payment.find({ userId: user._id }).populate({
            path: "userId",
            populate: { path: "city", model: City, strictPopulate: false },
            model: User,
            select: "name email age",
            strictPopulate: false,
          });
          if (payment.length < 1) {
            throw new Error("No Payment Found by Email!");
          }
          res.status(200).json({ success: true, data: payment });
          return;
        }
  
        if (paymentId) {
          const payment = await Payment.find({ paymentId }).populate({
            path: "userId",
            populate: { path: "city", model: City, strictPopulate: false },
            model: User,
            select: "name email age",
            strictPopulate: false,
          });
          if (payment.length < 1) {
            throw new Error("No Payment Found by PaymentId!");
          }
          res.status(200).json({ success: true, data: payment });
          return;
        }
  
        if (userId) {
          const payments = await Payment.find({ userId }).populate({
            path: "userId",
            populate: { path: "city", model: City, strictPopulate: false },
            model: User,
            select: "name email age",
            strictPopulate: false,
          });
          if (payments.length < 1) {
            throw new Error("No Payment Found by userId!");
          }
          res.status(200).json({ success: true, data: payments });
          return;
        }
  
        if (!paymentId || !userId || !email) {
          throw new Error("email, paymentId or userId is missing in body!");
        }
        //base don paymentid and userId
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    },
    searchRangePayments: async (req, res) => {
      try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
          throw new Error("startDate or endDate is missing in body!");
        }
        const payments = await Payment.find({
          createdAt: { $gte: new Date(startDate), $lt: new Date(endDate) },
        }).populate({
          path: "userId",
          populate: { path: "city", model: City, strictPopulate: false },
          model: User,
          select: "name email age",
          strictPopulate: false,
        });
  
        if (payments.length < 1) {
          throw new Error("No Payments Found!");
        }
  
        res.status(200).json({ success: true, data: payments });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    },
  };
  
  module.exports = PaymentController;
  