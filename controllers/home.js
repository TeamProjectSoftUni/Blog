const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const User = mongoose.model('User');
const Category = mongoose.model('Category');
const Tag = mongoose.model('Tag');

module.exports = {
    index: (req, res) => {
            Article.find({}).limit(8).populate('author').then(articles => {
                Category.find({}).then(categories => {
                let message = req.session['message'];
                let messageType = req.session['messageType'];

                res.render('home/index', {articles: articles, categories: categories, message: message, messageType: messageType});

                delete req.session.message;
                delete req.session.messageType;
            })
            })
    },
    listCategoryArticles: (req, res) => {
        let id = req.params.id;

        Category.findById(id).populate('article').then(category => {
            User.populate(category.article, {path: 'author'}, (err) => {
                if(err) {
                    console.log(err.message);
                }

                Tag.populate(category.articles, {path: 'tags'}, (err) =>{
                    if (err) {
                        console.log(err.message);
                    }
                });

                res.render('home/category', {article: category.article})
            });

        });
    },

    getCategoriesJson: (req, res) => {
        Category.find({}).then(categories => {
            let categoriesObj = [];

            for (let category of categories) {
                let categoryObj = {
                    name: category.name,
                    id: category._id,
                    articlesCount: category.article.length
                };

                categoriesObj.push(categoryObj)
            }

            let categoriesJSON = JSON.stringify(categoriesObj);
            res.send(categoriesJSON);
        });
    }
};