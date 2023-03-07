require('dotenv').config();

// MySQL
const mysql = require('mysql2');

// connection pool
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

// Redis
const redis = require("redis");
const client = redis.createClient(
    {url: `redis://${process.env.redis}`}
);
client.on("connect", function() {
  console.log('redis connected!');
});

function HGET(key, field){
    return new Promise(function(resolve, reject){
        client.HGET(key, field, function(err, value) {
            resolve(value);
        });
    });
};
function HGETALL(key){
    return new Promise(function(resolve, reject){
        client.HGETALL(key, function(err, value) {
            resolve(value);
        });
    });
};
function HKEYS(key){
    return new Promise(function(resolve, reject){
        client.HKEYS(key, function(err, value) {
            resolve(value);
        });
    });
};
function HVALS(key){
    return new Promise(function(resolve, reject){
        client.HVALS(key, function(err, value) {
            resolve(value);
        });
    });
};

module.exports = {
    pool: promisePool,
    HGET,
    HGETALL,
    HKEYS,
    HVALS
};