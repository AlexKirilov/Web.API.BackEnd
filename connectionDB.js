require('dotenv').config({ path: 'variables.env'});

const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.Promise = Promise;

const connectDB = async () => {
    await mongoose.connect(
    process.env.MONGODB_URI || devEnv, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    }, 
    (err, db) => {
        if (!err) {
            console.log('connected to mongo ');
        } else {
            console.log('Coonection ERROR => ', err);
        }
    });
}

module.exports = connectDB;