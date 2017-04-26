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
    },

    commentDelete: (req, res) => {
    let id = req.params.id;

    Comment.findOneAndRemove({_id: id}).populate('article').then(comment => {
        let comments = comment.article.comments;

        let index = comments.indexOf(comment.id);

        if(index < 0) {
            let errorMsg = "Comment was not found";
            res.render('article/comment-delete', {error: errorMsg})
        } else {
            let count = 1;
            comments.splice(index, count);
            comment.article.save().then(() => {
                res.redirect(`/article/details/${comment.article.id}`);
            });
        }
    })
    }
};