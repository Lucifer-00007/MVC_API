const { User, SkippedUser, Message, ReportedUser, Id, Ticket, Interest, PaymentTable, Profession, Qualification, City, Plan, Payment } = require("../../db/models");
const {toId} = require("../../db/helper");
const { defaultImgBasedOnAgeAndGender, defaultImgBasedOnGender } = require("../../libs/defaultImg");
const {AddMinutesToDate} = require("../../libs/time");
const bcrypt = require('bcryptjs');


const UserController = {
  //CLIENT SIDE
  getUserProfile:async(req,res) => {
    try {
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!");
      }
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const user = await User.findById({ _id:userId })
      .select("_id name age gender email phone bio city profilePic coverPic interests qualification profession photo1 photo2 photo3 photo4 photo5");
      if(!user){ 
        throw new Error("User Not Found!");
      }
      await user.populate([
        {
          path: "qualification",
          model: Qualification,
          strictPopulate: false,
        },
        {
          path: "profession",
          model: Profession,
          strictPopulate: false,
        },
        {
          path: "interests",
          model: Interest,
          strictPopulate: false,
        },
        {
          path: "city",
          model: City,
          strictPopulate: false,
        },
      ]);

      //Converting Mongodb Object to Javascript Object
      let newUser = user.toJSON();
      // let photos = [newUser.photo1,newUser.photo2,newUser.photo3,newUser.photo4,newUser.photo5];
      let photos = [];
      if(newUser.photo1.img && newUser.photo1.img.length>5){
        photos.push(newUser.photo1)
      }
      if(newUser.photo2.img && newUser.photo2.img.length>5){
        photos.push(newUser.photo2)
      }
      if(newUser.photo3.img && newUser.photo3.img.length>5){
        photos.push(newUser.photo3)
      }
      if(newUser.photo4.img && newUser.photo4.img.length>5){
        photos.push(newUser.photo4)
      }
      if(newUser.photo5.img && newUser.photo5.img.length>5){
        photos.push(newUser.photo5)
      }
      delete newUser.photo1;
      delete newUser.photo2;
      delete newUser.photo3;
      delete newUser.photo4;
      delete newUser.photo5;
      newUser.photos = photos;

      //console.log("population: ",user);
      res.status(200).json({ success: true, data: newUser });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getUser: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const { userId, email } = req.query;

      if(userId){
        const user = await User.findById(userId,{pin:0});
        if (!user) {
          throw new Error("User Not Found!");
        }
        res.status(200).json({ success: true, data: user });
        return;
      }
      if(email){
        const user = await User.findOne({ email },{pin:0});
        if (!user) {
          throw new Error("User Not Found!");
        }
        res.status(200).json({ success: true, data: user });
        return;
      }

      if(!userId || !email){
        throw new Error("userId or email is missing in query!")
      }
      
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  getUserTickets: async (req, res) => {
    try {
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!");
      }
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const userTickets = await Ticket.find({ raisedBy:userId });
      if(!userTickets) {
        throw new Error("No Tickets Found!");
      }
      res.status(200).json({ success: true, data: userTickets });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getUserPayments: async (req, res) => {
    try {
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!")
      }
      // res.status(200).json({ success: true, data: {message:"getUserInterests"} });
      const payment = await Payment.find({userId:req.user._id});
      res.status(200).json({ success: true, data: payment });

    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },  
  getUserPlan: async (req, res) => {
    try {
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!");
      }
        // if(!isAuthenticated) throw new Error("not-allowed");
      const plan = await Plan.findOne({userId});
      
      if(!plan){
        throw new Error("User Plan not Found!");
      }
    
      res.status(200).json({success:true,data:plan})
    } catch (err) {
      res.status(400).json({success:false,error:{message:err.message}})
    }
  },
  //To add user onboarding data
  onboarding: async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      
      //VALIDATION CHECK
      const {userId, age, cityId, gender } = req.body;
      if(!age || !cityId || !gender){
        throw new Error("userId, age, cityId or gender is missing in body!");
      }
      //Write Validation for data @skpjr001

      //Not using @skpjr001
      // const {user:USER} = req.cookies;


      //DB OPERATIONS AND LOGIC

      const updatedUser = await User.findByIdAndUpdate(
        { _id: userId },
        { age, city: toId(cityId), gender, isOnboardingCompleted: true,"profilePic.img":defaultImgBasedOnGender(gender) },
        { new: true }
      );
      if (!updatedUser) throw new Error("Unable to complete onboarding!");
      
      res.status(200).json({ success: true, data:{message:"Onboarding Completed Successfully."} });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //USER ACTIONS

  //OTHER USER ACTIONS
  //Block

  //EDIT PROFILE ACTIONS
  //TO edit user profile
  editProfile: async (req, res) => {
    try {

      const {userId,name,bio,professionId,qualificationId} = req.body;
      if(!userId){
        throw new Error("userId is missing in body!");
      }
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      let ChangeDetails = {}
      
      if(name) ChangeDetails.name=name;
      if(bio) ChangeDetails.bio=bio;
      if(professionId) ChangeDetails.profession = toId(professionId);
      if(qualificationId) ChangeDetails.qualification = toId(qualificationId);
      // if(interestIds) ChangeDetails.interests =  interestIds.map((id) => toId(id))
      if(!name|| !bio || !professionId || !qualificationId){
        throw new Error("name, bio, professionId or qualificationId is missing in body!");
      }
      // if(input.interestIds) ChangeDetails.interests =  input.interestIds.map((id) => toId(id))
      // console.log(ChangeDetails)
      const user = await User.findByIdAndUpdate({_id:userId},ChangeDetails)
     
      res.status(200).json({ success: true, data: "Profile Updated" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  //To edit user Interests
  editInterests: async (req, res) => {
    try {
      const {userId, interestIds} = req.body;
      if(!userId || !interestIds){
        throw new Error("userId or interestIds is missing in body!");
      }
      const user = await User.findByIdAndUpdate(
        { _id: userId },
        { $set: { interests: interestIds.map((id) => toId(id)) } },
        { new: true }
      );
      res.status(200).json({ success: true, data: "Interest Updated" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  
  //To edit user photos
  editPhotos: async (req, res) => {
    try {
      res.status(200).json({ success: true, data: "Photos Updated" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //CHANGE USER PIN
  changePin: async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if(!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);

      //VALIDATION CHECK
      const {currentPin, newPin, userId} = req.body;
      if(!currentPin || !newPin || !userId){
        throw new Error("currentPin, newPin or userId is missing in body!");
      }

      // const {user:USER} = req.cookies;

      //LOGIC AND DB OPERATIONS
      const me = await User.findById(userId).select("pin");
      const validPin = await bcrypt.compare(currentPin, me.pin);
      if(!validPin) throw new Error("Incorrect Pin!");

      // Hash passwords
      const salt = await bcrypt.genSalt(10);
      //using pin as password
      const hashedPin = await bcrypt.hash(newPin, salt);

      const user = await User.findByIdAndUpdate(userId,{pin:hashedPin});

      res.status(200).json({ success: true, data: {message:"Pin Changed Successfully."} });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //FIND USER BASED ON FILTERS
  findUsers: async (req, res) => {
    try {
      const {userId,gender,age,cityId,interests,skipped=0} = req.body
      // if (!isAuthenticated) throw new Error("not-allowed");
      if(!userId || !gender){
        throw new Error("userId or gender is missing in body!");
      }
      let whroolerFilter = new Object();
      
      //$ne --> not equal (Comparison Query Operators in MongoDB)
      whroolerFilter.gender={$ne:gender}
      //excluding self document
      whroolerFilter._id = {$ne:userId}
      
      if (age && typeof age.min ==="number" && typeof age.max ==="number") {
        whroolerFilter.age = {
          $gte: age.min,
          $lte: age.max,
        };
      }
      if (cityId && cityId.length>10) {
        whroolerFilter.city = toId(cityId);
      }
      if (interests && interests.length>0){
        whroolerFilter.interests = {
          $all: interests,
        };
      }

      if(!whroolerFilter.age && !whroolerFilter.city && !whroolerFilter.interests){
        throw new Error("No Filters Specified!");
      }

      whroolerFilter["profilePic.status"] = { $eq: "ACCEPTED" };
      whroolerFilter["coverPic.status"] = { $eq: "ACCEPTED" };
      whroolerFilter["photo1.status"] = { $eq: "ACCEPTED" };
      

      const users = await User.find(whroolerFilter,{},{limit:15,skip:skipped}).select("_id name age city gender 0").lean();
      
      if (!users || users.length<1) {
        throw new Error("No Users Found!");
      }
      
      for (let i in users){
        
        users[i].city = await City.findById(users[i].city);   
        //console.log(whrooler[i].coverPic.isVerified)
      }

      //filtering whroolers based on filters

      res.status(200).json({success:true,data:users});
    } catch (err) {
      res.status(400).json({success:false,error:{message:err.message}})
    }
  },
  //ADMIN SIDE
  

  editUser: async (req, res) => {
    try {
      res.status(200).json({ success: true, data: "editUser" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  deleteUser: async (req, res) => {
    try {
      res.status(200).json({ success: true, data: "deleteUser" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
};

module.exports = UserController;
