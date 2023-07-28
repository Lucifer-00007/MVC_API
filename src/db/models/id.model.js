const { Schema, model, } = require("mongoose");
const { PREFIX_ZOCAR_ID } = require("../../config");


/**
 * Id Schema
 */
const IdSchema = new Schema({
    //last generated Zocar Id
    lastZocarId: {
        type: Number,
        default: 0
    },
    message: {
        type: String,
        default: "This document stores the last generated IDs.",
    },
},
    {
        timestamps: true
    });

//define schema level methods to create access token and refresh token:
IdSchema.methods = {

    getZocarId: async function () {

        try {
            const pre = PREFIX_Zocar_ID;
            let prev = this.lastZocarId;

            this.lastZocarId += 1;

            if (prev > 999998) return pre + ++prev;
            if (prev > 99998) return pre + "0" + ++prev;
            if (prev > 9998) return pre + "00" + ++prev;
            if (prev > 998) return pre + "000" + ++prev;
            if (prev > 98) return pre + "0000" + ++prev;
            if (prev > 8) return pre + "00000" + ++prev;
            return pre + "000000" + ++prev;

        } catch (error) {
            console.error(error);
            return;
        }
    },
}



/**
 * ID Model
 */
const Id = model("Id", IdSchema);



module.exports = Id;