const { default: mongoose } = require('mongoose')
const mongo = require('mongoose')
const Str = require('@supercharge/strings')

const FacultySchema = new mongo.Schema({
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
    school: {
        type: String,
        required: true,
    },
    yearofjoin: {
        type: Number,
        required: true,
    },

});
module.exports = mongoose.model("facultys", FacultySchema);
