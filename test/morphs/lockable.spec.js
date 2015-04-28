'use strict';

//dependencies
var faker = require('faker');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var Police = require(path.join(__dirname, '..', '..', 'index'));


describe('Lockable', function() {
    before(function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(Police);
        mongoose.model('LUser', UserSchema);

        done();
    });

    it('should have lockable attributes', function(done) {
        var User = mongoose.model('LUser');

        expect(User.schema.paths.failedAttempts).to.exist;
        expect(User.schema.paths.lockedAt).to.exist;
        expect(User.schema.paths.unlockedAt).to.exist;
        expect(User.schema.paths.unlockToken).to.exist;
        expect(User.schema.paths.unlockSentAt).to.exist;
        expect(User.schema.paths.unlockTokenExpiryAt).to.exist;

        done();
    });

    it('should be able to generate unlock token', function(done) {
        var User = mongoose.model('LUser');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password()
        });

        expect(user.generateUnlockToken).to.be.a('function');

        user
            .generateUnlockToken(function(error, lockable) {
                if (error) {
                    done(error);
                } else {
                    expect(lockable.unlockToken).to.not.be.null;
                    expect(lockable.unlockTokenExpiryAt).to.not.be.null;

                    done();
                }
            });
    });

    it('should be able to send unlock notification', function(done) {
        var User = mongoose.model('LUser');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password()
        });

        expect(user.sendUnLock).to.be.a('function');

        user
            .sendUnLock(function(error, lockable) {
                if (error) {
                    done(error);
                } else {
                    expect(lockable.unlockTokenSentAt).to.not.be.null;
                    done();
                }
            });
    });

    it('should have lock ability', function(done) {
        var User = mongoose.model('LUser');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password(),
            failedAttempts: 5
        });

        expect(user.lock).to.be.a('function');

        user
            .lock(function(error, lockable) {
                if (error) {
                    done(error);
                } else {
                    expect(lockable.lockedAt).to.not.be.null;
                    done();
                }
            });
    });

    it('should have unlock ability', function(done) {
        var User = mongoose.model('LUser');
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
                    function(lockable, next) {
                        lockable.generateUnlockToken(next);
                    },
                    function(lockable, next) {
                        lockable.sendUnLock(next);
                    },
                    function(lockable, next) {
                        User
                            .unlock(
                                lockable.unlockToken,
                                next
                            );
                    }
                ],
                function(error, lockable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(lockable.unlockedAt).to.not.be.null;
                        expect(lockable.lockedAt).to.be.null;
                        expect(lockable.failedAttempts).to.equal(0);
                        done();
                    }
                });
    });

    it('should be able to reset failed attempts', function(done) {
        done();
    });
});