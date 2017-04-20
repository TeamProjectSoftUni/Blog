const User = require('mongoose').model('User');

module.exports = {
    data: (req, res) => {
        User.find({}).then(users => {

            for(let user of users) {
                user.isInRole('Admin').then(isAdmin => {
                    user.isAdmin = isAdmin;
                });
            }

            res.render('admin/user/data', {users:users})
        });
    }
};