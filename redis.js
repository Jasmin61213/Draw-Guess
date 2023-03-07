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
    HGET,
    HGETALL,
    HKEYS,
    HVALS
};