'use strict';

//dependencies
var faker = require('faker');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));


describe('Lockable', function() {
    before(function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(irina, {
            registerable: {
                autoConfirm: true
            }
        });
        var UserLockableSchema = new Schema({});

        UserLockableSchema.plugin(irina, {
            registerable: {
                autoConfirm: true
            },
            lockable:{
                enabled:true
            }
        });
        mongoose.model('User', UserSchema);
        mongoose.model('LUser', UserLockableSchema);

        done();
    });

    it('should have lockable attributes', function(done) {
        var User = mongoose.model('User');

        expect(User.schema.paths.failedAttempts).to.exist;
        expect(User.schema.paths.lockedAt).to.exist;
        expect(User.schema.paths.unlockedAt).to.exist;
        expect(User.schema.paths.unlockToken).to.exist;
        expect(User.schema.paths.unlockSentAt).to.exist;
        expect(User.schema.paths.unlockTokenExpiryAt).to.exist;

        done();
    });

    it('should be able to generate unlock token', function(done) {
        var User = mongoose.model('User');

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

    it('should be able to send unlock instructions', function(done) {
        var User = mongoose.model('User');

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

    it('should be able to lock account', function(done) {
        var LUser = mongoose.model('LUser');

        var user = new LUser({
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

    it('should fail to lock account user with lockable.enabled false', function(done) {
        var User = mongoose.model('User');

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
                    expect(lockable.lockedAt).to.be.null;
                    done();
                }
            });
    });


    it('should be able to check if account is locked', function(done) {
        var LUser = mongoose.model('LUser');

        var user = new LUser({
            email: faker.internet.email(),
            password: faker.internet.password(),
            failedAttempts: 5
        });

        expect(user.isLocked).to.be.a('function');

        async.waterfall([
            function(next) {
                user.lock(next);
            },
            function(lockable, next) {
                user.isLocked(next);
            }
        ], function(error /*, lockable*/ ) {
            expect(error).to.exist;
            expect(error.message)
                .to.equal('Account locked. Check unlock instructions sent to you.');

            done();
        });
    });


    it('should be able to unlock account', function(done) {
        var LUser = mongoose.model('LUser');
        async
        .waterfall(
            [
                function(next) {
                    LUser
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
                    LUser
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

    it('should not be able to authenticate locked account', function(done) {
        var LUser = mongoose.model('LUser');
        var credentials = {
            email: faker.internet.email(),
            password: faker.internet.password(),
            failedAttempts: 5
        };

        async
        .waterfall(
            [
                function(next) {
                    next(null, new LUser(credentials));
                },
                function(lockable, next) {
                    lockable.lock(next);
                },
                function(lockable, next) {
                    lockable.authenticate(credentials.password, next);
                }
            ],
            function(error /*, lockable*/ ) {

                expect(error).to.exist;
                expect(error.message)
                    .to.equal('Account locked. Check unlock instructions sent to you.');

                done();
            });
    });

    it('should not be able to authenticate registered locked account', function(done) {
        var LUser = mongoose.model('LUser');
        var credentials = {
            email: faker.internet.email(),
            password: faker.internet.password(),
            failedAttempts: 5
        };

        async
        .waterfall(
            [
                function(next) {
                    LUser.register(credentials, next);
                },
                function(lockable, next) {
                    lockable.lock(next);
                },
                function(lockable, next) {
                    LUser.authenticate({ email: credentials.email, password: credentials.password }, next);
                }
            ],
            function(error /*, lockable*/ ) {

                expect(error).to.exist;
                expect(error.message)
                    .to.equal('Account locked. Check unlock instructions sent to you.');

                done();
            });
    });

    it('should be able to reset failed attempts', function(done) {
        var User = mongoose.model('User');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password(),
            failedAttempts: 5
        });

        expect(user.resetFailedAttempts).to.be.a('function');

        async
        .waterfall([
            function save(next) {
                user.save(function(error) {
                    if (error) {
                        next(error);
                    } else {
                        next(null, user);
                    }
                });
            },
            function resetFailedAttempts(user, next) {
                user.resetFailedAttempts(next);
            }
        ], function(error, lockable) {
            if (error) {
                done(error);
            } else {
                expect(lockable.failedAttempts).to.be.equal(0);
                done();
            }
        });
    });
});
