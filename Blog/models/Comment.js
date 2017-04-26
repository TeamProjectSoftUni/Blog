const mongoose = require('mongoose');

let commentSchema = mongoose.Schema({
    name: {type: String, required: true},
    content: {type: String, required: true},
    article: {type: mongoose.Schema.Types.ObjectId, ref:'Article'},
    date: {type: Date, default: Date.now()}
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;