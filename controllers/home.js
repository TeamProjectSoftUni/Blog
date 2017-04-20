const mongoose = require('mongoose');
const Article = mongoose.model('Article');


module.exports = {
    index: (req, res) => {
            Article.find({}).limit(8).populate('author').then(articles => {
                let message = req.session['message'];
                let messageType = req.session['messageType'];

                res.render('home/index', {articles: articles, message: message, messageType: messageType});

                delete req.session.message;
                delete req.session.messageType;
            })
    }
};