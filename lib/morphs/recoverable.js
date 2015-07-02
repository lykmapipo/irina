'use strict';

//dependencies
var async = require('async');
var _ = require('lodash');
var path = require('path');
var Utils = require(path.join(__dirname, '..', 'utils'));

/**
 * @constructor
 * 
 * @description Recoverable takes care of resetting account password 
 *              and send reset instructions.
 *              See {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Recoverable|Recoverable}
 *
 * @public
 */
module.exports = exports = function Recoverable(schema, options) {
    //prepare options
    options = options || {};

    //add recoverable schema attributes
    schema.add({
        recoveryToken: {
            type: String,
            default: null,
            index: true,
            hide: true
        },
        recoveryTokenExpiryAt: {
            type: Date,
            default: null,
            hide: true
        },
        recoverySentAt: {
            type: Date,
            default: null,
            hide: true
        },
        recoveredAt: {
            type: Date,
            default: null,
            hide: true
        }
    });


    //--------------------------------------------------------------------------
    //recoverable instance methods
    //--------------------------------------------------------------------------

    /**
     * @function
     *
     * @description generate recovery token to be used to recover account
     *              This function must be called within model instance context
     *
     * @param {generateRecoveryToken~callback} done callback that handles the response.
     * @private
     */
    schema.methods.generateRecoveryToken = function(done) {
        //this refer to the model instance context
        var recoverable = this;

        //set recovery expiration date
        var recoveryTokenExpiryAt =
            Utils.addDays(options.recoverable.tokenLifeSpan);

        //generate recovery token based
        //on recovery token expiry at
        var tokenizer =
            Utils.tokenizer(recoveryTokenExpiryAt.getTime().toString());

        //set recoveryToken
        recoverable.recoveryToken = tokenizer.encrypt(recoverable.email);

        //set recovery token expiry date
        recoverable.recoveryTokenExpiryAt = recoveryTokenExpiryAt;

        //clear previous recovery details if any
        recoverable.recoveredAt = null;

        done(null, recoverable);
    };
    //documentation for `done` callback of `generateRecoveryToken`
    /**
     * @description a callback to be called once generate recovery token is done
     * @callback generateRecoveryToken~callback
     * @param {Object} error any error encountered during generating recovery token
     * @param {Object} recoverable recoverable instance with `recoveryToken`,
     *                             and `recoveryTokenExpiryAt` set-ed
     */


    /**
     * @function
     *
     * @description send recovery instructions to allow account to be recovered.
     *              This method must be called within model instance context
     *
     * @param {sendRecovery~callback} done callback that handles the response.
     * @private
     */
    schema.methods.sendRecovery = function(done) {
        //this refer to model instance context
        var recoverable = this;

        var isRecovered =
            recoverable.recoveredAt && recoverable.recoveredAt !== null;

        //if already recovered back-off
        if (isRecovered) {
            done(null, recoverable);
        }

        //send recovery instructions
        else {
            recoverable
                .send(
                    'Password recovery',
                    recoverable,
                    function finish() {
                        //update recovery send time
                        recoverable.recoverySentAt = new Date();

                        //save recoverable instance
                        recoverable.save(function(error) {
                            if (error) {
                                done(error);
                            } else {
                                done(null, recoverable);
                            }
                        });
                    });
        }
    };
    //documentation for `done` callback of `sendRecovery`
    /**
     * @description a callback to be called once sending recovery instructions is done
     * @callback sendRecovery~callback
     * @param {Object} error any error encountered during sending recovery instructions
     * @param {Object} crecoverable recoverable instance with `recoverySentAt`
     *                              updated and persisted
     */


    //--------------------------------------------------------------------------
    //recoverable static/class methods
    //--------------------------------------------------------------------------


    /**
     * @function
     * 
     * @description request user password recovering
     * 
     * @param  {Objecr}   criteria criteria to be used to find a requesting user
     * @param  {requestRecover~callback} done callback that handles the response
     * @public
     */
    schema.statics.requestRecover = function(criteria, done) {
        //this refer to model static context
        var Recoverable = this;

        async
            .waterfall(
                [
                    function findRecoverable(next) {
                        Recoverable.findOne(criteria).exec(next);
                    },
                    function generateRecoveryToken(recoverable, next) {
                        recoverable.generateRecoveryToken(next);
                    },
                    function sendRecovery(recoverable, next) {
                        recoverable.sendRecovery(next);
                    }
                ], done);
    };
    //documentation for `done` callback of `requestRecover`
    /**
     * @description a callback to be called once requesting password recovering 
     *              is done
     * @callback requestRecover~callback
     * @param {Object} error any error encountered during requesting password recover
     * @param {Object} recoverable recoverable instance
     */



    /**
     * @function
     *
     * @description recover account password
     *              This method must be called within model static context
     *
     * @param  {String}   recoveryToken a valid recovery token send during
     *                                      `sendRecovery`
     * @param  {String}   newPassword    new password to be used when recover account
     * @param {recover~callback} done callback that handles the response.
     * @private
     */
    schema.statics.recover = function(recoveryToken, newPassword, done) {
        //this refer to model static context
        var Recoverable = this;

        //TODO sanitize input
        //refactor

        async
            .waterfall(
                [
                    function(next) {
                        //find recoverable using recovery token
                        Recoverable
                            .findOne({
                                recoveryToken: recoveryToken
                            })
                            .exec(next);
                    },
                    function(recoverable, next) {
                        //any recoverable found?
                        var recoverableNotExist =
                            _.isUndefined(recoverable) || _.isNull(recoverable);

                        if (recoverableNotExist) {
                            next(new Error('Invalid recovery token'));
                        } else {
                            next(null, recoverable);
                        }
                    },
                    function(recoverable, next) {
                        //check if recovery token expired
                        var isTokenExpired = !Utils.isAfter(new Date(), recoverable.recoveryTokenExpiryAt);

                        if (isTokenExpired) {
                            //if expired
                            next(new Error('Recovery token expired'));
                        } else {
                            //otherwise continue with token verification
                            next(null, recoverable);
                        }
                    },
                    function(recoverable, next) {
                        //verify recovery token
                        var value =
                            recoverable.recoveryTokenExpiryAt.getTime().toString();

                        var tokenizer =
                            Utils.tokenizer(value);

                        if (!tokenizer.match(recoveryToken, recoverable.email)) {
                            next(new Error('Invalid recovery token'));
                        } else {
                            //is valid token
                            next(null, recoverable);
                        }
                    },
                    function(recoverable, next) {
                        //set new password
                        recoverable.password = newPassword;
                        //encrypt password
                        recoverable.encryptPassword(next);
                    },
                    function(recoverable, next) {
                        //update recovery details
                        recoverable.recoveredAt = new Date();

                        //save recoverable instance
                        recoverable.save(function(error) {
                            if (error) {
                                next(error);
                            } else {
                                next(null, recoverable);
                            }
                        });
                    }
                ],
                function(error, recoverable) {
                    //TODO fire events after recover account
                    if (error) {
                        done(error);
                    } else {
                        done(null, recoverable);
                    }
                });
    };
    //documentation for `done` callback of `recover`
    /**
     * @description a callback to be called once recovery is done
     * @callback recover~callback
     * @param {Object} error any error encountered during recovering account
     * @param {Object} recoverable recoverable instance with `recoveredAt`
     *                             updated and persisted
     */
};