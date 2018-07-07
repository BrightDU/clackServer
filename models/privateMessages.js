const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Message Schema
const privateMessageSchema = new Schema({
    message: {
        type: String,
        required: true
    },
 }, {
        timestamps: true
})

let Messages = mongoose.model('messages', messageSchema);

module.exports = Messages;