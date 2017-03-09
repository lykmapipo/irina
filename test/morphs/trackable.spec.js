'use strict';

//dependencies
var faker = require('faker');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));

describe('Trackable', function () {

    describe('', function () {
        let User;
        before(function (done) {
            const UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);

            done();
        });

        it('should have trackable attributes', function (done) {

            expect(User.schema.paths.signInCount).to.exist;
            expect(User.schema.paths.currentSignInAt).to.exist;
            expect(User.schema.paths.currentSignInIpAddress).to.exist;
            expect(User.schema.paths.lastSignInAt).to.exist;
            expect(User.schema.paths.lastSignInIpAddress).to.exist;
            done();
        });
    });



    describe('', function () {
        let User;

        const previousIp = faker.internet.ip();

        before(function (done) {
            const UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);

            done();
        });

        it('should be able to set trackable details callback style', function (done) {
            const trackable = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            expect(trackable.track).to.exist;
            expect(trackable).to.respondTo('track');

            trackable
                .track(previousIp, function (error, trackable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(trackable.currentSignInAt).to.not.be.null;
                        expect(trackable.currentSignInIpAddress).to.not.be.null;
                        expect(trackable.currentSignInIpAddress).to.equal(previousIp);
                        done();
                    }
                });
        });

        it('should be able to set trackable details promise style', function (done) {
            const trackable = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });

            expect(trackable.track).to.exist;
            expect(trackable).to.respondTo('track');

            trackable
                .track(previousIp)
                .then(trackable => {
                    expect(trackable.currentSignInAt).to.not.be.null;
                    expect(trackable.currentSignInIpAddress).to.not.be.null;
                    expect(trackable.currentSignInIpAddress).to.equal(previousIp);
                    done();
                });
        });
    });



    describe('', function () {
        let User, trackable;
        const previousIp = faker.internet.ip();
        const currentIp = faker.internet.ip();

        before(function (done) {
            const UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);

            done();
        });

        before(function (done) {
            const user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });
            user
                .track(previousIp)
                .then(_user_ => {
                    trackable = _user_;
                    done();
                });
        });

        it('should be able to update tracking details', function (done) {
            trackable.track(currentIp, function (error, trackable) {
                expect(trackable.lastSignInIpAddress).not.to.equal(trackable.currentSignInIpAddress);
                expect(trackable.lastSignInIpAddress).to.equal(previousIp);
                expect(trackable.currentSignInIpAddress).to.equal(currentIp);
                done();
            });
        });
    });

});