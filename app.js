require('dotenv').config();
let createError = require('http-errors');
let express = require('express');
let app = express();
let path = require('path');
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);
let debug = require('debug')('clackserver:server');
let mongoose = require('mongoose');
let cors = require('cors');


app.get('/', (req, res) => {
  
  res.json({
    
  })
  //open a connection with socket IO
  io.sockets.on('connection', (socket) => {
    let query = Messages.find({});
    //setting the limit of messages to fetch
    query.sort('-created').limit(200).exec((err, docs) => {
        if(err) throw err;
        socket.emit('load old', docs);
    });

    connections.push(socket); //pushing all connections into our connections array
    //console.log('Connected: %s sockets connected', connections.length);

    
    //Send Messages
    socket.on('public message', function(data){
        //let msg = data.msg;
        //let msgsender = data.msgsender;
      //creates a document in the database
        var newMsg = new Messages({
          message: data.msg,
          msgsender: data.msgsender,
          image: data.image
        });
        newMsg.save(function(err){
            if(err) throw err;
            io.sockets.emit('public response', {msgsender: data.msgsender, message: data.msg, image: data.image});//emits a general message with the msg: data 
            //console.log("Saved to the database");
        }); 
    });


  /*Handles private messaging
    joins the two url's acting as the two rooms to one socket
    socket.on('join PM', (pm) => {
      socket.join(pm.room1);
      socket.join(pm.room2);
    });

    socket.on('private message', (message) => {
        console.log(message);
    });
  */

    socket.on('disconnect', function(data) {
      //if(!socket.username) return;//if a username can no longer be found, hold on and remove the username
      //users.splice(users.indexOf(socket.username), 1);//on disconnect, removes this user from the array of users
      delete people[socket.username];
      //updateUsernames();
      connections.splice(connections.indexOf(socket), 1);
      //console.log('Disconnected: %s sockets connected', connections.length);
    });

  });

});


mongoose.Promise = require('bluebird');

//connect to the  database
//const connect = mongoose.connect('mongodb://adminclack:adminclack2018@ds125241.mlab.com:25241/clack_db', {});
const connect = mongoose.connect(process.env.MONGODB_URI, {})
//console.log(process.env.MONGODB_URI);
connect.then((db) => {
  //console.log('Connected correctly to server db mlab');
  //console.log(process.env.MONGODB_URI);
}, (err) => { console.log(err); });

//Message Schema
let messageSchema = mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    msgsender: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
 }, {
        timestamps: true
})

let Messages = mongoose.model('messages', messageSchema);

/*
app.all('*', (req, res, next) => {
  if(req.secure) {
    return next();
  }
  else {
    res.redirect(307, 'https://' + req.hostname + ':' + app.get('secPort') + req.url);
  }
}); 

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use(session({
  name: 'session-id',
  secret: '12345-23456-34567-45678',
  saveUninitialized: false,
  resave: false,
  store: new fileStore()
}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/messages', generalMsgRouter);
app.use('/messages/:names', privateMsgRouter);
*/
app.use(cors());

people = {};

//app active 
connections = [];

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

//error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

var port = normalizePort(process.env.PORT || '3002');
app.set('port', port);
server.listen(port);
server.on('listening', onListening);
server.on('error', onError);
//console.log('Server runing');