'use strict';

//dependencies
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//apply mongoose plugins
mongoose.plugin(require('mongoose-valid8'));

before(function(done) {
    //setup database
    mongoose.connect('mongodb://localhost/irina', done);
});


//clean database
after(function(done) {
    mongoose.connection.dropDatabase(done);
});
