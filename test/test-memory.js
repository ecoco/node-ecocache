var cache = require('../cache');
var async = require('async');


exports.setUp = function (callback) {
    this.memoryInst = cache.init({
        type: 'memory',
        garbageCollection: false
    });
    callback();
};

exports.tearDown = function (callback) {
    callback();
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
                //wait 101ms and test get again
                self.memoryInst.get('test', callback);
            }, 101);
        },
        function(value, callback){
            test.equal(value, null);
            callback();
        }

    ], function(err){
        test.equal(err, null);
        test.done();
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
            self.memoryInst.clearAll();
            callback();
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


exports['cleanUp'] = function (test) {
    var self = this;
    this.memoryInst.config.expireChunkSize = 1;
    async.waterfall([
        function(callback){
            async.parallel([
                function(cb){ self.memoryInst.set('test1', 'value', 0.1, cb); },
                function(cb){ self.memoryInst.set('test2', 'value', 0, cb); }
            ], callback);
        }, function(result, callback){
            self.memoryInst.getCount(function(err, count){
                test.equal(count, 2);
                setTimeout(callback, 101);
            });
        }, function(callback){
            self.memoryInst.cleanUp(callback);
        }, function(callback){
            self.memoryInst.getCount(function(err, count){
                test.equal(count, 1);
                callback();
            });
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
        cb(err, data);
    });
}

function expectValue(test, memoryInst, key, expect, callback){
    memoryInst.get(key, function(err, value){
        test.equal(value, expect);
        callback();
    });
}