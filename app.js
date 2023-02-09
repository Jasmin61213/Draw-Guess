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
    if (typeof(user) == 'undefined'){
        res.status(400).json({'error':true});
    }else{
        res.status(200).json({
            'ok':true,
            'user':user
        });
    };
});

app.get('/create-room', (req, res) => {
    const roomId = Date.now();
    res.status(200).json({'roomId':roomId});
});

//socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const roomInfo = {};
const roomMember = {};
const roomScore = {};
const roomRound = {};
const roundChange = {};
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
        roundChange[roomId] = false;
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId], roundChange[roomId]);
    })

    socket.on('join-room', (roomId) => {
        roundChange[roomId] = false;
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
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId], roundChange[roomId]);
    });

    socket.on("disconnect", () => {
        roundChange[leaveRoomId] = false;
        const leaveUser = roomMember[leaveRoomId];
        const leaveRound = roomRound[leaveRoomId];
        if (typeof(roomMember[leaveRoomId]) != 'undefined'){
            if (userName == leaveUser[leaveRound]){
                roundChange[leaveRoomId] =true;
            };
            // console.log(roomMember[leaveRoomId])
            const index = roomMember[leaveRoomId].indexOf(userName);
            if (index !== -1) {
            roomMember[leaveRoomId].splice(index, 1);
            };
            // console.log(roomMember[leaveRoomId].length)
            if (roomMember[leaveRoomId].length == 1){
                roomInfo[leaveRoomId] = 'waiting';
            }
            if (roomMember[leaveRoomId].length == 0){
                delete roomInfo[leaveRoomId];
                delete roomMember[leaveRoomId];
                delete roomScore[userName];
                delete roomRound[leaveRoomId];
                delete roundChange[leaveRoomId];
                delete topic[leaveRoomId];
            };
        };
        // console.log(roomInfo[leaveRoomId])
        // if (typeof(roomMember[leaveRoomId]) != 'undefined'){
        //     const index = roomMember[leaveRoomId].indexOf(userName);
        //     if (index !== -1) {
        //     roomMember[leaveRoomId].splice(index, 1);
        //     };
        // };
        // if (typeof(roomMember[leaveRoomId]) != 'undefined'){
        //     if (roomMember[leaveRoomId].length == 0){
        //         delete roomInfo[leaveRoomId];
        //         delete roomMember[leaveRoomId];
        //         delete roomScore[userName];
        //         delete roomRound[leaveRoomId];
        //         delete roundChange[leaveRoomId];
        //         delete topic[leaveRoomId];
        //     };
        // };
        socket.leave(leaveRoomId); 
        io.emit('lobby', roomInfo, roomMember);
        io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
        io.to(leaveRoomId).emit('member', roomMember[leaveRoomId]);
        io.to(leaveRoomId).emit('score', roomScore);
        io.to(leaveRoomId).emit('roomStatus', roomInfo[leaveRoomId], roomMember[leaveRoomId], roomRound[leaveRoomId], topic[leaveRoomId], roundChange[leaveRoomId]);
    });

    //聊天室
    socket.on('guess', (msg, roomId) => {
        io.to(roomId).emit('guess', msg, userName);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
    });

    socket.on('nextDraw', (roomId) => {
        let users = roomMember[roomId];
        let round = roomRound[roomId];
        io.to(roomId).emit('nextDraw', users[round]);
    });

    socket.on('lose', (roomId) => {
        io.to(roomId).emit('lose');
    })

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

    socket.on('brushChanged', (roomId, color, width) => {
        socket.broadcast.to(roomId).emit('brushChanged', color, width);
    });

    //遊戲流程
    const topics = ['向日葵','蘋果','青蛙','光頭','西瓜','獅子','耳朵','皮卡丘',
        '腳踏車','鋼琴','火車','棉花糖','漢堡','翻車魚','望遠鏡','相機'];
    const topicsLength = topics.length;

    socket.on('beginGame', (roomId) => {
        roundChange[roomId] = true;
        roomInfo[roomId] = 'playing';
        roomRound[roomId] = 0;
        const topicIndex = Math.floor(Math.random()*topicsLength);
        topic[roomId] = topics[topicIndex];
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId], roundChange[roomId]);
    });

    socket.on('win', (roomId, user) => {
        roundChange[roomId] = true;
        let Users = roomMember[roomId];
        let round = roomRound[roomId];
        let drawUser = Users[round];
        roomScore[drawUser] ++;
        roomScore[user] ++;
        const topicIndex = Math.floor(Math.random()*topicsLength);
        topic[roomId] = topics[topicIndex];
        if (typeof(roomMember[roomId]) != 'undefined'){
            if (roomRound[roomId]+1 == roomMember[roomId].length){
                roomRound[roomId] = 0;
            }else{
                roomRound[roomId] ++;
            };
        };
        // io.to(roomId).emit('stopTime');
        io.to(roomId).emit('winScore', roomScore[user], user, roomScore[drawUser], drawUser);
        io.to(roomId).emit('winMessage', user);
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId], roundChange[roomId]);
    });

    socket.on('nextRound', (roomId) => {
        roundChange[roomId] = true;
        const topicIndex = Math.floor(Math.random()*topicsLength);
        topic[roomId] = topics[topicIndex];
        if (typeof(roomMember[roomId]) != 'undefined'){
            if (roomRound[roomId]+1 == roomMember[roomId].length){
                roomRound[roomId] = 0;
            }else{
                roomRound[roomId] ++;
            };
        };
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomRound[roomId], topic[roomId], roundChange[roomId]);
    })

    socket.on('getTime', (roomId, count) => {
        socket.broadcast.to(roomId).emit('getTime', count);
    });

    socket.on('stopTime', (roomId) => {
        socket.broadcast.to(roomId).emit('stopTime');
    })
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
