var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    firstname: String,
    lastname: String,
    company: String,
    levelAuth: String, // Level only to auth 
    type: String, // Level only for users
    token: String,
    webTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebType'},
});

userSchema.pre('save', function (next) {
    var user = this;

    if(!user.isModified('password')) return next();
    bcrypt.hash(user.password, null, null, (err, hash) => {
        if(err) return next(err);
        user.password = hash;
        next();
    })
});

module.exports = mongoose.model('User', userSchema);
