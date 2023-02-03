const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const session = require('express-session');

const sessionMiddleware = session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 1000*60*60
    }
});

const { Server } = require("socket.io");
const io = new Server(server);

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static('public'));
app.use(sessionMiddleware);

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/lobby', (req, res) => {
    res.render('lobby');
});

app.get('/draw', (req, res) => {
    res.render('draw');
});

app.post('/login',urlencodedParser,async(req, res) => {
    const user = req.body.name;
    req.session.user = user;
    res.status(200).json({'ok':true});
});

app.get('/getLogin',async(req, res) => {
    const user = req.session.user;
    res.status(200).json({
        'ok':true,
        'user':user
    });
});

app.get('/create-room', (req, res) => {
    const roomId = Date.now();
    const user = req.session.user;
    res.status(200).json({'roomId':roomId});
});

//socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const roomInfo = {};
const roomMember = {};
const roomScore = {};
const roomRound = {};
const topic = {};

io.on('connection', (socket) => {
    const userName = socket.request.session.user;
    url = socket.request.headers.referer;
    const leaveRoomId = url.split('=')[1];

    //房間
    socket.on('getRoom',() => {
        io.emit('lobby', roomInfo, roomMember);
    });

    socket.on('roomStatus', (roomId) => {
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId]);
    })

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        if (!roomMember[roomId]){
            roomMember[roomId] = [];
        };
        if(!roomMember[roomId].includes(userName)){
            roomMember[roomId].push(userName);
        };
        roomScore[userName] = 0;
        if (typeof roomInfo[roomId] == 'undefined'){
            roomInfo[roomId] = 'waiting';
        }
        io.emit('lobby', roomInfo, roomMember);
        io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
        io.to(roomId).emit('member', roomMember[roomId]);
        io.to(roomId).emit('score', roomScore);
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId]);
    });

    socket.on("disconnect", () => {
        if (typeof(roomMember[leaveRoomId]) != 'undefined'){
            const index = roomMember[leaveRoomId].indexOf(userName);
            if (index !== -1) {
            roomMember[leaveRoomId].splice(index, 1);
            };
        };
        if (typeof(roomMember[leaveRoomId]) != 'undefined'){
            if (roomMember[leaveRoomId].length == 0){
                delete roomInfo[leaveRoomId];
                delete roomMember[leaveRoomId];
                delete roomScore[userName];
                delete roomRound[leaveRoomId];
                delete topic[leaveRoomId]
            };
        };
        socket.leave(leaveRoomId); 
        io.emit('lobby', roomInfo, roomMember);
        io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
        io.to(leaveRoomId).emit('member', roomMember[leaveRoomId]);
        io.to(leaveRoomId).emit('score', roomScore);
        io.to(leaveRoomId).emit('roomStatus', roomInfo[leaveRoomId], roomMember[leaveRoomId], roomRound[leaveRoomId], topic[leaveRoomId]);
    });

    //聊天室
    socket.on('guess', (msg, roomId) => {
        io.to(roomId).emit('guess', msg, userName);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
    });

    //畫畫
    socket.on('beginDraw', (point, roomId) => {
        socket.broadcast.to(roomId).emit('beginDraw', point);
    });

    socket.on('draw', (point, roomId) => {
        socket.broadcast.to(roomId).emit('draw', point);
     });

    socket.on('endDraw', (roomId) => {
        socket.broadcast.to(roomId).emit('endDraw');
    });

    //遊戲流程
    const topics = ['烏龜','貓','狗','兔子','馬','馬桶','螞蟻'];
    const topicLength = topics.length;

    socket.on('beginGame', (roomId) => {
        roomInfo[roomId] = 'playing';
        roomRound[roomId] = 0;
        const topicIndex = Math.floor(Math.random()*topicLength);
        topic[roomId] = topics[topicIndex];
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId]);
    });

    socket.on('topic', (roomId) => {
        io.to(roomId).emit('topic', topic[roomId]);
    });

    socket.on('win',(roomId, user) => {
        const topicIndex = Math.floor(Math.random()*topicLength);
        topic[roomId] = topics[topicIndex];
        if (roomRound[roomId]+1 == roomMember[roomId].length){
            roomRound[roomId] = 0;
        }else{
            roomRound[roomId] ++;
        };
        roomScore[user] ++;
        io.to(roomId).emit('winScore', roomScore[user], user);
        io.to(roomId).emit('winMessage', user)
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId]);
    });
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
