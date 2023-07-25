const {Schema, model,} = require("mongoose");
const { PREFIX_INVOICE_ID,PREFIX_TICKET_ID,PREFIX_WHROOLER_ID } = require("../../config");


/**
 * Id Schema
 */
const IdSchema = new Schema({
  //last generated whrooler Id
  lastWhroolerId:{
    type:Number,
    default:0
  },
  //last generated ticket Id
  lastTicketId:{
    type:Number,
    default:0
  },
  //last generated invoice Id
  lastInvoiceId:{
    type:Number,
    default:0
  },
  message:{
    type:String,
    default:"This document stores the last generated IDs.",
  },
},
{
  timestamps:true
});

//define schema level methods to create access token and refresh token:
IdSchema.methods={

  getWhroolerId : async function(){

    try {
      const pre = PREFIX_WHROOLER_ID;
      let prev = this.lastWhroolerId;

      this.lastWhroolerId+=1;

      if(prev>999998) return pre+ ++prev;
      if(prev>99998) return pre+"0"+ ++prev;
      if(prev>9998) return pre+"00"+ ++prev;
      if(prev>998) return pre+"000"+ ++prev;
      if(prev>98) return pre+"0000"+ ++prev;
      if(prev>8) return pre+"00000"+ ++prev;
      return pre+"000000"+ ++prev;

    } catch (error) {
      console.error(error);
      return;
    }
  },
  getTicketId : async function(){
    try{
      const pre = PREFIX_TICKET_ID;
      let prev = this.lastTicketId;

      this.lastTicketId+=1;

      if(prev>999998) return pre+ ++prev;
      if(prev>99998) return pre+"0"+ ++prev;
      if(prev>9998) return pre+"00"+ ++prev;
      if(prev>998) return pre+"000"+ ++prev;
      if(prev>98) return pre+"0000"+ ++prev;
      if(prev>8) return pre+"00000"+ ++prev;
      return pre+"000000"+ ++prev;

    }catch(error){
      console.error(error);
      return;
    }
  },
  getInvoiceId : async function(){
    try{
      const pre = PREFIX_INVOICE_ID;
      let prev = this.lastInvoiceId;

      this.lastInvoiceId+=1;

      if(prev>999998) return pre+ ++prev;
      if(prev>99998) return pre+"0"+ ++prev;
      if(prev>9998) return pre+"00"+ ++prev;
      if(prev>998) return pre+"000"+ ++prev;
      if(prev>98) return pre+"0000"+ ++prev;
      if(prev>8) return pre+"00000"+ ++prev;
      return pre+"000000"+ ++prev;

    }catch(error){
      console.error(error);
      return;
    }
  }
}



/**
 * ID Model
 */
const Id = model("Id", IdSchema);



module.exports = Id;