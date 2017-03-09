'use strict';

//dependencies
var async = require('async');
var mongoose = require('mongoose');

//apply mongoose plugins
mongoose.plugin(require('mongoose-valid8'));

before(function (done) {
    //setup database
    mongoose.connect('mongodb://localhost/irina', done);
    //http://mongoosejs.com/docs/promises.html
    mongoose.Promise = global.Promise;
});

/**
 * @description wipe all mongoose model data and drop all indexes
 */
function wipe(done) {
    var cleanups = mongoose.modelNames()
        .map(function (modelName) {
            //grab mongoose model
            return mongoose.model(modelName);
        })
        .map(function (Model) {
            return async.series.bind(null, [
                //clean up all model data
                Model.remove.bind(Model),
                //drop all indexes
                Model.collection.dropAllIndexes.bind(Model.collection)
            ]);
        });

    //run all clean ups parallel
    async.parallel(cleanups, done);
}

//clean database
after(function (done) {
    //wait for mongodb background tasks
    //
    //Fix for MongoError: exception: cannot perform operation: 
    //a background operation is currently running for collection <collectionName>
    setTimeout(function () {
        wipe(function (error) {
            if (error && error.message !== 'ns not found') {
                done(error);
            } else {
                done(null);
            }
        });
    }, 1000);
});