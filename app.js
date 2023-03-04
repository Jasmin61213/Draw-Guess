const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const authRoute = require("./routes/auth");
// const {pool} = require('./model');

// require('dotenv').config();
// const bodyParser = require('body-parser');
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

const session = require('express-session');

const sessionMiddleware = session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 1000*60*60*24
    }
});

// 引入模組
// const redis = require("redis");
// const bluebird = require("bluebird");
// const client = redis.createClient();
// // redis server
// client.on("connect", function() {
//   console.log('redis connected!');
// });
// bluebird.promisifyAll(redis.RedisClient.prototype);

const { Server } = require("socket.io");
const io = new Server(server);

// const { Server } = require("socket.io");
// const { createAdapter } = require("@socket.io/redis-adapter");
// const { createClient } = require("redis");

// const io = new Server(server);

// const pubClient = createClient();
// const subClient = pubClient.duplicate();

// io.adapter(createAdapter(pubClient, subClient));
// io.listen(3000);


app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static('public'));
app.use(sessionMiddleware);

app.use('/api/auth', authRoute)

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/lobby', (req, res) => {
    res.render('lobby');
});

app.get('/draw', (req, res) => {
    res.render('draw');
});

//socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const allRoomInfo = {};
const roomScore = {};
const timers = {};
const restTimers = {};
const counts = {};
const restCounts = {};
let timer;
let restTimer;
// let count;
const topics = [
    '向日葵','口紅','青蛙','光頭','西瓜','獅子','耳朵','皮卡丘','立可帶','警車',
    '腳踏車','鋼琴','台鐵','棉花糖','麥當勞漢堡','翻車魚','望遠鏡','相機','螞蟻','牛頭馬面',
    '海馬','耳機','手機','珍珠奶茶','時鐘','手錶','麥當勞薯條','馬鈴薯','番茄','菠菜',
    '老師','黑板','電風扇','國旗','口罩','枕頭','棉被','滅火器','警察','鴕鳥','電腦',
    '企鵝','老鷹','熊貓','穿山甲','袋鼠','洗衣機','電視','糖葫蘆','拉麵','火鍋','高速公路','高鐵',
    '長頸鹿','鸚鵡','內褲','音響','安全帽','豆漿','吉他','弓箭',
    '鯨魚','紅綠燈','斑馬線','火影忍者','外星人','大隊接力','美人魚','雪人','馬桶',
    '地圖','飛機','羊入虎口','鴨嘴獸泰瑞','海綿寶寶','旋轉木馬','葡萄汁','虎頭蛇尾','仙人掌','對牛彈琴',
    '七上八下','吸血鬼','機器人','恐龍','蚊子','螢火蟲','毛毛蟲','一石二鳥','火龍果','螞蟻上樹','摩斯漢堡',
    '櫻花','除濕機','廚師','外套','暴龍','翼手龍','衛生紙','聖誕花圈','手槍','雞飛狗跳','熱氣球','暖暖包',
    '漫畫','公主','白馬王子','睡美人','白雪公主','小矮人','神燈','電蚊拍','鳥居','神社','流氓','西洋劍',
    '魟魚','垃圾袋','垃圾車','啤酒','泡菜','煙火','牛仔褲','章魚燒','鰻魚飯','三明治','炒麵麵包','麥克風',
    '米老鼠','三眼怪','麥克華斯基','迪士尼','火箭隊'
];
const topicsLength = topics.length;

io.on('connection', (socket) => {
    const userName = socket.request.session.user;
    url = socket.request.headers.referer;
    const leaveRoomId = url.split('=')[1];

    //大廳
    socket.on('getRoom',() => {
        io.emit('lobby', allRoomInfo);
    });

    socket.on('checkRoom', (roomId) => {
        let check;
        if (allRoomInfo[roomId]){
            check = true;
        }else{
            check = false;
        };
        io.to(socket.id).emit('checkRoom', check);
    });

    //房間
    socket.on('createRoom', (maxMember, maxScore, publics) => {
        const roomId = Date.now();
        let room = {};
        room.roomMaxMember = maxMember;
        room.roomMaxScore = maxScore;
        room.roomPublic = publics;
        room.host = userName;
        room.roomDraw = 0;
        room.drawer = userName;
        room.roomStatus = 'waiting';
        room.correctNum = 0;
        allRoomInfo[roomId] = room;
        socket.emit('createRoom', (roomId));
    });

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        let thisRoom = allRoomInfo[roomId];
        if (typeof(thisRoom) != 'undefined'){
            if (!thisRoom.roomMember){
                thisRoom.roomMember = [];
            };
            if(!thisRoom.roomMember.includes(userName)){
                thisRoom.roomMember.push(userName);
            };
            roomScore[userName] = 0;
            allRoomInfo[roomId] = thisRoom;
            io.emit('lobby', allRoomInfo);
            io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
            io.to(roomId).emit('member', thisRoom.roomMember);
            io.to(roomId).emit('score', roomScore);
            io.to(socket.id).emit('roomMaxScore', thisRoom.roomMaxScore);
            io.to(roomId).emit('roomInfo', thisRoom);
        };
    });

    socket.on('getTimer' , (roomId) => {
        let thisRoom = allRoomInfo[roomId];
        if (typeof(thisRoom) != 'undefined'){
            io.to(socket.id).emit('getTimer', counts[roomId], restCounts[roomId], thisRoom.roomStatus);
        };
    });

    socket.on("disconnect", () => {
        let thisRoom = allRoomInfo[leaveRoomId];
        socket.leave(leaveRoomId); 
        if (typeof(thisRoom) != 'undefined'){
            if (typeof(thisRoom.roomMember) != 'undefined'){
                //刪除成員
                const index = thisRoom.roomMember.indexOf(userName);
                if (index !== -1) {
                    thisRoom.roomMember.splice(index, 1);
                };
                //通知成員離開
                if (typeof(userName) != 'undefined'){
                    io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
                };
                if (thisRoom.roomStatus == 'playing'){
                    if (userName == thisRoom.host){
                        thisRoom.host = thisRoom.roomMember[0];
                    };
                    if (userName == thisRoom.drawer){
                        thisRoom.roomStatus = 'resting';
                        if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
                            thisRoom.roomDraw = 0;
                        }else{
                            thisRoom.roomDraw ++;
                        };
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                        allRoomInfo[leaveRoomId] = thisRoom;
                        io.to(leaveRoomId).emit('nextDrawer', thisRoom.drawer);
                        io.to(leaveRoomId).emit('stopTimer');
                        io.to(leaveRoomId).emit('stopGetTimer');
                        io.to(leaveRoomId).emit('startTimer', thisRoom.roomStatus, thisRoom.host);
                    };
                    if (thisRoom.roomDraw == thisRoom.roomMember.length){
                        thisRoom.roomDraw = 0;
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                        allRoomInfo[leaveRoomId] = thisRoom;
                    };
                    if (thisRoom.roomMember.length == 1){
                        clearInterval(timers[leaveRoomId]);
                        clearInterval(restTimers[leaveRoomId]);
                        delete timers[leaveRoomId];
                        delete restTimers[leaveRoomId];
                        io.to(leaveRoomId).emit('stopTimer');
                        io.to(leaveRoomId).emit('stopRestTimer');
                        io.to(leaveRoomId).emit('stopGetTimer');
                        thisRoom.correctNum = 0;
                        thisRoom.roomStatus = 'waiting';
                        allRoomInfo[leaveRoomId] = thisRoom;
                    }else if (thisRoom.correctNum +1 >= thisRoom.roomMember.length){
                        thisRoom.correctNum = 0;
                        clearInterval(timers[leaveRoomId]);
                        clearInterval(restTimers[leaveRoomId]);
                        delete timers[leaveRoomId];
                        delete restTimers[leaveRoomId];
                        thisRoom.roomStatus = 'resting';
                        if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
                            thisRoom.roomDraw = 0;
                        }else{
                            thisRoom.roomDraw ++;
                        };
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                        allRoomInfo[leaveRoomId] = thisRoom;
                        io.to(leaveRoomId).emit('everyoneCorrected');
                        io.to(leaveRoomId).emit('nextDrawer', thisRoom.drawer);
                        io.to(leaveRoomId).emit('stopTimer');
                        io.to(leaveRoomId).emit('stopGetTimer');
                        io.to(leaveRoomId).emit('startTimer', thisRoom.roomStatus, thisRoom.host);
                    };
                };
                if (thisRoom.roomStatus == 'resting'){
                    if (userName == thisRoom.host){
                        thisRoom.host = thisRoom.roomMember[0];
                    };
                    if (userName == thisRoom.drawer){
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                        io.to(leaveRoomId).emit('nextDrawer', thisRoom.drawer);
                    };
                    if (thisRoom.roomDraw == thisRoom.roomMember.length){
                        thisRoom.roomDraw = 0;
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                    };
                    if (thisRoom.roomMember.length == 1){
                        clearInterval(restTimers[leaveRoomId]);
                        delete restTimers[leaveRoomId];
                        io.to(leaveRoomId).emit('stopRestTimer');
                        io.to(leaveRoomId).emit('stopGetTimer');
                        thisRoom.correctNum = 0;
                        thisRoom.roomStatus = 'waiting';
                    };
                    allRoomInfo[leaveRoomId] = thisRoom;
                };
                if (thisRoom.roomStatus == 'ending'){
                    if (userName == thisRoom.host){
                        thisRoom.host = thisRoom.roomMember[0];
                    };
                    allRoomInfo[leaveRoomId] = thisRoom;
                };
                if (thisRoom.roomMember.length == 0){
                    delete allRoomInfo[leaveRoomId];
                    clearInterval(timers[leaveRoomId]);
                    clearInterval(restTimers[leaveRoomId]);
                    delete timers[leaveRoomId];
                    delete restTimers[leaveRoomId];
                    delete roomScore.userName;
                };
            };
            io.emit('lobby', allRoomInfo);
            io.to(leaveRoomId).emit('member', thisRoom.roomMember);
            io.to(leaveRoomId).emit('score', roomScore);
            io.to(leaveRoomId).emit('roomInfo', thisRoom);
        };
    });

    //遊戲流程
    socket.on('beginGame', (roomId) => {
        let thisRoom = allRoomInfo[roomId];
        thisRoom.roomRound = 1;
        thisRoom.roomStatus = 'playing';
        if (!thisRoom.topicIndex){
            thisRoom.topicIndex = [];
        };
        let str='';
        thisRoom.topicIndex = [];
        for(i=0; i<topicsLength; i++){
            str = Math.round(Math.random()*topicsLength);
            for(j=0;j<thisRoom.topicIndex.length;j++){
                    if(thisRoom.topicIndex[j] == str){
                        thisRoom.topicIndex.splice(j,1);
                        i--;
                    };
                    if(thisRoom.topicIndex[j] == topicsLength){
                        thisRoom.topicIndex.splice(j,1);
                    };
                };
            thisRoom.topicIndex.push(str);
        };
        thisRoom.topic = topics[thisRoom.topicIndex[thisRoom.roomRound]];
        allRoomInfo[roomId] = thisRoom;
        io.to(roomId).emit('roomInfo', thisRoom);
        io.to(roomId).emit('startTimer', thisRoom.roomStatus, thisRoom.host);
    });

    socket.on('win', (roomId, user) => {
        let thisRoom = allRoomInfo[roomId];

        if (thisRoom.correctNum <= 5){
            roomScore[thisRoom.drawer] ++;
        };
        roomScore[user] +=2;
        io.to(roomId).emit('winScore', roomScore[user], user, roomScore[thisRoom.drawer], thisRoom.drawer);
        
        thisRoom.correctNum ++;
        if (roomScore[user] >= thisRoom.roomMaxScore){
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            io.to(roomId).emit('stopTimer');
            io.to(roomId).emit('stopGetTimer');
            thisRoom.roomStatus = 'ending';
            io.to(roomId).emit('winnerUser', user);
            allRoomInfo[roomId] = thisRoom;
            io.to(roomId).emit('roomInfo', thisRoom);
        }else if (roomScore[thisRoom.drawer] >= thisRoom.roomMaxScore){
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            io.to(roomId).emit('stopTimer');
            io.to(roomId).emit('stopGetTimer');
            thisRoom.roomStatus = 'ending';
            io.to(roomId).emit('winnerDraw', thisRoom.drawer);
            allRoomInfo[roomId] = thisRoom;
            io.to(roomId).emit('roomInfo', thisRoom);
        }else if (thisRoom.correctNum +1 >= thisRoom.roomMember.length){
            thisRoom.correctNum = 0;
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            thisRoom.roomStatus = 'resting';
            if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
                thisRoom.roomDraw = 0;
            }else{
                thisRoom.roomDraw ++;
            };
            thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
            allRoomInfo[roomId] = thisRoom;
            io.to(roomId).emit('stopTimer');
            io.to(roomId).emit('stopGetTimer');
            io.to(roomId).emit('startTimer', thisRoom.roomStatus, thisRoom.host);
            io.to(roomId).emit('roomInfo', thisRoom);
            io.to(roomId).emit('everyoneCorrected');
            io.to(roomId).emit('nextDrawer', thisRoom.drawer);
        };
    });

    socket.on('startTimer', (roomId) => {
        let count = 100;
        let min = 1/64;
        if (!timers[roomId]){
            timer = setInterval(() =>{
                count -= min;
                counts[roomId] = count;
                if (count <= 0) {
                    clearInterval(timers[roomId]);
                    delete timers[roomId];
                    let thisRoom = allRoomInfo[roomId];
                    thisRoom.roomStatus = 'resting';
                    if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
                        thisRoom.roomDraw = 0;
                    }else{
                        thisRoom.roomDraw ++;
                    };
                    thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                    allRoomInfo[roomId] = thisRoom;
                    io.to(roomId).emit('roomInfo', thisRoom);
                    io.to(roomId).emit('nextDrawer', thisRoom.drawer);
                    io.to(roomId).emit('lose', thisRoom.topic);
                    io.to(roomId).emit('stopTimer');
                    io.to(roomId).emit('stopGetTimer');
                    io.to(roomId).emit('startTimer', thisRoom.roomStatus, thisRoom.host);
                };
            }, 10);
        };
        timers[roomId] = timer;
    });

    socket.on('startRestTimer', (roomId) => {
        let thisRoom = allRoomInfo[roomId];
        let restCount = 100;
        let restMin = 1/8;
        if (!restTimers[roomId]){
            restTimer = setInterval(() =>{
            restCount -= restMin;
            restCounts[roomId] = restCount;
            if (restCount <= 0) {
                clearInterval(restTimers[roomId]);
                delete restTimers[roomId];
                thisRoom.roomStatus = 'playing';
                thisRoom.roomRound ++;
                thisRoom.topic = topics[thisRoom.topicIndex[thisRoom.roomRound]];
                allRoomInfo[roomId] = thisRoom;
                io.to(roomId).emit('roomInfo', thisRoom);
                io.to(roomId).emit('drawer', thisRoom.drawer);
                io.to(roomId).emit('stopRestTimer');
                io.to(roomId).emit('stopGetTimer');
                io.to(roomId).emit('startTimer', thisRoom.roomStatus, thisRoom.host);
                };
            }, 10);
        };
        restTimers[roomId] = restTimer;
    });

    socket.on('refresh', (roomId) => {
        let thisRoom = allRoomInfo[roomId];
        thisRoom.roomStatus = 'waiting';
        thisRoom.roomDraw = 0;
        thisRoom.correctNum = 0;
        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
        for (let i = 0; i<thisRoom.roomMember.length; i++) {
            roomScore[thisRoom.roomMember[i]] = 0;
        };
        delete thisRoom.topic;
        allRoomInfo[roomId] = thisRoom;
        io.to(roomId).emit('member', thisRoom.roomMember);
        io.to(roomId).emit('score', roomScore);
        io.to(roomId).emit('roomInfo', thisRoom);
    });

    //聊天室
    socket.on('guess', (msg, roomId, win) => {
        io.to(roomId).emit('guess', msg, win);
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

    socket.on('brushChanged', (roomId, color, width) => {
        socket.broadcast.to(roomId).emit('brushChanged', color, width);
    });
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});