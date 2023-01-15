const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const { Server } = require("socket.io");
const io = new Server(server);

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static('public'));

// app.get('/', (req, res) => {
//     res.render('index')
// });

app.get('/draw', (req, res) => {
    res.render('draw')
});

io.on('connection', (socket) => {
    // socket.on('chat message', (msg) => {
    //     socket.broadcast.emit('chat message', msg);
    // });
    socket.on('beginDraw', function(e){
        socket.broadcast.emit('beginDraw',e);
    });
    socket.on('draw', function(e) {
        socket.broadcast.emit('draw',e);//除了自己的都更新
     });
    socket.on('endDraw', function() {
        io.emit('endDraw');
    });
  });

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
