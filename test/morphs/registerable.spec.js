'use strict';

//dependencies
var faker = require('faker');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));
var email = faker.internet.email();

describe('Registerable', function() {
    before(function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(irina);
        mongoose.model('RegUser', UserSchema);

        done();
    });

    it('should have registerable attributes', function(done) {
        var User = mongoose.model('RegUser');

        expect(User.schema.paths.registeredAt).to.exist;
        expect(User.schema.paths.unregisteredAt).to.exist;

        done();
    });


    it('should have register function', function(done) {
        var User = mongoose.model('RegUser');

        expect(User.register).to.be.a('function');

        done();
    });

    it('should be able to register', function(done) {
        var User = mongoose.model('RegUser');

        var credentials = {
            email: email,
            password: faker.internet.password()
        };

        User
            .register(credentials, function(error, registerable) {
                if (error) {
                    done(error);
                } else {
                    expect(registerable.registeredAt).to.not.be.null;
                    expect(registerable.email).to.be.equal(credentials.email);

                    done();
                }
            });
    });

    it('should be able to unregister', function(done) {
        var User = mongoose.model('RegUser');

        async
            .waterfall(
                [
                    function(next) {
                        User
                            .findOne({
                                email: email
                            })
                            .exec(next);
                    },
                    function(registerable, next) {
                        expect(registerable.unregister).to.be.a('function');
                        next(null, registerable);
                    },
                    function(registerable, next) {
                        //unregister
                        registerable.unregister(next);
                    },
                    function(registerable, next) {
                        expect(registerable.unregisteredAt).to.not.be.null;
                        next(null, registerable);
                    }
                ],
                function(error, registerable) {
                    done(error, registerable);
                });
    });

    it('should be able to auto confirm registration', function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(irina, {
            registerable: {
                autoConfirm: true
            }
        });
        var User = mongoose.model('RegaUser', UserSchema);

        var credentials = {
            email: email,
            password: faker.internet.password()
        };

        User
            .register(credentials, function(error, registerable) {
                if (error) {
                    done(error);
                } else {

                    expect(registerable.registeredAt).to.not.be.null;
                    expect(registerable.email).to.be.equal(credentials.email);

                    expect(registerable.confirmationToken).to.not.be.null;
                    expect(registerable.confirmedAt).to.not.be.null;

                    done();
                }
            });
    });
});