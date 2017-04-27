const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const encryption = require('./../../utilities/encryption');

module.exports = {
    data: (req, res) => {
        User.find({}).then(users => {

            let isAdmin = req.user.isInRole('Admin');
            res.render('admin/user/data', {users: users})
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
            if (user) {
                errorMsg = 'User with this username already exists!';
            } else if (!userArgs.email) {
                errorMsg = 'Email cannot be null!';
            } else if (!userArgs.fullName) {
                errorMsg = 'Name cannot be null!';
            } else if (userArgs.password !== userArgs.confirmedPassword) {
                errorMsg = 'Passwords do not match!'
            } else if (!userArgs.roles) {
                errorMsg = 'Please select at least one role!';
            }

            if (errorMsg) {
                req.session['messageType'] = "danger";
                req.session['message'] = errorMsg;

                res.redirect(`/admin/user/edit/${id}`);
            } else {
                User.findOne({_id: id}).then(user => {
                    user.email = userArgs.email;
                    user.fullName = userArgs.fullName;
                    user.roles = [];
                    let passwordHash = user.passwordHash;
                    if (userArgs.password) {
                        passwordHash = encryption.hashPassword(userArgs.password, user.salt);
                    }

                    user.passwordHash = passwordHash;

                    for (let roleName of userArgs.roles) {
                        Role.findOne({name: roleName}).then(role => {
                            if (!role) {
                                res.render('admin/user/edit', {error: "Role not found in database."});
                                return;
                            }

                            let userIsNotInRole = role.users.indexOf(user.id) == -1;
                            if (userIsNotInRole) {
                                role.users.push(user.id);
                            }

                            role.save((err) => {
                                if (err) {
                                    res.render('/', {error: "Unable to save user inside roles table. Please try again later"});
                                }
                            });

                            user.roles.push(role.id);
                            user.save((err) => {
                                if (err) {
                                    res.render('/', {error: "Unable to save role inside user table. Please try again later"});
                                }
                            })
                        });
                    }


                    // Makes sure user id is removed from all unwanted roles.
                    Role.find({}).then(roles => {
                        // Returns all roles which should be deactivated for the user
                        let inactiveRoles = roles.filter(r => userArgs.roles.indexOf(r.name) == -1);

                        for (let i = 0; i < inactiveRoles.length; i++) {
                            let userIdIndex = inactiveRoles[i].users.indexOf(user.id);
                            if (userIdIndex == -1) {
                                continue;
                            }

                            inactiveRoles[i].users.splice(userIdIndex, 1);
                            inactiveRoles[i].save();
                        }
                    });

                    res.redirect('/admin/user/data');
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