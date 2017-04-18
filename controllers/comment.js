const Comment = require('mongoose').model('Comment');
const Article = require('mongoose').model('Article');

module.exports = {
    commentPost: (req, res) => {
        let commentArgs = req.body;

        let errorMsg = '';

        if (!commentArgs.name) {
            errorMsg = 'Invalid Name!';
        } else if (!commentArgs.content) {
            errorMsg = 'Invalid Content';
        }

        if (errorMsg) {
            let articleId = req.params.id;

            Article.findById(articleId).populate('author').then(article => {
                res.render('article/details', article)
            });
            return;
        }

        let articleId = req.params.id;
        commentArgs.article = articleId;
        Comment.create(commentArgs).then(comment => {

            Article.findById(articleId).then(article => {
                article.comments.push(comment.id);

                article.save(err => {
                    if (err) {
                        res.redirect(`/article/details/${articleId}`, {error: err.message})
                    } else {
                        res.redirect(`/article/details/${articleId}`)
                    }
                })
            });
        });
    }
};