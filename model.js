const mysql = require('mysql2');

require('dotenv').config();

// 建立資料庫連線池
const pool  = mysql.createPool({
    user: process.env.DBuser,
    password: process.env.DBpassword,
    host: process.env.DBhost,
    port: '3306',
    database: 'jasmindraw',
    waitForConnections : true,
    connectionLimit : 5
});

const promisePool = pool.promise();

// // 引入模組
// const redis = require("redis");
// const client = redis.createClient();
// // redis server
// client.on("error", function(error) {
//   console.error(error);
// });

// const promiseClient = client.promise();
// <!-- 設置與取得 key / value -->
// client.set("key", "value", redis.print);
// client.get("key", redis.print);

module.exports = {
    pool: promisePool,
};