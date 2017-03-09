'use strict';

//dependencies
var faker = require('faker');
var path = require('path');
var mongoose = require('mongoose');
var expect = require('chai').expect;
var Schema = mongoose.Schema;
var irina = require(path.join(__dirname, '..', '..', 'index'));


describe('confirmable', function () {
    let User;
    before(function (done) {
        var UserSchema = new Schema({});
        UserSchema.plugin(irina);
        User = mongoose.model(`User+${faker.random.number()}`, UserSchema);

        done();
    });


    describe('', function () {
        it('should have confirmable attributes', function (done) {

            expect(User.schema.paths.confirmationToken).to.exist;
            expect(User.schema.paths.confirmationTokenExpiryAt).to.exist;
            expect(User.schema.paths.confirmedAt).to.exist;
            expect(User.schema.paths.confirmationSentAt).to.exist;

            done();
        });
    });


    describe('', function () {
        let User, user;


        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
            user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });
        });

        it('should be able to generate confirmation token callback based', function (done) {
            user
                .generateConfirmationToken(function (error, confirmable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(confirmable.confirmationToken).to.not.be.null;
                        expect(confirmable.confirmationTokenExpiryAt).to.not.be.null;
                        done();
                    }
                });
        });

        it('should be able to generate confirmation token promise based', function (done) {
            user
                .generateConfirmationToken()
                .then(confirmable => {
                    expect(confirmable.confirmationToken).to.not.be.null;
                    expect(confirmable.confirmationTokenExpiryAt).to.not.be.null;
                    done();
                });
        });
    });



    describe('', function () {
        let User, user;

        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
            user = new User({
                email: faker.internet.email(),
                password: faker.internet.password()
            });
        });

        it('should be able to send confirmation instructions callback based', function (done) {
            user
                .sendConfirmation(function (error, confirmable) {
                    if (error) {
                        done(error);
                    } else {
                        expect(confirmable.confirmationSentAt).to.not.be.null;
                        done();
                    }
                });
        });

        it('should be able to send confirmation instructions promise based', function (done) {
            user
                .sendConfirmation()
                .then(confirmable => {
                    expect(confirmable.confirmationSentAt).to.not.be.null;
                    done();
                });
        });
    });



    describe('', function () {
        let User, user;

        before(function () {
            var UserSchema = new Schema({});
            UserSchema.plugin(irina);
            User = mongoose.model(`User+${faker.random.number()}`, UserSchema);
        });

        before(function (done) {
            User
                .register({
                    email: faker.internet.email(),
                    password: faker.internet.password()
                })
                .then(registered => {
                    user = registered;
                    done();
                });
        });

        it('should be able to confirm registration callback based', function (done) {
            User
                .confirm(user.confirmationToken, function (error, confirmable) {
                    expect(confirmable.confirmedAt).to.not.be.null;
                    expect(error).to.be.null;
                    done();
                });
        });

        it('should be able to confirm registration promise based', function (done) {
            User
                .confirm(user.confirmationToken)
                .then(confirmable => {
                    expect(confirmable.confirmedAt).to.not.be.null;
                    done();
                });
        });
    });

    //TODO
    // it('should check for confirmation', function(done) {
    //     done();
    // });
});