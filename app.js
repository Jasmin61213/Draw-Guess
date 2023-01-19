const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const session = require('express-session')

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

app.get('/', (req, res) => {
    res.render('index')
});

app.get('/lobby', (req, res) => {
    res.render('lobby')
});

app.get('/draw', (req, res) => {
    res.render('draw')
});

app.post('/login',urlencodedParser,async(req, res) => {
    const user = req.body.name;
    // console.log(user)
    // if (players.includes(user)){
    //     res.status(400).json({'error':true})
    // }else{
    players.push(user)
    req.session.user = user;
    res.status(200).json({'ok':true})
    // }
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const players = [];

io.on('connection', (socket) => {
    const userName = socket.request.session.user
    url = socket.request.headers.referer;
    const leaveRoomId = url.split('=')[1];

    //房間
    socket.on('create-room', () => {
        const roomId = Date.now();
        // socket.join(roomId);
        io.emit('create-room', roomId);
    });

    socket.on('join-room', (roomId) => {
        if (!players.includes(userName)){
            players.push(userName);
        };
        socket.join(roomId);
        console.log(players);
        io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
    });

    socket.on("disconnect", () => {
        const index = players.indexOf(userName);
        if (index !== -1) {
          players.splice(index, 1);
        };
        io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
    });

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
