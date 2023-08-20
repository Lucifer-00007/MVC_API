const { User, SkippedUser, Message, ReportedUser, Id, Ticket, Interest, PaymentTable, Profession, Qualification, City, Plan, Payment } = require("../../db/models");
const {toId} = require("../../db/helper");
const { defaultImgBasedOnAgeAndGender, defaultImgBasedOnGender } = require("../../libs/defaultImg");
const {AddMinutesToDate} = require("../../libs/time");
const bcrypt = require('bcryptjs');


const UserController = {
  //CLIENT SIDE
  getUserMain:async (req, res) => {
    try {
      
      const {userId} = req.query
      if(!userId){
        throw new Error("userId is missing in query!");
      }

      const me = await User.findById(userId).select("blockedUsers savedUsers usersILike gender messagedUsers").lean();

      if(!me){
        throw new Error("Invalid User Id Provided!");
      }

      const skippedUsers = await SkippedUser.find({
        "skippedBy":userId
      })

      //skipped user filter
      const skippedUserFilter = []
      if(skippedUsers.length>0){
        for(let i in skippedUsers){
          skippedUserFilter.push(skippedUsers[i].skippedUser)
        }
      }

      //messaged users filter 
      const messagedUsersFilter = []
      if(me.messagedUsers.length>0){
        for(let i in me.messagedUsers){
          messagedUsersFilter.push(me.messagedUsers[i].user)
        }
      }

       // Get one random document matching {a: 10} from the mycoll collection.
        const [user] = await User.aggregate([
          { $match: { $and:[ {usersSuperLikeMe:{ $ne: me._id }},
            {_id:{ $ne: me._id }},
            {gender:{$ne:me.gender}},
            {_id:{$nin:skippedUserFilter}},
            {_id:{$nin:me.usersILike}},
            {_id:{$nin:me.savedUsers}},
            {_id:{$nin:me.blockedUsers}},
            {_id:{$nin:messagedUsersFilter}},
            {"profilePic.status": { $eq: "ACCEPTED" }},
            {"coverPic.status": { $eq: "ACCEPTED" }},
            {"photo1.status": { $eq: "ACCEPTED" }}
           ] } },
           {
            $lookup: {
              from: "interests",
              localField: "interests",
              foreignField: "_id",
              as: "interests",
            },
          },
          {
            $lookup: {
              from: "cities",
              localField: "city",
              foreignField: "_id",
              as: "city",
            },
          },
          {
            $lookup: {
              from: "qualifications",
              localField: "qualification",
              foreignField: "_id",
              as: "qualification",
            },
          },
          {
            $lookup: {
              from: "professions",
              localField: "profession",
              foreignField: "_id",
              as: "profession",
            },
          },
          //converts array into object
          {
            $unwind: {
              path: "$qualification",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: { path: "$profession", preserveNullAndEmptyArrays: true },
          },
          { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
          { $sample: { size: 1 } }
        ]);
        //console.log(user)
      
        if(!user) {
          throw new Error("No User Found!");
        }
        
        //Converting Mongodb Object to javascript object
        
        console.log(user);
        let newUser = JSON.parse(JSON.stringify(user));
        console.log(newUser);

        const d= {};
        
      let photos = [];
      if((newUser.photo1["img"]!==undefined) && newUser.photo1.img.length>5){
        photos.push(newUser.photo1)
      }
      if((newUser.photo2["img"]!==undefined) && newUser.photo2.img.length>5){
        photos.push(newUser.photo2)
      }
      if((newUser.photo3["img"]!==undefined) && newUser.photo3.img.length>5){
        photos.push(newUser.photo3)
      }
      if((newUser.photo4["img"]!==undefined) && newUser.photo4.img.length>5){
        photos.push(newUser.photo4)
      }
      if((newUser.photo5["img"]!==undefined) && newUser.photo5.img.length>5){
        photos.push(newUser.photo5)
      }
      delete newUser.photo1;
      delete newUser.photo2;
      delete newUser.photo3;
      delete newUser.photo4;
      delete newUser.photo5;
      newUser.photos = photos;


      
      res.status(200).json({success:true,data:newUser});
    } catch (err) {
      res.status(400).json({success:false,error:{message:err.message}})
    }
  },
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
  getUserData: async (req, res) => {
    try {
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!");
      }
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const user = await User.findById({ _id:userId },{pin:0});
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
          path: "tickets",
          model: Ticket,
          strictPopulate: false,
        },
        {
          path: "savedUsers",
          model: User,
          select:"_id name age city gender profilePic",
          popuate:[{path:"city",model:City,strictPopulate:false}],
          strictPopulate: false,
        },
        {
          path: "usersILike",
          model: User,
          select:"_id name age city gender profilePic",
          popuate:[{path:"city",model:City,strictPopulate:false}],
          strictPopulate: false,
        },
        {
          path: "usersLikeMe",
          model: User,
          select:"_id name age city gender profilePic",
          popuate:[{path:"city",model:City,strictPopulate:false}],
          strictPopulate: false,
        },
        {
          path: "blockedUsers",
          model: User,
          select:"_id name age city gender profilePic",
          popuate:[{path:"city",model:City,strictPopulate:false}],
          strictPopulate: false,
        },
        {
          path: "city",
          model: City,
          strictPopulate: false,
        },
        // {path:"skippedUsers",model:SkippedUser,"strictPopulate": false},
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
  getUserInterests: async (req, res) => {
    try {
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!");
      }
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const user = await User.findById({ _id: userId }).select("interests");
      if(!user) {
        throw new Error("User Not Found!");
      }
      const userInterests = await Interest.find({ _id: user.interests });
      if(userInterests.length<1) {
        throw new Error("No Interests Found!");
      }
      res.status(200).json({ success: true, data: userInterests });
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
  getUsersLikeMe: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const {userId,gender,skipped} = req.query;
      if(!userId || !gender){
        throw new Error("userId or gender is missing in query!")
      }
      if(gender !== "MALE" && gender!== "FEMALE"){
        throw new Error("Invalid Gender!")
      }

      const user = await User.findById({_id:userId }).select("usersLikeMe");
      if(!user) {
        throw new Error("User Not Found");
      }
      await user.populate(
        {
          path: "usersLikeMe",
          select:"_id name age city gender profilePic",
          populate: { path: 'city', model:City, strictPopulate:false },
          model: User,
          strictPopulate: false,
        },
      );

      //Filter Based on Gender
      const usersLikeMe = user.usersLikeMe.filter((userLikeMe)=>userLikeMe.gender!==gender);
      if(usersLikeMe.length<1){
        throw new Error("No Users Found!");
      }

      let initial = skipped||0;
      let newUsersLikeMe = usersLikeMe.slice(initial, initial+10);
      res.status(200).json({ success: true, data:newUsersLikeMe });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getUsersILike: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const {userId,gender,skipped} = req.query;
      if(!userId || !gender){
        throw new Error("userId or gender is missing in query!")
      }
      if(gender !== "MALE" && gender!== "FEMALE"){
        throw new Error("Invalid Gender!")
      }

      const user = await User.findById({_id:userId }).select("usersILike");
      if(!user) {
        throw new Error("User Not Found");
      }
      await user.populate(
        {
          path: "usersILike",
          select:"_id name age city gender profilePic",
          populate: { path: 'city', model:City, strictPopulate:false },
          model: User,
          strictPopulate: false,
        },
      );

      //Filter Based on Gender
      const usersILike = user.usersILike.filter((userILike)=>userILike.gender!==gender)

      if(usersILike.length<1){
        throw new Error("No Liked Users Found!");
      }

      let initial = skipped||0;
      let newUsersILike = usersILike.slice(initial, initial+10)
      res.status(200).json({ success: true, data: newUsersILike });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getSavedUsers: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const {userId,gender,skipped} = req.query;
      if(!userId || !gender){
        throw new Error("userId or gender is missing in query!")
      }

      if(gender !== "MALE" && gender!== "FEMALE"){
        throw new Error("Invalid Gender!")
      }

      let user = await User.findById({_id:userId }).select("savedUsers");
      
      if(!user) {
        throw new Error("User Not Found!");
      }

      await user.populate(
        {
          path: "savedUsers",
          select:"name _id age city gender profilePic",
          populate: { path: 'city', model:City, strictPopulate:false },
          model: User,
          strictPopulate: false,
        },
      );

      //Filter Based on Gender
      const savedUsers = user.savedUsers.filter((savedUser)=>savedUser.gender!==gender);
      if(savedUsers.length<1){
        throw new Error("No Saved Users Found!");
      }

      //console.log("Ski[ped: ",skipped);
      let initial=skipped||0;
      let newSavedUsers = savedUsers.slice(initial,initial+10);
      res.status(200).json({ success: true, data: newSavedUsers });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getBlockedUsers: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const {userId,gender,skipped} = req.query;
      if(!userId || !gender){
        throw new Error("userId or gender is missing in query!")
      }
      if(gender !== "MALE" && gender!== "FEMALE"){
        throw new Error("Invalid Gender!")
      }

      //LOGIC AND DB OPERATIONS
      const user = await User.findById({_id:userId }).select("blockedUsers");
      if(!user) {
        throw new Error("User Not Found!");
      }
      await user.populate(
        {
          path: "blockedUsers",
          select:"_id name age city gender profilePic",
          populate: { path: 'city', model:City, strictPopulate:false },
          model: User,
          strictPopulate: false,
        },
      );

      //Filter Based on Gender
      const blockedUsers = user.blockedUsers.filter((blockedUser)=>blockedUser.gender!==gender)

      if(blockedUsers.length<1){
        throw new Error("No Blocked Users Found!");
      }

      let initial=skipped||0;
      let newBlockedUsers = blockedUsers.slice(initial,initial+10)
      res.status(200).json({ success: true, data: newBlockedUsers });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getMessagedUsers: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!");
      }
      const user= await User.findById({_id:userId},{messagedUsers:true});
      if(!user) {
        throw new Error("User Not Found!");
      }
      await user.populate(
        {
          path: "messagedUsers.user",
          select:"_id name age city gender profilePic",
          populate: { path: 'city', model:City, strictPopulate:false },
          model: User,
          strictPopulate: false,
        },
      );


      //console.log(user)
      res.status(200).json({ success: true, data: user.messagedUsers });
      
    } catch (error) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getUserPaymentTable: async (req, res) => {
    try {
      const {age} = req.query;
      if(!age){
        throw new Error("age is missing in query!")
      }
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      let paymentCondition;
      if (age>=18&&age<25) paymentCondition={'C1824':1};
      if (age>=25&&age<31) paymentCondition={'C2530':1};
      if (age>=31&&age<46) paymentCondition={'C3145':1};
      if (age>=46&&age<61) paymentCondition={'C4660':1};
      if (age>=61) paymentCondition={'C61':1};
      
      const payinfo = await PaymentTable.findOne({},paymentCondition)
      
      const newpay = {
        MONTHLY:payinfo[Object.keys(paymentCondition)[0]].get('MONTHLY'),
        QUARTERLY:payinfo[Object.keys(paymentCondition)[0]].get('QUARTERLY'),
        HALFYEARLY:payinfo[Object.keys(paymentCondition)[0]].get('HALFYEARLY'),
        YEARLY:payinfo[Object.keys(paymentCondition)[0]].get('YEARLY')
      }

      res.status(200).json({ success: true, data: newpay });
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
  like: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      //Second Person from body
      const {likedBy,likedUser} = req.body;
      if(!likedBy || !likedUser){
        throw new Error("likedBy or likedUser is missing in body!");
      }
      //First Person from cookies
      // const {user:USER} = req.cookies;

      const secondPerson = await User.findById(likedUser);
      if (secondPerson?.usersLikeMe?.includes(likedBy)){
        const me = await User.findByIdAndUpdate(
          { _id: likedBy },
          { $pull: { usersILike: toId(likedUser) } },
          { new: true }
        );
        //console.log("ME", me.usersILike);
        const likeduser = await User.findByIdAndUpdate(
          { _id: likedUser },
          { $pull: { usersLikeMe: toId(likedBy) } },
          { new: true }
        );
        //console.log("USER",likedUser.usersLikeMe)
        // return { success:true, message: "Whrooler Unliked", code:"UN_LIKE" };
        res.status(200).json({ success: true, data:{message:"Whrooler UnLiked."} });
        return;
      }
      else{
        const me = await User.findByIdAndUpdate(
          { _id: likedBy },
          {$addToSet:{usersILike: toId(likedUser)}},
          // { $push: { usersILike: toId(userId) } },
          { new: true }
        );
        //console.log("ME", me.usersILike);
        const likeduser = await User.findByIdAndUpdate(
          { _id: likedUser },
          { $addToSet: { usersLikeMe: toId(likedBy) } },
          // { $push: { usersLikeMe: toId(USER._id) } },
          { new: true }
        );
        //console.log("USER",likedUser.usersLikeMe)
        // return { success:true, message: "Whrooler Liked", code:"LIKE" };
        res.status(200).json({ success: true, data:{message:"Whrooler Liked."} });
        return;
      }
      
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  superLike: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      // const user = await User.findById(userId)
      // if (user.usersSuperLikeMe.includes(USER._id)){
      //   await User.findByIdAndUpdate({_id:userId},{$pull: {usersSuperLikeMe: toId(USER._id)}})
      //   return { success:true, message: "Whrooler UnSuperLiked" , code:"UN_SUPER_LIKE" };
      // }
      // else{
      //   await User.findByIdAndUpdate({_id:userId},{$push: {usersSuperLikeMe: toId(USER._id)}})
      //   return { success:true, message: "Whrooler SuperLiked", code:"SUPER_LIKE" };
      // }
      res.status(200).json({ success: true, data: { message: "superLiked" } });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  message: async (req, res) => {
    try {

      //AUTHENTICATION CHECK
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);

      //VALIDATION CHECK
      //Second Person from body
      const {messagedBy,messagedUser} = req.body;
      if(!messagedBy || !messagedUser){
        throw new Error("messagedBy or messagedUser is missing in body!");
      }

      //First Person from cookies
      // const {user:USER} = req.cookies;


      //DB OPERATIONS AND LOGIC
      let isFirstPersonExist=false;
      let isSecondPersonExist=false;

      const firstPerson = await User.findById(messagedBy).select("messagedUsers plan");
  
      //check first person messaging list to see second person exist or not
      for(let i in firstPerson?.messagedUsers){
        //console.log(USER.messagedUsers[i].user==userId);
        //if found -- just return
        if(firstPerson?.messagedUsers[i].user==messagedUser){
          isSecondPersonExist=true;
          break;
        }
      }
      //if not found--- add second person
      if(isSecondPersonExist){
        throw new Error("Whrooler Already in your Messaging List!");
      }
      else{
        //Checking if re-adding or not using previous messages
        const msgsSent = await Message.find(
          {
            "sender" : { "$eq": messagedBy.toString()},
            "reciever" : { "$eq": messagedUser.toString() }
          }
        );

        const msgsReceived = await Message.find(
          {
            "reciever" : { "$eq": messagedBy.toString()},
            "sender" : { "$eq": messagedUser.toString() }
          }
        );
        //console.log("Messages",msgs)

        let threshold=0;
        let totalSent = msgsSent.length;
        let totalReceived = msgsReceived.length;
        if(msgsSent.length===0){
          threshold=5
        }
        if(firstPerson?.plan==="FREE" && msgsSent.length===3){
          threshold=2
        }

        if(firstPerson?.plan==="FREE" && msgsSent.length>=5){
          threshold=0
        }

        if(firstPerson?.plan==="PRO" && msgsSent.length>=5){
          threshold=0
        }

        //second person not found so adding it into first person messaging list
        const me = await User.findByIdAndUpdate(
          { _id: messagedBy },
          { $addToSet: { messagedUsers:{user:toId(messagedUser),lastModifiedAt:new Date(),threshold,totalSent,totalReceived}  } },
          { new: true }
        );
      }
      
      //Response
      // return { success:true, message: "Whrooler Added to your Messaging List!", code:"MESSAGED" };
      res.status(200).json({ success: true, data: { message: "Whrooler Added to your Messaging List!" } });
    
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  save: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      //Second Person from body
      const {savedBy,savedUser} = req.body;
      if(!savedBy || !savedUser){
        throw new Error("savedBy or savedUser is missing in body!");
      }

      //First Person from cookies
      // const {user:USER} = req.cookies;

      const firstPerson = await User.findById(savedBy);
      if(firstPerson?.savedUsers?.includes(savedUser)){
        const me = await User.findByIdAndUpdate(
          { _id: savedBy },
          { $pull: { savedUsers: toId(savedUser) } },
          { new: true }
        );
        // return { success:true, message: "whrooler unsaved",code:"UN_SAVE" };
        res.status(200).json({ success: true, data:{message:"Whrooler UnSaved."} });
        return;
      }
      else{
      const me = await User.findByIdAndUpdate(
        { _id: savedBy },
        { $addToSet: { savedUsers: toId(savedUser) } },
        { new: true }
      );
      
      // return {success:true, message: "Whrooler saved", code:"SAVE" };
      res.status(200).json({ success: true, data:{message:"Whrooler Saved."} });
      return;
    }
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  skip: async (req, res) => {
    try {
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      //Second Person
      const {skippedBy,skippedUser} = req.body;
      if(!skippedBy || !skippedUser){
        throw new Error("skippedBy or skippedUser is missing in body!");
      }

      //First Person
      // const {user:USER} = req.cookies;

      const now = new Date();
      const expiration_time = AddMinutesToDate(now,1440);
      const me = await SkippedUser.create(
        {
          skippedBy:toId(skippedBy),
          skippedUser:toId(skippedUser),
          expires:expiration_time
        }
      );
      // return { success:true, message: "whrooler skipped", code:"SKIP" };
      res.status(200).json({ success: true, data:{message:"Whrooler Skipped."} });
      return;
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //OTHER USER ACTIONS
  //Block
  block: async (req, res) => {
    try {

      //AUTHENTICATION CHECK
        // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      
      //VALIDATION CHECK
      //Second Person from body
      const {blockedBy, blockedUser} = req.body;
      if(!blockedUser || !blockedBy){
        throw new Error("blockedUser or blockedBy is missing in body!");
      }

      //First Person from cookies
      // const {user:USER} = req.cookies;

      //DB OPERATIONS AND LOGIC


        //Marking isBlocked as "true" in user messaging list
        const firstPerson = await User.findById(blockedBy);
        const secondPerson = await User.findById(blockedUser);
        let index = firstPerson.messagedUsers.findIndex((e)=>e.user == blockedUser)
        firstPerson.messagedUsers[index].isBlocked =true;
        
        //console.log(me[1].usersBlockedMe.findIndex((element) => element == blockedBy.toString()),blockedBy,me[1].usersBlockedMe)
        // console.log("BLOCKED ME",me[1].usersBlockedMe.includes(toId(blockedBy)))
        // console.log("BLOCKED",me[0].usersILike)
        if(firstPerson.savedUsers.includes(blockedUser)){ firstPerson.savedUsers.pull(blockedUser) }
        if(firstPerson.usersILike.includes(blockedUser)){ firstPerson.usersILike.pull(blockedUser) }
        if(firstPerson.usersLikeMe.includes(blockedUser)){ firstPerson.usersLikeMe.pull(blockedUser) }
        if(firstPerson.usersSuperLikeMe.includes(blockedUser)){ firstPerson.usersSuperLikeMe.pull(blockedUser) }
        if((firstPerson.blockedUsers.findIndex((element) => element == blockedUser))<0){firstPerson.blockedUsers.push(toId(blockedUser))}
        //await firstPerson.save();
        //console.log("first",me[0])
        if(secondPerson.savedUsers.includes(blockedBy)){ secondPerson.savedUsers.pull(blockedBy) }
        if(secondPerson.usersILike.includes(blockedBy)){ secondPerson.usersILike.pull(blockedBy) }
        if(secondPerson.usersLikeMe.includes(blockedBy)){ secondPerson.usersLikeMe.pull(blockedBy) }
        if(secondPerson.usersSuperLikeMe.includes(blockedBy)){ secondPerson.usersSuperLikeMe.pull(blockedBy) }
        if((secondPerson.usersBlockedMe.findIndex((element) => element == blockedBy.toString()))<0){secondPerson.usersBlockedMe.push(blockedBy)}
        
        Promise.all([firstPerson.save(),secondPerson.save()])
        res.status(200).json({ success: true, data: {message:"Whrooler Blocked!"} });
        
        return;
        // return { success:true, message: "Whrooler blocked", code:"BLOCK" };
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  //UnBlock
  unBlock:async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);

      //VALIDATION CHECK
      //Second Person from body
      const {unblockBy,unblockUser} = req.body;
      if(!unblockUser || !unblockBy){
        throw new Error("unblockBy or unblockUser is missing is body!");
      }

      //First Person from cookies
      // const {user:USER} = req.cookies;

      //DB OPERATIONS AND LOGIC

      //Marking isBlocked as "false" in user messaging list
      const firstPerson = await User.findById(unblockBy).select("messagedUsers");
      let index= firstPerson?.messagedUsers?.findIndex((e)=>e.user == unblockUser)
      if(index>=0){
      firstPerson.messagedUsers[index].isBlocked =false;
      await firstPerson.save();
      }
 
      const me = await User.findByIdAndUpdate(
        { _id: unblockBy },
        { $pull: { blockedUsers: toId(unblockUser) } },
        { new: true }
      );
      const you = await User.findByIdAndUpdate(
        {_id:unblockUser},
        {$pull:{usersBlockedMe:toId(unblockBy)}},
        {new:true}
      )
      // return { success:true, message: "Whrooler UnBlocked", code:"UNBLOCK" };
      res.status(200).json({ success: true, data: {message:"Whrooler UnBlocked."} });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  //Report
  report: async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if(!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      
      //VALIDATION CHECK
      const {userId,reason} = req.body;
      if(!userId|| !reason){
        throw new Error("userId or reason is missing in body!");
      }

      //First Person from cookies
      // const {user:USER} = req.cookies;
      const {_id} = req.user;

      //DB OPERATIONS AND LOGIC
      const duplicate = await ReportedUser.find({uniqueId: {$eq:userId+_id }})
      if(duplicate.length>0){
        res.status(200).json({ success: true, data: {message:"Whrooler Already Reported!"} });
        return;
      }else{
        const report = await ReportedUser.create({
          reportedUser:toId(userId),
          reportedBy:toId(_id),
          uniqueId:userId+_id,
          reason:reason
        });
      }
      res.status(200).json({ success: true, data: {message:"Whrooler Reported!"} });

    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  //Delete Messaged User
  deleteChatUser: async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      
      //VALIDATION CHECK
      const {userId} = req.body;
      if(!userId){
        throw new Error("userId is missing in body!");
      }

      //First Person from cookies
      const {user:USER} = req.cookies;

      //DB OPERATIONS AND LOGIC
      const firstPerson = await User.findByIdAndUpdate(
        {_id:USER._id},
        {$pull:{messagedUsers:{user:toId(userId)}}},
        {new:true}
      )

      const msgs = await Message.updateMany(
        {
          "sender" : { "$in": [userId.toString(), USER._id.toString()] },
          "reciever" : { "$in": [userId.toString(), USER._id.toString()] }
        },
        {
          $pull:{visibleTo:USER._id.toString()}
        }
      )
      res.status(200).json({ success: true, data: {message:"Messaged whrooler deleted."} });
      
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
      
    }
  },
  //Favourite Messaged User
  favouriteChatUser: async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      
      //VALIDATION CHECK
      //Second Person from body
      const {userId, action} = req.body;
      if(!userId || !action){
        throw new Error("userId or action is missing in body!");
      }

      //First Person from cookies
      const {user:USER} = req.cookies;

      //DB OPERATIONS AND LOGIC

      const fav = await User.findById({_id:USER._id});
      // console.log("FAV: ",)
      
      let index=fav.messagedUsers.findIndex((e) => e.user == userId)
      if(action==='FAVOURITE'){
        fav.messagedUsers[index].isFavourite=true;
        await fav.save();
        
        res.status(200).json({ success: true, data: {message:"Whrooler added to Favourites."} });
        return;
      
      }
      if(action==='UNFAVOURITE'){
        fav.messagedUsers[index].isFavourite=false;
        await fav.save();

        res.status(200).json({ success: true, data: {message:"Whrooler removed from Favourites."} });
        return;
      }
      
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  //Clear Chat
  clearChat: async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      
      //VALIDATION CHECK
      //Second Person from body
      const {userId} = req.body;
      if(!userId){
        throw new Error("userId is missing in body!");
      }

      //First Person from cookies
      const {user:USER} = req.cookies;

      //DB OPERATIONS AND LOGIC

      const msgs=await Message.updateMany(
        {
          "sender" : { "$in": [userId.toString(), USER._id.toString()] },
          "reciever" : { "$in": [userId.toString(), USER._id.toString()] }
        }, {$pull:{visibleTo:USER._id.toString()}}
      )
      res.status(200).json({ success: true, data: {message:"Whrooler Chat cleared."} });
      
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },


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

  //RAISE USER TICKET
  raiseTicket: async (req, res) => {
    try {
      //AUTHENTICATION CHECK
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      
      //VALIDATION CHECK
      const {name, subject, message, raisedBy } = req.body;
      if(!name || !subject || !message || !raisedBy){
        throw new Error("name, subject, message or raisedBy is missing in body!");
      }

      //Gets the document which stores last generated whroolerID
      const ID = await Id.findOne();
      //Returns the new ticketId by incrementing the last id by 1.
      const newTicketId = await ID.getTicketId();

      const newTicket = await Ticket.create({
        ticketId: newTicketId,
        name,
        subject,
        messages:[{message,sentBy:toId(raisedBy),createdAt:new Date()}],
        raisedBy,
      });
      
      //avoids incrementing id if ticket creation fails
      await ID.save();
      const user = await User.findByIdAndUpdate(
        { _id: raisedBy },
        { $push: { tickets: toId(newTicket._id) } }
      );
      res.status(200).json({ success: true, data: {message:"Ticket Raised Successfully."} });
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
  

  addUser: async (req, res) => {
    try {
      res.status(200).json({ success: true, data: "addUser" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

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
