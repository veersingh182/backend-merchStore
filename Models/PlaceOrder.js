const { default: mongoose } = require("mongoose");
const mongo = require("mongoose");
const Str = require("@supercharge/strings");

const PlaceOrderSchema = new mongoose.Schema({
    Email: {
        type: String,
        required: true,
    },
    FullName: {
        type: String,
        required: true,
    },
    Address: {
        type: String,
        required: true,
    },
    PNumber: {
        type: String,
        required: true,
    },
    IDProof: {
        type: String,
        required: true,
    },
    isPayment: {
        type: Boolean,
        default: false,
    },
    transactionId: {
        type: String,
        default: "$",
    },
    orderDetails: {
        shipping: {
            type: Number,
            default: 70,
        },
        subTotal: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            default: 0,
        },
        cartItems: [
            {
                id: String,
                name: String,
                quantity: Number,
                addon: {
                    type: String,
                },
                size: Number,
            },
        ],
        type: Object,
        required: true,
    },
});

module.exports = mongoose.model("placeorders", PlaceOrderSchema);
