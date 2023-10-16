const { default: mongoose } = require('mongoose')
const mongo = require('mongoose')
const Str = require('@supercharge/strings')

const UserSchema = new mongo.Schema({
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
    password: {
        type: String,
    },
    fname: {
        type: String,
        required: true,
    },
    lname: {
        type: String,
    },
    type: {
        type: String,
        required: true,
        default: "alumni",
    },
    isgoogle: {
        type: Boolean,
        required: true,
        default: false,
    },
    location: {
        type: String,
    },
    photoUrl: {
        type: String,
    }

});
module.exports = mongoose.model("users", UserSchema);
