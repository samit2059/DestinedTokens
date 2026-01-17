const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    No_ofItems: {
        type: Number,
        required: true,
        default: 10
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('product', ProductSchema);