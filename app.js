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

app.get('/lobby', (req, res) => {
    res.render('lobby')
});

app.get('/draw', (req, res) => {
    res.render('draw')
});

let players = [];

app.post('/login',urlencodedParser,async(req, res) => {
    const user = req.body.name;
    console.log(user)
    if (players.includes(user)){
        res.status(400).json({'error':true})
    }else{
        players.push(user)
        req.session.user = user;
        res.status(200).json({'ok':true})
    }
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
    let userName = socket.request.session.user

    //房間
    socket.on('create-room', () => {
        const roomId = Date.now();
        socket.join(roomId);
        io.to(roomId).emit('create-room', roomId);
    });

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
        // socket.leave(roomId);
        // io.to(roomId).emit('leaveToRoom', `${userName}離開了！`);
    });

    // socket.on('leave-room', (roomId) => {
    //     socket.leave(roomId);
    //     io.to(roomId).emit('leaveToRoom', `${userName}離開了！`);
    // });

    //聊天室
    socket.on('guess', (msg, roomId) => {
        io.to(roomId).emit('guess', msg, userName);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
    });

    //畫畫
    socket.on('beginDraw', function(point, roomId){
        io.to(roomId).emit('beginDraw', point);
    });

    socket.on('draw', function(point, roomId) {
        io.to(roomId).emit('draw', point);
     });

    socket.on('endDraw', function(roomId) {
        io.to(roomId).emit('endDraw');
    });
  });

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
