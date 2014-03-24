var util = require("util");
var extend = util._extend;

var instances = {};


var defaultCacheInitConfig = {
    name: '_default',
    type: 'memory'
};

module.exports = {
    init: function(config){
        config = config || {};
        config = extend(defaultCacheInitConfig, config);

        var instance = initNewCacheInstance(config);
        instances[config.name] = instance;
        return instance;
    },


    retrieve: function(name){
        if(!name){
            name = '_default';
        }


        if(instances[name]){
            return instances[name];
        }
        return null;
    },

    destroy: function(name){
        if(!instances[name]){
           return true;
        }
        instances[name].clear();
        delete instances[name];
        return true;
    }
};


function initNewCacheInstance(config){
    try{
        var Instance = require('./storage/' + config.type);
        return new Instance(config);
    } catch(e){
        console.log('initNewCacheInstance()', e, e.stack);
        throw new Error(util.format('unknown cache storage %s', config.type));
    }
}
