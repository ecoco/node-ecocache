var extend = require("util")._extend;


var StorageAbstract = function (config) {
    //check system requirements
    var defaultConfig = extend({}, this.defaultConfig);
    this.config = extend(defaultConfig, config);


    this.startGarbageCollection();

};

StorageAbstract.prototype.defaultConfig = {
    cacheTime: 60 * 60 * 24, //in seconds
    debug: false,
    garbageCollection: true
};

StorageAbstract.prototype.startGarbageCollection = function () {
    if(!this.config.garbageCollection){
        return;
    }
    this.debug('starting garbage collection')
    //start garbage collection every minute

    var self = this;
    this.garbageCollectionInterval = setInterval(function(){
        process.nextTick(function(){
            self.cleanUp();
        });
    }, 60000);
};

StorageAbstract.prototype.stopGarbageCollection = function () {
    //start garbage collection every minute
    clearInterval((this.garbageCollectionInterval));
};

StorageAbstract.prototype.get = function (key, callback) {
    console.error('please overwrite get')
};

StorageAbstract.prototype.getCount = function (callback) {
    console.error('please overwrite getCount')
};

/**
 *
 * @param {string} key
 * @param {string} value
 * @param {number} timeout time to cache in milliseconds
 * @param {string|array|function} tags tag or array of tags,
 *      if function it should be used as callback
 * @param {function} callback
 */
StorageAbstract.prototype.set = function (key, value, timeout, tags, callback) {
    console.error('please overwrite set')
};


StorageAbstract.prototype.clear = function (key, callback) {
    console.error('please overwrite clear')
};


StorageAbstract.prototype.clearTag = function (tags, callback) {
    console.error('please overwrite clearTag')
};


StorageAbstract.prototype.cleanUp = function(callback){
    console.error('please overwrite cleanUp')
};


StorageAbstract.prototype.debug = function () {
    if (!this.config.debug) {
        return;
    }
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
};


module.exports = StorageAbstract;
