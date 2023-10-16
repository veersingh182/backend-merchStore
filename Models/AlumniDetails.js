const { default: mongoose } = require('mongoose')
const mongo = require('mongoose')
const Str = require('@supercharge/strings')

const AlumniSchema = new mongo.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    token: {
        type: String,
        default: Str.random(50),
        unique: true
    },
    program: {
        type: String,
        required: true,
    },
    school: {
        type: String,
        required: true,
    },
    yearofjoin: {
        type: Number,
        required: true,
    },
    gradyear: {
        type: Number,
        required: true,
    },
    courses: {
        type: String,
        required: true,
    },
    enrollnumber: {
        type: Number,
        required: true,
    },

});
module.exports = mongoose.model("alumnis", AlumniSchema);
