/**
CARE this test requires an active redis server and was used only during development
 it will also run a "flushdb" so only use this test if you want to make
 changes to this lib and don't have any data in you local redis server

var cache = require('../cache');
var async = require('async');

exports.setUp = function (callback) {
    this.memoryInst = cache.init({
        type: 'redis',
        debug: true,
        garbageCollection: false
    });
    var client = this.memoryInst.getClient();

    client.on('connect', function () {
        callback();
    });
};

exports.tearDown = function (callback) {
    this.memoryInst.getClient().on('end', function () {
        callback();
    });
    this.memoryInst.getClient().quit();
};



exports['set/get'] = function (test) {
    var self = this;
    async.waterfall([
        function(callback){
            //set value with tag
            setGetKeyCombination(self.memoryInst,'test', 'value', 0.1, callback);
        },
        function(value, callback){
            test.equal(value, 'value');
            setTimeout(function(){
                //wait 125ms and test get again
                self.memoryInst.get('test', callback);
            }, 125);
        },
        function(value, callback){
            test.equal(value, null);
            callback();
        }

    ], function(err){
        if(err) console.error(err, err.stack);
        test.equal(err, null);
        console.log('before dobne');
        test.done();
        self.memoryInst.getClient().quit();
    });
};

exports['setTag'] = function (test) {
    var self = this;
    async.waterfall([
        function(callback){
            setGetKeyCombination(self.memoryInst,'test', 'value', 0, 'testTag', callback);
        },
        function(value, callback){
            //test if value is set
            test.equal(value, 'value');
            //clear the tag
            self.memoryInst.clearTag('testTag', callback);
        },
        function(callback){
            //test again
            self.memoryInst.get('test', callback);
        },
        function(value, callback){
            //test if value is cleared
            test.equal(value, null);
            callback();
        }
    ], function(err){
        test.equal(err, null);
        test.done();
    });
};


exports['clear'] = function (test) {
    var self = this;
    async.waterfall([
        function(callback){
            setGetKeyCombination(self.memoryInst, 'testClearKey', 'value', 0, callback);
        },
        function(value, callback){
            //test if value is set
            test.equal(value, 'value');
            //clear the tag
            self.memoryInst.clear('testClearKey', callback);
        },
        function(callback){
            //test again
            self.memoryInst.get('testClearKey', callback);
        },
        function(value, callback){
            //test if value is cleared
            test.equal(value, null);
            callback();
        }
    ], function(err){
        test.equal(err, null);
        test.done();
    });
};

exports['clearAll'] = function (test) {
    var self = this;
    async.waterfall([
        function(callback){
            async.parallel({
                value1: function(cb){ setGetKeyCombination(self.memoryInst, 'test1', 'value1', 0, cb);},
                value2: function(cb){ setGetKeyCombination(self.memoryInst, 'test2', 'value2', 0, cb);}
            }, callback);
        },
        function(result, callback){
            test.equal( result.value1, 'value1' );
            test.equal( result.value2, 'value2' );

            //clear all and recheck
            self.memoryInst.clearAll(callback);
        },
        function(callback){
            async.parallel({
                value1: function(cb){ self.memoryInst.get('test1', cb); },
                value2: function(cb){ self.memoryInst.get('test2', cb); }
            }, callback);
        }
    ], function(err, result){
        test.equal(err, null);
        test.equal( result.value1, null );
        test.equal( result.value2, null );
        test.done();
    });
};

exports['multipleTags'] = function (test) {
    var self = this;
    async.waterfall([
        function(callback){
            async.parallel([
                function(cb){ self.memoryInst.set('multipleTagsKey1', 'value', 0, ['tag1'], cb); },
                function(cb){ self.memoryInst.set('multipleTagsKey2', 'value', 0, ['tag2'], cb); },
                function(cb){ self.memoryInst.set('multipleTagsKey3', 'value', 0, ['tag1', 'tag2'], cb); }
            ], callback);
        }, function(result, callback){
            self.memoryInst.clearTag('tag1', callback);
        }, function(callback){
            async.parallel([
                function(cb){ expectValue(test, self.memoryInst, 'multipleTagsKey1', null, cb)},
                function(cb){ expectValue(test, self.memoryInst, 'multipleTagsKey2', 'value', cb)},
                function(cb){ expectValue(test, self.memoryInst, 'multipleTagsKey3', null, cb)}
            ], callback);
        }

    ], function(err, result){
        test.equal(err, null);
        test.done();
    });
};


function setGetKeyCombination(memoryInst, key, value, cacheTime, tags, cb){
    if(typeof tags === 'function'){
        cb = tags;
        tags = [];
    }
    async.waterfall([
        function(callback){
            memoryInst.set(key, value, cacheTime, tags, callback);
        },
        function(callback){
            memoryInst.get(key, callback);
        }
    ], function(err, data){
        if(err){
            console.error(err, err.stack);
        }
        cb(err, data);
    });
}

function expectValue(test, memoryInst, key, expect, callback){
    memoryInst.get(key, function(err, value){
        test.equal(value, expect);
        callback();
    });
}

 */