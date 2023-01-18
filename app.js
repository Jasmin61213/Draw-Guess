const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const session = require('express-session')
// const sess = {
//   secret: 'keyboard cat',
//   resave: false,
//   saveUninitialized: false,
// //   cookie: {}
// }

const sessionMiddleware = session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 1000*60*60 // default session expiration is set to 1 hour
    }
});

const { Server } = require("socket.io");
const io = new Server(server);

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static('public'));
app.use(sessionMiddleware);
// app.use(session(sess)) 

app.get('/', (req, res) => {
    res.render('index')
});

app.get('/draw', (req, res) => {
    // console.log(req.session.user)
    res.render('draw')
});

let players = [];
let roomID;

// app.post('/login',urlencodedParser,async(req, res) => {
//     const user = req.body.name;
//     if (players.includes(user)){
//         res.status(400).json({'error':true})
//     }else{
//         players.push(user)
//         req.session.user = user;
//         res.status(200).json({'ok':true})
//     }
// });

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
    let userName = socket.request.session.user
    // console.log(socket.request.session);
    // console.log(socket.rooms); // Set { <socket.id> }
    // socket.join("room1");
    // // console.log(socket.rooms); 
    // const rooms = io.of("/my-namespace").adapter.rooms;
    // console.log(rooms)
    // socket.join("room-"+roomID);
    // io.sockets.in("room-"+roomID).emit('connectToRoom', `${userName}加入了！`);

    // socket.leave("room-"+roomID);
    // io.sockets.in("room-"+roomID).emit('leaveRoom', `${userName}離開了！`);

    // io.of("/").adapter.on("create-room", (room) => {
    //     console.log(`room ${room} was created`);
    //   });

    //   io.of("/").adapter.on("join-room", (room, id) => {
    //     console.log(`socket ${id} has joined room ${room}`);
    //   });

    socket.on('login', (user) => {
        console.log(user)
    });

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.emit('join-room-message', `You've join ${roomId} room`);
        io.sockets.to(roomId).emit('room-brocast', `${socket.id} has join this room`);
    });

    socket.on('create-room', () => {
        const roomId = Date.now();
        socket.join(roomId);
        socket.emit('join-room-message', `You've join ${roomId} room`);
        io.to(roomId).emit('room-brocast', `${socket.id} has join this room`);
    })

    socket.on('guess', (msg, roomId) => {
        io.to(roomId).emit('guess', msg, userName);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
    });

    socket.on('beginDraw', function(point){
        socket.broadcast.emit('beginDraw', point);
    });

    socket.on('draw', function(point) {
        socket.broadcast.emit('draw', point);
     });

    socket.on('endDraw', function() {
        io.emit('endDraw');
    });
  });

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
