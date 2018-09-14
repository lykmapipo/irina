'use strict';

//dependencies
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


before(function(done) {
    mongoose.connect('mongodb://localhost/irina', { useNewUrlParser: true }, done);
});


//clean database
after(function(done) {
    mongoose.connection.dropDatabase(done);
});