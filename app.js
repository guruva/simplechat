var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 5000));
app.get('/home', function(req, res){
   res.sendFile(__dirname + '/view/index.html');
});

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'arun_simple_chat') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});

var Collection = ['users'];
var db = require("mongojs").connect("chatdb",Collection);
function user(name,address,email){
    this.name = name;
    this.address = address;
    this.email = email;
}
app.get('/users', function(req, res, next){
  res.setHeader('Access-Control-Allow-Origin','*');
    console.log(req.query.name);
    console.log("GET")
    var user1 =new user(req.query.name,"","")
    db.users.save(user1,function(err,saveddata){
    if(err){
        console.log("Error through on save ",err)
    }
    else{
        console.log("successfully saved....")
    }
    });
 
});

app.get('/usersAll', function(req, res, next){
  res.setHeader('Access-Control-Allow-Origin','*');
    console.log(req.query.name);
    console.log("GET")
    db.users.find().limit(20).sort({postedOn : -1} , function(err , success){
        console.log('Response success '+success);
        console.log('Response error '+err);
        if(success){
            res.send(200 , success);
            return next();
        }else{
            return next(err);
        }
 
    });
 
});



// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});

http.listen(app.get('port'), function(){
  console.log('listening on *:5000');
});