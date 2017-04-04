const passport = require('passport');
const LocalPassport = require('passport-local');
const User = require('./../models/User');

const authenticateUser = (username, password, done) => {
    User.findOne({email: username}).then(user => {
        if(!user){
            return done(null, false);
        }

        if (!user.authenticate(password)) {
            return done(null, false);
        }

        return done(null, user);
    });
};