const { default: mongoose } = require('mongoose')
const mongo = require('mongoose')
const Str = require('@supercharge/strings')
const ProductsSchema= new mongo.Schema({
    id: {
        type: Number, required: true,
    },
    name:{
        type: String, required: true,
    },
    price:{
        type: Number, required: true,
    },
    description:{
        type: String, required: true,
    },
    ratings:{
        type: Number, required: true,
    },
    stock:{
        type: Number, required: true,
    },
    images:{
        type: String, required: true,
    },
    numofReviews:{
        type: Number, required: true,
    },

})
module.exports = mongoose.model("product", ProductsSchema);
