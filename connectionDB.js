const mongoose = require('mongoose');
require('dotenv').config({ path: 'variables.env'});
mongoose.set('useCreateIndex', true);

// const options = {
//     rememberUpgrade: true,
//     transports: ['polling'],
//     secure: false,
//     rejectUnauthorized: false,
//     origins: '*:*'
// };

mongoose.Promise = Promise;

// const io = require('socket.io')(http, options);
// client.listen(4567).sockets;

// const { Server } = require('ws');
// const wss = new Server({ server });

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
            // console.log('mongo_uri ', http.MONGODB_URI);
        } else {
            console.log('Coonection ERROR => ', err);
        }
        // io.on('connection', (socket) => {
        //     let chat = db.collection('chat');

        //     // create func to send status
        //     sendStatus = (s) => {
        //         socket.emit('status', s);
        //     }

        //     chat.find().limit(50).sort({ _id: 1 }).toArray((err, res) => {
        //         if (err) { throw err; }
        //         socket.emit('output', res);
        //     });

        //     socket.on('input', (data) => {
        //         chat.insertOne(data, () => {
        //             io.emit('output', data);

        //             sendStatus({
        //                 message: 'Message send',
        //                 clear: true
        //             })
        //         });
        //     });

        //     socket.on('clear', (data) => {
        //         chat.deleteMany({}, () => {
        //             socket.emit('cleared');
        //         })
        //     })
        // });
    });
}

module.exports = connectDB;