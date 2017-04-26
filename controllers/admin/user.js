const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const encryption = require('./../../utilities/encryption');

module.exports = {
    data: (req, res) => {
        User.find({}).then(users => {

            let isAdmin = req.user.isInRole('Admin');
            res.render('admin/user/data', {users:users})
        });
    },

    editGet: (req, res) => {
        let id = req.params.id;

        User.findById(id).then(user => {
            Role.find({}).then(roles => {
                for (let role of roles) {
                    if (user.roles.indexOf(role.id) !== -1) {
                        role.isChecked = true;
                    }
                }

                let message = req.session['message'];
                let messageType = req.session['messageType'];

                res.render('admin/user/edit', {user: user, roles: roles, message: message, messageType: messageType});
            })
        });
    },

    editPost: (req, res) => {
        let id = req.params.id;
        let userArgs = req.body;

        User.findOne({email: userArgs.email, _id: {$ne: id}}).then(user => {
            let errorMsg = '';
            if(user) {
                errorMsg = 'User with this username already exists!';
            } else if (!userArgs.email) {
                errorMsg = 'Email cannot be null!';
            } else if (!userArgs.fullName) {
                errorMsg = 'Name cannot be null!';
            } else if (userArgs.password !== userArgs.confirmedPassword) {
                errorMsg = 'Passwords do not match!'
            }  else if (!userArgs.roles) {
                errorMsg = 'Please select at least one role!';
            }

            if (errorMsg) {
                req.session['messageType'] = "danger";
                req.session['message'] = errorMsg;

                res.redirect(`/admin/user/edit/${id}`);
            } else {
                Role.find({}).then(roles => {
                    if (!userArgs.roles){
                        userArgs.roles = [];
                    }
                    let newRoles = roles.filter(role => {
                        return userArgs.roles.indexOf(role.name) !== -1;
                    }).map(role => {
                        return role.id;
                    });

                    User.findOne({_id: id}).then(user => {
                        user.email = userArgs.email;
                        user.fullName = userArgs.fullName;

                        let passwordHash = user.passwordHash;
                        if(userArgs.password) {
                            passwordHash = encryption.hashPassword(userArgs.password, user.salt);
                        }

                        user.passwordHash = passwordHash;
                        user.roles = newRoles;

                        user.save((err) => {
                            if (err) {
                                res.redirect('/');
                            } else {
                                res.redirect('/admin/user/data');
                            }
                        })
                    });
                });
            }
        });
    },

    deleteGet: (req, res) => {
        let id = req.params.id;
        User.findById(id).then(user => {
            res.render('admin/user/delete', {userToDelete: user})
        });
    },

    deletePost: (req, res) => {
        let id = req.params.id;

        User.findOneAndRemove({_id: id}).then(user => {
            user.prepareDelete();
            res.redirect('/admin/user/data');
        });
    }
};