// mysql
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

module.exports = {
    pool: promisePool,
};