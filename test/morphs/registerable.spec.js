'use strict';

//dependencies
const faker = require('faker');
const path = require('path');
const mongoose = require('mongoose');
const expect = require('chai').expect;
const Schema = mongoose.Schema;
const irina = require(path.join(__dirname, '..', '..', 'index'));

describe('Registerable', function () {
    before(function (done) {
        const UserSchema = new Schema({});
        UserSchema.plugin(irina);
        mongoose.model('RegUser', UserSchema);

        done();
    });


    describe('', function () {
        it('should have registerable attributes', function (done) {
            const User = mongoose.model('RegUser');

            expect(User.schema.paths.registeredAt).to.exist;
            expect(User.schema.paths.unregisteredAt).to.exist;

            done();
        });


        it('should have register function', function (done) {
            const User = mongoose.model('RegUser');

            expect(User.register).to.be.a('function');

            done();
        });
    });


    describe('', function () {
        let User;

        before(function () {
            User = mongoose.model('RegUser');
        });

        it('should be able to register callback based style', function (done) {
            const email = faker.internet.email();

            const $credentials = {
                email: email,
                password: faker.internet.password()
            };

            User
                .register($credentials, function (error, registerable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(registerable.registeredAt).to.not.be.null;
                        expect(registerable.email).to.be.equal($credentials.email.toLowerCase());

                        done();
                    }
                });
        });

        it('should be able to register Promise based style', function (done) {
            const email = faker.internet.email();

            const $credentials = {
                email: email,
                password: faker.internet.password()
            };

            User
                .register($credentials)
                .then(registerable => {
                    expect(registerable.registeredAt).to.not.be.null;
                    expect(registerable.email).to.be.equal($credentials.email.toLowerCase());

                    done();
                });
        });
    });



    describe('', function () {
        let User, email, $credentials;

        before(function (done) {
            User = mongoose.model('RegUser');
            email = faker.internet.email();

            $credentials = {
                email: email,
                password: faker.internet.password()
            };

            User
                .register($credentials)
                .then(() => {
                    done();
                });
        });

        it('should not be able to register with authentication field which is already taken', function (done) {
            User
                .register($credentials)
                .catch(error => {
                    expect(error).to.exist;
                    expect(error.message)
                        .to.equal('Account with email ' + $credentials.email + ' already exist');
                    done();
                });
        });
    });


    describe('', function () {
        let User, email;

        before(function (done) {
            User = mongoose.model('RegUser');
            email = faker.internet.email();

            const $credentials = {
                email: email,
                password: faker.internet.password()
            };

            User
                .register($credentials)
                .then(() => {
                    done();
                });
        });

        it('should be able to unregister callback based style', function (done) {
            User
                .findOne({
                    email: email.toLowerCase()
                })
                .exec()
                .then(registerable => {
                    registerable
                        .unregister(function (error, registerable) {
                            expect(registerable.unregisteredAt).to.not.be.null;
                            expect(error).to.be.null;
                            done();
                        });
                });
        });
    });


    describe('', function () {
        let User, email;

        before(function (done) {
            User = mongoose.model('RegUser');
            email = faker.internet.email();

            const $credentials = {
                email: email,
                password: faker.internet.password()
            };

            User
                .register($credentials)
                .then(() => {
                    done();
                });
        });

        it('should be able to unregister promise based', function (done) {

            User
                .findOne({
                    email: email.toLowerCase()
                })
                .exec()
                .then(registerable => {
                    return registerable
                        .unregister();
                })
                .then(registerable => {
                    expect(registerable.unregisteredAt).to.not.be.null;
                    done();
                });
        });
    });


    describe('', function () {
        it('should be able to auto confirm registration', function (done) {
            const UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                }
            });
            const User = mongoose.model('RegaUser', UserSchema);

            const credentials = {
                email: faker.internet.email(),
                password: faker.internet.password()
            };

            User
                .register(credentials)
                .then(registerable => {
                    expect(registerable.registeredAt).to.not.be.null;
                    expect(registerable.email).to.be.equal(credentials.email.toLowerCase());

                    expect(registerable.confirmationToken).to.not.be.null;
                    expect(registerable.confirmedAt).to.not.be.null;

                    done();
                });
        });
    });



});