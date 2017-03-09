'use strict';

//dependencies
var faker = require('faker');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));

describe('Recoverable', function () {

    describe('', function () {
        let User;
        before(function (done) {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);

            done();
        });

        it('should have recoverable attributes', function (done) {
            expect(User.schema.paths.recoveryToken).to.exist;
            expect(User.schema.paths.recoveryTokenExpiryAt).to.exist;
            expect(User.schema.paths.recoverySentAt).to.exist;
            expect(User.schema.paths.recoveredAt).to.exist;

            done();
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

        it('should be able to generate recovery token callback style', function (done) {

            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            user
                .generateRecoveryToken(function (error, recoverable) {
                    if (error) {
                        done(error);
                    } else {

                        expect(recoverable.recoveryToken).to.not.be.null;
                        expect(recoverable.recoveryTokenExpiryAt).to.not.be.null;

                        done();
                    }
                });

        });

        it('should be able to generate recovery token promise style', function (done) {

            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            user
                .generateRecoveryToken()
                .then(recoverable => {
                    expect(recoverable.recoveryToken).to.not.be.null;
                    expect(recoverable.recoveryTokenExpiryAt).to.not.be.null;

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

        it('should be able to send recovery instruction callback style', function (done) {

            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });
            user
                .generateRecoveryToken()
                .then(recoverable => {
                    recoverable.sendRecovery((error, recoverable) => {
                        expect(recoverable.recoveryToken).to.not.be.null;
                        expect(recoverable.recoverySentAt).to.not.be.null;
                        expect(recoverable.recoveryExpiredAt).to.not.be.null;

                        done();
                    });
                });
        });
        it('should be able to send recovery instruction promise style', function (done) {

            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });
            user
                .generateRecoveryToken()
                .then(recoverable => {
                    return recoverable.sendRecovery();
                })
                .then(recoverable => {
                    expect(recoverable.recoveryToken).to.not.be.null;
                    expect(recoverable.recoverySentAt).to.not.be.null;
                    expect(recoverable.recoveryExpiredAt).to.not.be.null;

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

        it('should be able to request recover account password callback style', function (done) {
            User
                .register({
                    email: faker.internet.email(),
                    password: faker.internet.password()
                })
                .then(recoverable => {
                    User.requestRecover({
                        email: recoverable.email
                    }, function (error, recoverable) {
                        expect(recoverable.recoveryToken).to.not.be.null;
                        expect(recoverable.recoveryTokenExpiryAt).to.not.be.null;
                        expect(recoverable.recoveryTokenSentAt).to.not.be.null;
                        expect(error).to.be.null;
                        done();
                    });
                });
        });

        it('should be able to request recover account password promise style', function (done) {
            User
                .register({
                    email: faker.internet.email(),
                    password: faker.internet.password()
                })
                .then(recoverable => {
                    return User.requestRecover({
                        email: recoverable.email
                    });
                })
                .then(recoverable => {
                    expect(recoverable.recoveryToken).to.not.be.null;
                    expect(recoverable.recoveryTokenExpiryAt).to.not.be.null;
                    expect(recoverable.recoveryTokenSentAt).to.not.be.null;
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
        it('should be able to recover account password callback style', function (done) {
            var previousPassord;
            User
                .register({
                    email: faker.internet.email(),
                    password: faker.internet.password()
                })
                .then(recoverable => {
                    return recoverable.generateRecoveryToken();
                })
                .then(recoverable => {
                    return recoverable.sendRecovery();
                })
                .then(recoverable => {
                    previousPassord = recoverable.password;

                    User
                        .recover(
                        recoverable.recoveryToken,
                        faker.internet.password(),
                        function (error, recoverable) {
                            expect(recoverable.password).to.not.be.null;
                            expect(recoverable.password).to.not.equal(previousPassord);
                            expect(recoverable.recoveredAt).to.not.be.null;
                            expect(error).to.be.null;
                            done();
                        }
                        );
                });
        });

        it('should be able to recover account password promise style', function (done) {
            var previousPassord;
            User
                .register({
                    email: faker.internet.email(),
                    password: faker.internet.password()
                })
                .then(recoverable => {
                    return recoverable.generateRecoveryToken();
                })
                .then(recoverable => {
                    return recoverable.sendRecovery();
                })
                .then(recoverable => {
                    previousPassord = recoverable.password;

                    return User
                        .recover(
                        recoverable.recoveryToken,
                        faker.internet.password()
                        );
                })
                .then(recoverable => {
                    expect(recoverable.password).to.not.be.null;
                    expect(recoverable.password).to.not.equal(previousPassord);
                    expect(recoverable.recoveredAt).to.not.be.null;
                    done();
                });
        });
    });
});