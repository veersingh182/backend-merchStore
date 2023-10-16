const { default: mongoose } = require('mongoose')
const mongo = require('mongoose')
const Str = require('@supercharge/strings')


const PaymentProofSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
    },
    transId: {
        type: String,
        required: true,
        default: '$',
    },
    paymentProof: {
        type: String,
        required: true,
    },


});

module.exports = mongoose.model("paymentproofs", PaymentProofSchema);
