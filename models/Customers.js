var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var customerSchema = new mongoose.Schema({
    siteOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    email: String,
    password: String,
    firstname: String,
    lastname: String,
    company: String,
    levelAuth: String, // Level only to auth 
    type: String, // Level only for users
    GDPR: Boolean,
    token: String
});

customerSchema.pre('save', function (next) {
    var user = this;

    if(!user.isModified('password')) return next();
    bcrypt.hash(user.password, null, null, (err, hash) => {
        if(err) return next(err);
        user.password = hash;
        next();
    })
});

module.exports = mongoose.model('Customers', customerSchema);
