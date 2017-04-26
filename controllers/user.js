const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const encryption = require('./../utilities/encryption');

module.exports = {
    registerGet: (req, res) => {
        res.render('user/register');
    },

    registerPost: (req, res) => {
        let registerArgs = req.body;

        User.findOne({email: registerArgs.email}).then(user => {
            let errorMsg = '';
            if (user) {
                errorMsg = 'User with the same username exists!';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Passwords do not match!'
            }

            if (errorMsg) {
                res.render('user/register', {registerArgs: registerArgs, messageType: "danger", message: errorMsg})
            } else {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);

                let image = req.files.image;
                let path = '';

                if (image) {
                    let filenameAndExtension = image.name;
                    let filename = filenameAndExtension.substring(0, filenameAndExtension.lastIndexOf('.'));
                    let extension = filenameAndExtension.substring(filenameAndExtension.lastIndexOf('.') + 1);

                    let replaceSlash = /\//g;

                    let randomChars = require('./../utilities/encryption')
                        .generateSalt()
                        .substring(0, 6)
                        .replace(replaceSlash, 'e');

                    let finalFilename = `${filename}_${randomChars}.${extension}`;

                    image.mv(`./public/images/${finalFilename}`, err => {
                        if (err) {
                            console.log(err.message)
                        }
                    });
                    path = registerArgs.imagePath = `/images/${finalFilename}`;
                }

                let userObject = {
                    email: registerArgs.email,
                    passwordHash: passwordHash,
                    fullName: registerArgs.fullName,
                    imagePath: path,
                    firstName: registerArgs.firstName,
                    lastName: registerArgs.lastName,
                    salt: salt,
                };

                let roles = [];
                Role.findOne({name: 'User'}).then(role => {
                    roles.push(role.id);

                    userObject.roles = roles;
                    User.create(userObject).then(user => {
                        user.prepareInsert();
                        req.logIn(user, (err) => {
                            if (err) {
                                registerArgs.error = err.message;
                                res.render('user/register', registerArgs);
                                return;
                            }

                            req.session['message'] = 'User registered successfully!';
                            req.session['messageType'] = 'success';

                            res.redirect('/');
                        })
                    })
                })
            }
        })
    },

    loginGet: (req, res) => {
        res.render('user/login');
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;

        User.findOne({email: loginArgs.email}).then(user => {
            if (!user || !user.authenticate(loginArgs.password)) {
                let errorMsg = 'Either username or password is invalid!';
                res.render('user/login', {loginArgs: loginArgs, messageType: "danger", message: errorMsg});
                return;
            }
            req.logIn(user, (err) => {
                if (err) {
                    console.log(err);
                    res.redirect('/user/login', {error: err.message});
                    return;
                }

                let returnUrl = '/';
                if (req.session.returnUrl) {
                    returnUrl = req.session.returnUrl;
                    delete req.session.returnUrl;
                }

                req.session['message'] = 'User login successfully!';
                req.session['messageType'] = 'success';

                let id = user.id;
                let logDate = new Date();
                User.update({_id: id}, {
                    $set: {
                        lastUserLogin: logDate
                    }
                }).then(updateStatus => {
                    res.redirect(returnUrl);
                });
            })
        })
    },

    details: (req, res) => {
        res.render('user/details');
    },

    detailsEditGet: (req, res) => {
        let id = req.params.id;
        User.findById(id).then(user => {
            res.render('user/details-edit', user)
        });
    },

    detailsEditPost: (req, res) => {

        let id = req.params.id;

        let userArgs = req.body;

        let image = req.files.image;
        let path = '';

        if (image) {
            let filenameAndExtension = image.name;
            let filename = filenameAndExtension.substring(0, filenameAndExtension.lastIndexOf('.'));
            let extension = filenameAndExtension.substring(filenameAndExtension.lastIndexOf('.') + 1);

            let replaceSlash = /\//g;

            let randomChars = require('./../utilities/encryption')
                .generateSalt()
                .substring(0, 6)
                .replace(replaceSlash, 'e');

            let finalFilename = `${filename}_${randomChars}.${extension}`;

            image.mv(`./public/images/${finalFilename}`, err => {
                if (err) {
                    console.log(err.message)
                }
            });
            path = userArgs.imagePath = `/images/${finalFilename}`;

            let errorMsg = '';

            User.update({_id: id}, {
                $set: {
                    imagePath: path,
                    firstName: userArgs.firstName,
                    lastName: userArgs.lastName
                }
            }).then(updateStatus => {
                res.redirect('/user/details');
            });
        }
    },

    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    }
};