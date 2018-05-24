var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var AuthSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    email: String,
    password: String,
    firstname: String,
    lastname: String,
    company: String,
    levelAuth: String, // Level only to auth 
    type: String, // Level only for users
    GDPR: Boolean,
    created: Date,
    lastLogin: Date,
});

AuthSchema.pre('save', function (next) {
    var user = this;

    if(!user.isModified('password')) return next();
    bcrypt.hash(user.password, null, null, (err, hash) => {
        if(err) return next(err);
        user.password = hash;
        next();
    })
});

module.exports = mongoose.model('Auth', AuthSchema);
