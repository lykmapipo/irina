'use strict';

//dependencies
var faker = require('faker');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));


describe('Lockable', function () {

    describe('', function () {
        let User;
        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                }
            });

            User = mongoose.model('User', UserSchema);
        });

        it('should have lockable attributes', function (done) {
            var User = mongoose.model('User');

            expect(User.schema.paths.failedAttempts).to.exist;
            expect(User.schema.paths.lockedAt).to.exist;
            expect(User.schema.paths.unlockedAt).to.exist;
            expect(User.schema.paths.unlockToken).to.exist;
            expect(User.schema.paths.unlockSentAt).to.exist;
            expect(User.schema.paths.unlockTokenExpiryAt).to.exist;

            done();
        });
    });


    describe('', function () {
        let User;
        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                }
            });

            User = mongoose.model('UserA', UserSchema);
        });

        it('should be able to generate unlock token callback style', function (done) {
            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            user
                .generateUnlockToken(function (error, lockable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(lockable.unlockToken).to.not.be.null;
                        expect(lockable.unlockTokenExpiryAt).to.not.be.null;

                        done();
                    }
                });
        });

        it('should be able to generate unlock token promise style', function (done) {
            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            user
                .generateUnlockToken()
                .then(lockable => {
                    expect(lockable.unlockToken).to.not.be.null;
                    expect(lockable.unlockTokenExpiryAt).to.not.be.null;
                    done();
                });
        });
    });



    describe('', function () {
        let User;
        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                }
            });

            User = mongoose.model('UserB', UserSchema);
        });

        it('should be able to send unlock instructions callback style', function (done) {
            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            user
                .sendUnLock(function (error, lockable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(lockable.unlockTokenSentAt).to.not.be.null;
                        done();
                    }
                });
        });
        it('should be able to send unlock instructions promise style', function (done) {
            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            user
                .sendUnLock()
                .then(lockable => {
                    expect(lockable.unlockTokenSentAt).to.not.be.null;
                    done();
                });
        });
    });



    describe('', function () {
        let LUser, User;
        before(function () {
            var UserLockableSchema = new Schema({});

            UserLockableSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                },
                lockable: {
                    enabled: true
                }
            });

            LUser = mongoose.model('LUser', UserLockableSchema);

            var UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                }
            });

            User = mongoose.model('UserC', UserSchema);

        });

        it('should be able to lock account callback style', function (done) {
            var user = new LUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            });

            user
                .lock(function (error, lockable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(lockable.lockedAt).to.not.be.null;
                        done();
                    }
                });
        });

        it('should be able to lock account promise style', function (done) {
            var user = new LUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            });

            user
                .lock()
                .then(lockable => {
                    expect(lockable.lockedAt).to.not.be.null;
                    done();
                });
        });


        it('should fail to lock account user with lockable.enabled false callback style', function (done) {
            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            });

            user
                .lock(function (error, lockable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(lockable.lockedAt).to.be.null;
                        done();
                    }
                });
        });

        it('should fail to lock account user with lockable.enabled false promise style', function (done) {
            var user = new User({
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            });

            user
                .lock()
                .then(lockable => {
                    expect(lockable.lockedAt).to.be.null;
                    done();
                });
        });
    });


    describe('', function () {
        let LUser, user;
        before(function () {
            var UserLockableSchema = new Schema({});

            UserLockableSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                },
                lockable: {
                    enabled: true
                }
            });

            LUser = mongoose.model('LUserA', UserLockableSchema);

        });


        before(function (done) {
            user = new LUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            });
            user
                .lock()
                .then(() => {
                    done();
                });
        });


        it('should be able to check if account is locked callback style', function (done) {
            user.isLocked(function (error) {
                expect(error).to.exist;
                expect(error.message)
                    .to.equal('Account locked. Check unlock instructions sent to you.');
                done();
            });
        });

        it('should be able to check if account is locked promise style', function (done) {
            user
                .isLocked()
                .catch(error => {
                    expect(error).to.exist;
                    expect(error.message)
                        .to.equal('Account locked. Check unlock instructions sent to you.');
                    done();
                });
        });
    });


    describe('', function () {
        let LUser, unlockToken;
        before(function () {
            var UserLockableSchema = new Schema({});

            UserLockableSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                },
                lockable: {
                    enabled: true
                }
            });

            LUser = mongoose.model('LUserB', UserLockableSchema);

        });

        before(function (done) {
            LUser
                .register({
                    email: faker.internet.email(),
                    password: faker.internet.password()
                })
                .then(lockable => {
                    return lockable.generateUnlockToken();
                })
                .then(lockable => {
                    return lockable
                        .sendUnLock();
                })
                .then(lockable => {
                    unlockToken = lockable.unlockToken;
                    done();
                });
        });

        it('should be able to unlock account', function (done) {
            LUser
                .unlock(
                unlockToken,
                function (error, lockable) {
                    expect(lockable.unlockedAt).to.not.be.null;
                    expect(lockable.lockedAt).to.be.null;
                    expect(lockable.failedAttempts).to.equal(0);
                    done();
                }
                );
        });
    });


    describe('', function () {
        let LUser, lockable, credentials;
        before(function () {
            var UserLockableSchema = new Schema({});

            UserLockableSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                },
                lockable: {
                    enabled: true
                }
            });

            LUser = mongoose.model('LUserC', UserLockableSchema);

        });

        before(function (done) {
            credentials = {
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            };

            const user = new LUser(credentials);
            user
                .lock()
                .then(_lockable_ => {
                    lockable = _lockable_;
                    done();
                });
        });

        it('should not be able to authenticate locked account', function (done) {
            lockable.authenticate(credentials.password, function (error) {
                expect(error).to.exist;
                expect(error.message)
                    .to.equal('Account locked. Check unlock instructions sent to you.');

                done();
            });
        });
    });


    describe('', function () {
        let LUser, lockable, credentials;
        before(function () {
            var UserLockableSchema = new Schema({});

            UserLockableSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                },
                lockable: {
                    enabled: true
                }
            });

            LUser = mongoose.model('LUserD', UserLockableSchema);

        });

        before(function (done) {
            credentials = {
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            };

            LUser
                .register(credentials)
                .then(user => {
                    return user
                        .lock();
                })
                .then(_lockable_ => {
                    lockable = _lockable_;
                    done();
                });

        });

        it('should not be able to authenticate registered locked account', function (done) {
            lockable
                .authenticate(credentials.password)
                .catch(error => {
                    expect(error).to.exist;
                    expect(error.message)
                        .to.equal('Account locked. Check unlock instructions sent to you.');
                    done();
                });
        });
    });



    describe('', function () {
        let User, lockable;
        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                }
            });

            User = mongoose.model('UserD', UserSchema);
        });

        before(function (done) {
            const user = new User({
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            });
            user
                .save()
                .then(() => {
                    lockable = user;
                    done();
                });
        });

        it('should be able to reset failed attempts callback style', function (done) {
            lockable.resetFailedAttempts(function (error, lockable) {
                expect(lockable.failedAttempts).to.be.equal(0);
                expect(error).to.be.null;
                done();
            });
        });
    });

    describe('', function () {
        let User, lockable;
        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina, {
                registerable: {
                    autoConfirm: true
                }
            });

            User = mongoose.model('UserE', UserSchema);
        });

        before(function (done) {
            const user = new User({
                email: faker.internet.email(),
                password: faker.internet.password(),
                failedAttempts: 5
            });
            user
                .save()
                .then(() => {
                    lockable = user;
                    done();
                });
        });

        it('should be able to reset failed attempts promise style', function (done) {
            lockable.resetFailedAttempts()
                .then(lockable => {
                    expect(lockable.failedAttempts).to.be.equal(0);
                    done();
                });
        });
    });
});
