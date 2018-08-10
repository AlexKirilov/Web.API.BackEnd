var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var AuthSchema = new mongoose.Schema({
    siteID: { type: mongoose.Schema.Types.ObjectId, ref: 'Site'},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstname: { type: String, default: '' },
    lastname: { type: String, default: '' },
    company: { type: String, default: '' },
    levelAuth: { type: String, default: 'CU' }, /* Level of Auth // SA -> SysAdmin // AD -> Admin // MN -> Manager // EE -> Employee // CU -> Customer // GU -> Guest */
    type: { type: String, default: '' }, // Level only for users
    GDPR: { type: Boolean, default: false },
    created: { type: Date, default: new Date ().toISOString() },
    lastLogin: { type: Date, default: new Date ().toISOString() },
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
