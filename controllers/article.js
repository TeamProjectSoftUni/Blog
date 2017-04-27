const Article = require('mongoose').model('Article');
const Comment = require('mongoose').model('Comment');
const Category = require('mongoose').model('Category');
const Tag = require('mongoose').model('Tag');
const initializeTags = require('./../models/Tag').initializeTags;

module.exports = {
    createGet: (req, res) => {
        if (!req.isAuthenticated()) {
            let returnUrl = '/article/create';
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Category.find({}).then(categories => {
            res.render('article/create', {categories: categories})
        })
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

            image.mv(`./public/images/${finalFileName}`, err => {
                if (err) {
                    console.log(err.message);
                }
            });
            articleArgs.imagePath = `/images/${finalFileName}`;
        }

        articleArgs.author = req.user.id;
        articleArgs.tags = [];
        Article.create(articleArgs).then(article => {
            let tagNames = articleArgs.tagNames.split(/\s+|,/).filter(tag => {
                return tag
            });
            initializeTags(tagNames, article.id);

            article.prepareInsert();
            res.redirect('/');
        });
    },

    details: (req, res) => {
        let id = req.params.id;
        Article.findById(id).populate('author tags').populate('comments').then(article => {

            if (!req.user) {
                res.render('article/details', {article: article, isUserAuthorized: false});
                return;
            }

            req.user.isInRole('Admin').then(isAdmin => {
                req.user.isInRole('Moderator').then(isModerator => {
                    let isAuthor = req.user.isAuthor(article);

                    let isUserAuthorized = isAdmin || isModerator || isAuthor;

                    res.render('article/details', {article: article, isUserAuthorized: isUserAuthorized});
                });
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

        Article.findById(id).populate('tags').then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                req.user.isInRole('Moderator').then(isModerator => {
                    if (!isAdmin && !req.user.isAuthor(article) && !isModerator) {
                        res.redirect('/');
                        return;
                    }
                    Category.find({}).then(categories => {
                        article.categories = categories;

                        article.tagNames = article.tags.map(tag => {
                            return tag.name
                        });
                        res.render('article/edit', article)
                    });
                });
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

            image.mv(`./public/images/${finalFileName}`, err => {
                if (err) {
                    console.log(err.message);
                }
            });
            articleArgs.imagePath = `/images/${finalFileName}`;
        }

        Article.findById(id).populate('category tags').then(article => {
            if (article.category.id !== articleArgs.category) {
                article.category.article.remove(article.id);
                article.category.save();
            }
            article.category = articleArgs.category;
            article.title = articleArgs.title;
            article.content = articleArgs.content;
            article.imagePath = articleArgs.imagePath;

            article.save((err) => {
                if (err) {
                    console.log(err.message);
                }

                Category.findById(article.category).then(category => {
                    if (category.article.indexOf(article.id) === -1) {
                        category.article.push(article.id);
                        category.save();
                    }

                    res.redirect(`/article/details/${id}`);
                })
            });
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

        Article.findById(id).populate('category tags').then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                req.user.isInRole('Moderator').then(isModerator => {
                    if (!isAdmin && !req.user.isAuthor(article) && !isModerator) {
                        res.redirect('/');
                        return;
                    }

                    article.tagNames = article.tags.map(tag => {
                        return tag.name
                    });
                    res.render('article/delete', article)
                });
            });
        });
    },

    deletePost: (req, res) => {
        let id = req.params.id;

        Article.findOneAndRemove({_id: id}).then(article => {
            article.prepareDelete();
            res.redirect('/');
        })
    }
};