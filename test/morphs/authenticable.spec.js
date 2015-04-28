'use strict';

//dependencies
var faker = require('faker');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var Police = require(path.join(__dirname, '..', '..', 'index'));

describe('Authenticable', function() {
    before(function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(Police);
        mongoose.model('AUser', UserSchema);

        done();
    });

    describe('Authenticable Fields', function() {
        it('should be able to set defaults authentication fields', function(done) {
            var UserSchema = new Schema({});
            UserSchema.plugin(Police);

            var User = mongoose.model('BUser', UserSchema);

            expect(User.schema.paths.email).to.exist;
            expect(User.schema.paths.password).to.exist;

            done();
        });

        it('should be able to set custom authentication fields', function(done) {
            var UserSchema = new Schema({});
            UserSchema.plugin(Police, {
                authenticationField: 'username',
                authenticationFieldType: String,
                passwordField: 'hash'
            });

            var User = mongoose.model('CUser', UserSchema);

            expect(User.schema.paths.username).to.exist;
            expect(User.schema.paths.username.instance).to.be.equal('String');

            expect(User.schema.paths.hash).to.exist;

            done();
        });
    });

    it('should be able to encrypt password', function(done) {
        var User = mongoose.model('AUser');

        var password = faker.internet.password();
        var email = faker.internet.email();


        var user = new User({
            email: email,
            password: password
        });

        expect(user.encryptPassword).to.be.a('function');

        user
            .encryptPassword(function(error, authenticable) {
                if (error) {
                    done(error);
                } else {
                    expect(authenticable.email).to.be.equal(email);
                    expect(authenticable.password).to.not.equal(password);
                    done();
                }
            });
    });

    it('should be able to compare password with hash', function(done) {
        var password = faker.internet.password();
        var email = faker.internet.email();

        var User = mongoose.model('AUser');

        var user = new User({
            email: email,
            password: password
        });


        expect(user.comparePassword).to.be.a('function');

        async
            .waterfall(
                [
                    function(next) {
                        user.encryptPassword(next);
                    },
                    function(authenticable, next) {
                        authenticable.comparePassword(password, next);
                    }
                ],
                function(error, authenticable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(authenticable).to.not.be.null;
                        done();
                    }
                });
    });

    it('should be able to change password', function(done) {
        var password = faker.internet.password();
        var email = faker.internet.email();

        var User = mongoose.model('AUser');

        var user = new User({
            email: email,
            password: password
        });

        var previousPassword = user.password;

        expect(user.changePassword).to.be.a('function');

        user
            .changePassword(faker.internet.password(), function(error, authenticable) {
                if (error) {
                    done(error);
                } else {
                    expect(authenticable.email).to.be.equal(user.email);
                    expect(authenticable.password).to.not.be.null;
                    expect(authenticable.password).to.not.equal(previousPassword);

                    done();
                }
            });
    });

    it('should have static authenticate method', function(done) {
        var User = mongoose.model('AUser');

        expect(User.authenticate).to.exist;
        expect(User.authenticate).to.be.a('function');

        done();
    });

    it('should have instance authenticate method', function(done) {
        var User = mongoose.model('AUser');
        var user = new User();

        expect(user.authenticate).to.exist;
        expect(user.authenticate).to.be.a('function');

        done();
    });

    it('should be able to authenticate', function(done) {
        var credentials = {
            email: faker.internet.email(),
            password: faker.internet.password()
        };

        var User = mongoose.model('AUser');

        async
            .waterfall(
                [
                    function(next) {
                        User
                            .register(credentials, next);
                    },
                    function(authenticable, next) {
                        User.confirm(authenticable.confirmationToken, next);
                    },
                    function(authenticable, next) {
                        User.authenticate(credentials, next);
                    }
                ],
                function(error, authenticable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(authenticable).to.not.be.null;
                        expect(authenticable.email).to.be.equal(credentials.email);

                        done();
                    }
                });
    });
});