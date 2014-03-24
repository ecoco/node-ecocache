var util = require("util");
var extend = util._extend;
var StorageAbstract = require('./storageAbstract');


var StorageMemory = function (config) {
    //check system requirements
    var callArguments = Array.prototype.slice.call(arguments);
    StorageAbstract.apply(this, callArguments);

    this.reset();
};

util.inherits(StorageMemory, StorageAbstract);

StorageAbstract.prototype.defaultConfig = {
    cacheTime: 60 * 60 * 24, //in seconds
    debug: false,
    expireChunkSize: 5000
};


StorageMemory.prototype.reset = function(){
    this._cache = {};
    this._cacheExpires = {};
    this._tags = {}
}


StorageMemory.prototype.get = function(key, callback){
    if(!this._cache[key]){
        //no hit!
        this.debug('cache miss', key);
        return callback(null, null);
    }
    var hit = this._cache[key];
    if(hit.expires !== 0 && hit.expires < Date.now()){
        this.debug('cache expired', key);
        this.clear(key);
        return callback(null, null);
    }
    return callback(null, this._cache[key].value);
};


StorageMemory.prototype.set = function(key, value, cacheTime, tags, callback){
    callback = callback || function() {};

    if(typeof cacheTime === 'undefined'){
        cacheTime = this.config.cacheTime
    }
    if(typeof tags === 'function'){
        callback = tags;
        tags = [];
    }
    var expires = cacheTime;
    if(cacheTime > 0)
        expires = Date.now() + (cacheTime * 1000);

    this._cache[key] = {
        value: value,
        expires: expires
    };
    this.addExpires(expires, key);
    if(tags){
        if(typeof tags === 'string'){
            tags = [tags];
        }

        var self = this;
        tags.forEach(function(tag){
            self.addTag(tag, key);
        });
    }
    callback(null);
    return this;
};
StorageMemory.prototype.addExpires = function(expires, key, callback){
    callback = callback || function() {};
    if(expires === 0){
        return;
    }
    //we divide expire by chunk size // so we get blocks of expiring keys
    expires = Math.ceil(expires / this.config.expireChunkSize);
    if(!this._cacheExpires[expires]){
        this._cacheExpires[expires] = [];
    }
    this._cacheExpires[expires].push(key);
    callback();
};


StorageMemory.prototype.clear = function(key, callback){
    callback = callback || function() {};
    delete this._cache[key];
    callback();
};

StorageMemory.prototype.clearAll = function(key, callback){
    callback = callback || function() {};
    this.reset();
    callback();
};


StorageMemory.prototype.addTag = function(tag, key, callback){
    callback = callback || function() {};
    if(!this._tags[tag]){
        this._tags[tag] = {
            keys: []
        }
    }
    this._tags[tag].keys.push(key);
    callback();
};


StorageMemory.prototype.clearTag = function (tag, callback) {
    callback = callback || function() {};

    if(!this._tags[tag]){
        return this;
    }
    var tagData = this._tags[tag];
    delete this._tags[tag];

    while(tagData.keys.length > 0 ){
        var key = tagData.keys.shift();
        //its in memory so we don't need a callback
        this.clear(key);
    }
    callback();
};

StorageMemory.prototype.getCount = function (callback) {
    callback(null, Object.keys(this._cache).length)
};


StorageMemory.prototype.cleanUp = function(callback){
    callback = callback || function() {};

    var self = this;
    var now = Date.now()
    var expireChunkSize = this.config.expireChunkSize;

    var timestamps = Object.keys(this._cacheExpires).sort();
    timestamps.forEach(function(timestamp){
        timestamp *= expireChunkSize;
        if(timestamp > now){
            return;
        }
        var keys = self._cacheExpires[timestamp];
        delete self._cacheExpires[timestamp];
        keys.forEach(function(key){
            self.clear(key);
        });
    });

    //TODO clean up tags
    callback();
};


module.exports = StorageMemory;

