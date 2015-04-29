'use strict';

//dependencies
var faker = require('faker');
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var Police = require(path.join(__dirname, '..', '..', 'index'));


describe('confirmable', function() {
    before(function(done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(Police);
        mongoose.model('ConUser', UserSchema);

        done();
    });

    it('should have confirmable attributes', function(done) {
        var User = mongoose.model('ConUser');

        expect(User.schema.paths.confirmationToken).to.exist;
        expect(User.schema.paths.confirmationTokenExpiryAt).to.exist;
        expect(User.schema.paths.confirmedAt).to.exist;
        expect(User.schema.paths.confirmationSentAt).to.exist;

        done();
    });

    it('should be able to generate confirmation token', function(done) {
        var User = mongoose.model('ConUser');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password()
        });

        expect(user.generateConfirmationToken).to.be.a('function');

        user
            .generateConfirmationToken(function(error, confirmable) {
                if (error) {
                    done(error);
                } else {
                    expect(confirmable.confirmationToken).to.not.be.null;
                    expect(confirmable.confirmationTokenExpiryAt).to.not.be.null;
                    done();
                }
            });
    });

    it('should be able to send confirmation instructions', function(done) {
        var User = mongoose.model('ConUser');

        var user = new User({
            email: faker.internet.email(),
            password: faker.internet.password()
        });

        expect(user.sendConfirmation).to.be.a('function');

        user
            .sendConfirmation(function(error, confirmable) {
                if (error) {
                    done(error);
                } else {
                    expect(confirmable.confirmationSentAt).to.not.be.null;
                    done();
                }
            });
    });

    it('should be able to confirm registration', function(done) {
        var User = mongoose.model('ConUser');

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
                    function(confirmable, next) {
                        User
                            .confirm(confirmable.confirmationToken, next);
                    }
                ],
                function(error, confirmable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(confirmable.confirmedAt).to.not.be.null;
                        done();
                    }
                });
    });

    //TODO
    // it('should check for confirmation', function(done) {
    //     done();
    // });
});