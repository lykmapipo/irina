'use strict';

//dependencies
var faker = require('faker');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var Police = require(path.join(__dirname, '..', '..', 'index'));

var previousIp = faker.internet.ip();
var currentIp = faker.internet.ip();
var email = faker.internet.email();

describe('Trackable', function() {
    before(function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(Police);
        mongoose.model('TUser', UserSchema);

        done();
    });

    it('should have trackable attributes', function(done) {
        var User = mongoose.model('TUser');

        expect(User.schema.paths.signInCount).to.exist;
        expect(User.schema.paths.currentSignInAt).to.exist;
        expect(User.schema.paths.currentSignInIpAddress).to.exist;
        expect(User.schema.paths.lastSignInAt).to.exist;
        expect(User.schema.paths.lastSignInIpAddress).to.exist;
        done();
    });

    it('should be able to set trackable details', function(done) {
        var User = mongoose.model('TUser');

        var trackable = new User({
            email: email,
            password: faker.internet.password()
        });

        expect(trackable.track).to.exist;
        expect(trackable).to.respondTo('track');

        trackable
            .track(previousIp, function(error, trackable) {
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

    it('should be able to update tracking details', function(done) {
        var User = mongoose.model('TUser');
        var lastSignInAt;

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
                    function(trackable, next) {
                        lastSignInAt = trackable.currentSignInAt;

                        expect(trackable.signInCount).to.equal(1);
                        expect(trackable.currentSignInAt).to.not.be.null;
                        expect(trackable.currentSignInIpAddress).to.not.be.null;
                        expect(trackable.currentSignInIpAddress).to.equal(previousIp);

                        next(null, trackable);
                    },
                    function(trackable, next) {
                        trackable.track(currentIp, next);
                    }
                ],
                function(error, trackable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(trackable.signInCount).to.equal(2);

                        expect(trackable.lastSignInAt).to.not.be.null;
                        expect(trackable.lastSignInAt.getTime())
                            .to.equal(lastSignInAt.getTime());

                        expect(trackable.lastSignInIpAddress).to.not.be.null;
                        expect(trackable.lastSignInIpAddress).to.equal(previousIp);

                        expect(trackable.currentSignInAt).to.not.be.null;
                        expect(trackable.currentSignInIpAddress).to.not.be.null;
                        expect(trackable.currentSignInIpAddress).to.equal(currentIp);

                        done();
                    }
                });
    });

});