var util = require("util");
var redis = require("redis");
var async = require("async");

var StorageAbstract = require('./storageAbstract');


var StorageRedis = function (config) {
    //check system requirements
    var callArguments = Array.prototype.slice.call(arguments);
    StorageAbstract.apply(this, callArguments);

};
util.inherits(StorageRedis, StorageAbstract);

StorageRedis.prototype.getClient = function () {
    if(!this._client){
        this._client = redis.createClient(
            this.config.port,
            this.config.host
        );
        if(this.config.database > 0){
            this.debug('set db to', this.config.database);
            this._client.select(this.config.database);
        }

        this._client.on("error", function (err) {
            console.error("Error " + err);
        });
    }
    return this._client;
};


StorageRedis.prototype.defaultConfig = {
    cacheTime: 60 * 60 * 24, //in seconds
    debug: false,
    host: '127.0.0.1',
    port: 6379,
    database: 0
};

StorageRedis.prototype.get = function (key, callback) {
    this.getClient().get(key, callback);
};

StorageRedis.prototype.getCount = function (callback) {
    //not perfect as it counts tags too!
    this.getClient.dbsize(function(err, data){
        callback(err, data);
    });
};


StorageRedis.prototype.set = function (key, value, cacheTime, tags, cb) {
    var self = this;
    if(typeof cacheTime === 'undefined'){
        cacheTime = this.config.cacheTime
    }
    //cache times are set in milliseconds
    cacheTime *= 1000;


    if(typeof tags === 'function'){
        cb = tags;
        tags = [];
    }

    //if we have a string
    if(typeof value !== 'string'){
        throw new Error('we can only store strings');
    }
    async.waterfall([
        function(callback){
            self.getClient().set(key, value, callback);
        },
        function(data, callback){
            async.parallel([
                function(_callback) {
                    self.addExpire(key, cacheTime, _callback);
                },
                function(_callback) {
                    self.addToTags(key, tags,_callback);
                }
            ], callback)
        }
        //not perfect because key could be stored but expires or add list didn't
    ], function(err){
        if(err){
            console.error(err, err.stack);
        }
        cb(err);
    });
};

StorageRedis.prototype.addToTags = function (key, tags, callback) {
    if(typeof tags === 'string') tags = [tags];
    if(tags.length === 0) {
        callback(null);
        return;
    }
    var client = this.getClient();
    var _calls = [];

    tags.forEach(function(tag){
        _calls.push(function(_callback) {
           client.sadd('tag_' + tag, key, _callback);
        });
    });

    async.parallel(_calls, function(err, data){
        callback(err, data);
    });
};
StorageRedis.prototype.addExpire = function (key, cacheTime, callback) {

    if(cacheTime > 0){
        this.getClient().pexpire(key, cacheTime, callback);
    } else {
        callback(null);
    }
};

StorageRedis.prototype.clear = function (key, callback) {
    callback = callback || function(){};
    this.getClient().del(key, function(err){
        callback(err);
    });
};


StorageRedis.prototype.clearAll = function (callback) {
    callback = callback || function(){};
    this.getClient().flushdb(function(err){
        callback(err);
    });
};



StorageRedis.prototype.clearTag = function (tag, callback) {
    callback = callback || function(){};
    var self = this;
    var tagKey = 'tag_' + tag;
    async.waterfall([
        function(_callback){
            self.getClient().smembers(tagKey, _callback);
        },
        function(keys, _callback){
            if(!Array.isArray(keys) || keys.length === 0){
                keys = [];
            }
            keys.push(tagKey);
            keys.push(_callback);
            self.getClient().del.apply( self.getClient(), keys);
        }
    ], function(err){
        callback(err);
    });
};


StorageRedis.prototype.cleanUp = function(callback){
    //we need to cleanup unused/expired tags
    callback();
};


StorageAbstract.prototype.debug = function () {
    if (!this.config.debug) {
        return;
    }
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
};




module.exports = StorageRedis;

