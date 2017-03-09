'use strict';

//dependencies
var faker = require('faker');
var _ = require('lodash');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));

describe('Authenticable', function () {

    describe('', function () {
        let User;
        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
        });

        it('should be able to set defaults authentication fields', function () {
            expect(User.schema.paths.email).to.exist;
            expect(User.schema.paths.password).to.exist;
        });

        it('should be able to set authenticationField and password as required field', function () {
            expect(User.schema.paths.email.isRequired).to.be.true;
            expect(User.schema.paths.password.isRequired).to.be.true;
        });
    });


    describe('', function () {
        let User;
        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                authenticationField: 'username',
                authenticationFieldProperties: { type: String },
                passwordField: 'hash'
            });
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
        });

        it('should be able to set custom authentication fields', function () {
            expect(User.schema.paths.username).to.exist;
            expect(User.schema.paths.username.instance).to.be.equal('String');
            expect(User.schema.paths.hash).to.exist;
        });
    });


    describe('', function () {
        let User;
        before(function (done) {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
            done();
        });

        it('should be able to encrypt password callback based', function (done) {

            var password = faker.internet.password();
            var email = faker.internet.email();


            var user = new User({
                email: email,
                password: password
            });

            user
                .encryptPassword(function (error, authenticable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(authenticable.email).to.be.equal(email.toLowerCase());
                        expect(authenticable.password).to.not.equal(password);
                        done();
                    }
                });
        });

        it('should be able to encrypt password promise based', function (done) {
            var password = faker.internet.password();
            var email = faker.internet.email();


            var user = new User({
                email: email,
                password: password
            });

            user
                .encryptPassword()
                .then(authenticable => {
                    expect(authenticable.email).to.be.equal(email.toLowerCase());
                    expect(authenticable.password).to.not.equal(password);
                    done();
                });
        });
    });


    describe('', function () {
        let User;
        before(function (done) {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
            done();
        });

        it('should be able to compare password with hash callback based', function (done) {
            var password = faker.internet.password();
            var email = faker.internet.email();

            var user = new User({
                email: email,
                password: password
            });

            user
                .encryptPassword()
                .then(authenticable => {
                    return authenticable
                        .comparePassword(password, (error, authenticable) => {
                            expect(authenticable).to.not.be.null;
                            done();
                        });
                });
        });

        it('should be able to compare password with hash promise based', function (done) {
            var password = faker.internet.password();
            var email = faker.internet.email();

            var user = new User({
                email: email,
                password: password
            });

            user
                .encryptPassword()
                .then(authenticable => {
                    return authenticable.comparePassword(password);
                })
                .then(authenticable => {
                    expect(authenticable).to.not.be.null;
                    done();
                });
        });
    });



    describe('', function () {
        let User;
        before(function (done) {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
            done();
        });

        it('should be able to change password callback based', function (done) {
            var password = faker.internet.password();
            var email = faker.internet.email();

            var user = new User({
                email: email,
                password: password
            });

            var previousPassword = user.password;

            user
                .changePassword(faker.internet.password(), function (error, authenticable) {
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

        it('should be able to change password promise based', function (done) {
            var password = faker.internet.password();
            var email = faker.internet.email();

            var user = new User({
                email: email,
                password: password
            });

            var previousPassword = user.password;

            user
                .changePassword(faker.internet.password())
                .then(authenticable => {
                    expect(authenticable.email).to.be.equal(user.email);
                    expect(authenticable.password).to.not.be.null;
                    expect(authenticable.password).to.not.equal(previousPassword);

                    done();
                });
        });
    });


    describe('', function () {
        let User, user, _credentials;
        before(function (done) {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
            done();
        });


        before(function (done) {
            var credentials = {
                email: faker.internet.email(),
                password: faker.internet.password()
            };

            _credentials = _.clone(credentials);
            _credentials.email = credentials.email.toLowerCase();
            User
                .register(credentials)
                .then(authenticable => {
                    user = authenticable;
                    done();
                });
        });


        before(function (done) {
            User
                .confirm(user.confirmationToken)
                .then(authenticable => {
                    user = authenticable;
                    done();
                });
        });

        it('should be able to authenticate credentials callback based', function (done) {
            User
                .authenticate(_credentials, (error, authenticable) => {
                    expect(authenticable).to.not.be.null;
                    expect(authenticable.email).to.be.equal(_credentials.email);
                    done();
                });
        });

        it('should be able to authenticate credentials promise based', function (done) {
            User
                .authenticate(_credentials)
                .then(authenticable => {
                    expect(authenticable).to.not.be.null;
                    expect(authenticable.email).to.be.equal(_credentials.email);
                    done();
                });
        });


        it('should throw error when authenticate credentials with invalid password', function (done) {
            var credentials = {
                email: faker.internet.email().toLowerCase(),
                password: faker.internet.password()
            };

            User
                .authenticate(credentials)
                .catch(error => {
                    expect(error).to.exist;
                    expect(error.message).to.equal('Incorrect email or password');
                    done();
                });
        });
    });
});
