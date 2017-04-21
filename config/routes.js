const userController = require('./../controllers/user');
const homeController = require('./../controllers/home');
const articleController = require('./../controllers/article');
const commentController = require('./../controllers/comment');
const adminController = require('./../controllers/admin/admin');

module.exports = (app) => {
    app.get('/', homeController.index);

    app.get('/user/register', userController.registerGet);
    app.post('/user/register', userController.registerPost);

    app.get('/user/login', userController.loginGet);
    app.post('/user/login', userController.loginPost);

    app.get('/article/create', articleController.createGet);
    app.post('/article/create', articleController.createPost);

    app.get('/article/details/:id', articleController.details);
    app.post('/article/details/:id', commentController.commentPost);

    app.get('/user/details', userController.details);

    app.get('/user/logout', userController.logout);

    app.get('/user/details-edit/:id', userController.detailsEditGet);
    app.post('/user/details-edit/:id', userController.detailsEditPost);

    app.get('/article/edit/:id', articleController.editGet);
    app.post('/article/edit/:id', articleController.editPost);

    app.get('/article/delete/:id', articleController.deleteGet);
    app.post('/article/delete/:id', articleController.deletePost);

    app.use((req,res, next) => {
        if(req.isAuthenticated()){
            req.user.isInRole('Admin').then(isAdmin => {
                if(isAdmin){
                    next();
                } else {
                    res.redirect('/');
                }
            })
        } else {
            res.redirect('/user/login');
        }
    });

    app.get('/admin/user/data', adminController.user.data);

    app.get('/admin/user/edit/:id', adminController.user.editGet);
    app.post('/admin/user/edit/:id', adminController.user.editPost);

    app.get('/admin/user/delete/:id', adminController.user.deleteGet);
    app.post('/admin/user/delete/:id', adminController.user.deletePost);
};