const Article = require('mongoose').model('Article');
const Comment = require('mongoose').model('Comment');

module.exports = {
    createGet: (req, res) => {
        res.render('article/create');
    },

    createPost: (req, res) => {
        let articleArgs = req.body;

        let errorMsg = '';

        if (!req.isAuthenticated()) {
            errorMsg = 'Please login first :P'
        } else if (!articleArgs.title) {
            errorMsg = 'Invalid Title!';
        } else if (!articleArgs.content) {
            errorMsg = 'Invalid Content';
        }

        if (errorMsg) {
            res.render('article/create', {error: errorMsg});
            return;
        }

        let image = req.files.image;

        if (image) {
            let fileNameAndExtension = image.name;
            let separatorIndex = fileNameAndExtension.lastIndexOf('.');
            let fileName = fileNameAndExtension.substring(0, separatorIndex);
            let extension = fileNameAndExtension.substring(separatorIndex + 1);

            let randomSymbols = require('./../utilities/encryption').generateSalt().substring(0, 5).replace(/\//g, 'd');
            let finalFileName = `${fileName}_${randomSymbols}.${extension}`;

            image.mv(`../public/images/${finalFileName}`, err => {
                if (err) {
                    console.log(err.message);
                }
            });
            articleArgs.imagePath = `/images/${finalFileName}`;
        }

        articleArgs.author = req.user.id;
        Article.create(articleArgs).then(article => {
            req.user.articles.push(article.id);
            req.user.save(err => {
                if (err) {
                    res.redirect('/', {error: err.message})
                } else {
                    res.redirect('/')
                }
            })
        });
    },

    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author').populate('comments').then(article => {

            if (!req.user) {
                res.render('article/details', {article: article, isUserAuthorized: false});
                return;
            }

            req.user.isInRole('Admin').then(isAdmin => {
                let isAuthor = req.user.isAuthor(article);

                let isUserAuthorized = isAdmin || isAuthor;

                res.render('article/details', {article: article, isUserAuthorized: isUserAuthorized});
            });
        })
    },

    editGet: (req, res) => {
        let id = req.params.id;

        if (!req.isAuthenticated()) {
            let returnUrl = `article/edit/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if (!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }

                res.render('article/edit', article)
            });
        });
    },

    editPost: (req, res) => {
        let id = req.params.id;

        let articleArgs = req.body;

        let errorMsg = '';

        if (!articleArgs.title) {
            errorMsg = 'Article title cannot be empty!';
        } else if (!articleArgs.content) {
            errorMsg = 'Article content cannot be empty!';
        }

        if (errorMsg) {
            res.render('article/edit', {error: errorMsg});
            return;
        }

        let image = req.files.image;

        if (image) {
            let fileNameAndExtension = image.name;
            let separatorIndex = fileNameAndExtension.lastIndexOf('.');
            let fileName = fileNameAndExtension.substring(0, separatorIndex);
            let extension = fileNameAndExtension.substring(separatorIndex + 1);

            let randomSymbols = require('./../utilities/encryption').generateSalt().substring(0, 5).replace(/\//g, 'd');
            let finalFileName = `${fileName}_${randomSymbols}.${extension}`;

            image.mv(`../public/images/${finalFileName}`, err => {
                if (err) {
                    console.log(err.message);
                }
            });
            articleArgs.imagePath = `/images/${finalFileName}`;
        }

        Article.update({_id: id}, {
            $set: {
                title: articleArgs.title,
                content: articleArgs.content,
                imagePath: articleArgs.imagePath
            }
        }).then(updateStatus => {
            res.redirect(`/article/details/${id}`);
        });
    },

    deleteGet: (req, res) => {
        let id = req.params.id;

        if (!req.isAuthenticated()) {
            let returnUrl = `article/delete/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if (!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }

                res.render('article/delete', article)
            });
        });
    },

    deletePost: (req, res) => {
        let id = req.params.id;

        Article.findOneAndRemove({_id: id}).populate('author').then(article => {
            let author = article.author;

            let index = author.articles.indexOf(article.id);

            if (index < 0) {
                let errorMsg = 'Article was not found for that author!';
                res.render('article/delete', {error: errorMsg})
            } else {
                let count = 1;
                author.articles.splice(index.count);
                author.save().then((user) => {
                    res.redirect('/');
                });
            }
        })
    }
};