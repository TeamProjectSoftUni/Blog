const userController = require('./../controllers/user');
const homeController = require('./../controllers/home');

module.exports = (app) => {
    app.get('/', homeController.index);

    app.get('/user/register', userController.registerGet);
    app.post('/user/register', userController.registerPost);

};