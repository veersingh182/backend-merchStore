const { default: mongoose } = require("mongoose");
const mongo = require("mongoose");
const Str = require("@supercharge/strings");

const CouponCodeSchema = new mongoose.Schema({
    Code: {
        type: String,
        required: true,
    },
    Amount: {
        type: Number,
        default: 50,
    },
    Description: {
        type: String,
    },
    discountType: {
        type: String,
        required: true,
    },
    discountAmount: {
        type: Number,
        required: true,
    }
});

module.exports = mongoose.model("couponcodes", CouponCodeSchema);
