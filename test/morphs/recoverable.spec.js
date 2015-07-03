'use strict';

//dependencies
var faker = require('faker');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));

describe('Recoverable', function() {
    before(function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(irina);
        mongoose.model('RecUser', UserSchema);

        done();
    });

    it('should have recoverable attributes', function(done) {
        var User = mongoose.model('RecUser');

        expect(User.schema.paths.recoveryToken).to.exist;
        expect(User.schema.paths.recoveryTokenExpiryAt).to.exist;
        expect(User.schema.paths.recoverySentAt).to.exist;
        expect(User.schema.paths.recoveredAt).to.exist;

        done();
    });

    it('should be able to generate recovery token', function(done) {
        var User = mongoose.model('RecUser');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password()
        });

        expect(user.generateRecoveryToken).to.be.a('function');

        user
            .generateRecoveryToken(function(error, recoverable) {
                if (error) {
                    done(error);
                } else {

                    expect(recoverable.recoveryToken).to.not.be.null;
                    expect(recoverable.recoveryTokenExpiryAt).to.not.be.null;

                    done();
                }
            });

    });

    it('should be able to send recovery instruction', function(done) {
        var User = mongoose.model('RecUser');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password()
        });

        expect(user.sendRecovery).to.be.a('function');

        async.waterfall([
            function(next) {
                user.generateRecoveryToken(next);
            },
            function(recoverable, next) {
                user.sendRecovery(next);
            }
        ], function(error, recoverable) {
            if (error) {
                done(error);
            } else {

                expect(recoverable.recoveryToken).to.not.be.null;
                expect(recoverable.recoverySentAt).to.not.be.null;
                expect(recoverable.recoveryExpiredAt).to.not.be.null;

                done();
            }
        });
    });

    it('should be able to request recover account password', function(done) {
        var User = mongoose.model('RecUser');

        async
            .waterfall(
                [
                    function(next) {
                        User
                            .register({
                                email: faker.internet.email(),
                                password: faker.internet.password()
                            }, next);
                    },
                    function(recoverable, next) {
                        User.requestRecover({
                            email: recoverable.email
                        }, next);
                    }
                ],
                function(error, recoverable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(recoverable.recoveryToken).to.not.be.null;
                        expect(recoverable.recoveryTokenExpiryAt).to.not.be.null;
                        expect(recoverable.recoveryTokenSentAt).to.not.be.null;
                        done();
                    }
                });
    });


    it('should be able to recover account password', function(done) {
        var User = mongoose.model('RecUser');
        var previousPassord;

        async
            .waterfall(
                [
                    function(next) {
                        User
                            .register({
                                email: faker.internet.email(),
                                password: faker.internet.password()
                            }, next);
                    },
                    function(recoverable, next) {
                        recoverable.generateRecoveryToken(next);
                    },
                    function(recoverable, next) {
                        recoverable.sendRecovery(next);
                    },
                    function(recoverable, next) {
                        previousPassord = recoverable.password;

                        User
                            .recover(
                                recoverable.recoveryToken,
                                faker.internet.password(),
                                next
                            );
                    }
                ],
                function(error, recoverable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(recoverable.password).to.not.be.null;
                        expect(recoverable.password).to.not.equal(previousPassord);
                        expect(recoverable.recoveredAt).to.not.be.null;
                        done();
                    }
                });
    });
});