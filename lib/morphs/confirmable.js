'use strict';

//dependencies
var _ = require('lodash');
var async = require('async');
var path = require('path');
var Utils = require(path.join(__dirname, '..', 'utils'));

/**
 * @constructor
 *
 * @description Confirmable is responsible to verify if an account is
 *              already confirmed to sign in, and to send confirmation instructions.
 *               
 *              See {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Confirmable|Confirmable}
 *
 * @public
 */
module.exports = exports = function Confirmable(schema, options) {
    //prepare options
    options = options || {};

    //add confirmable schema fields
    schema.add({
        confirmationToken: {
            type: String,
            default: null,
            index: true
        },
        confirmationTokenExpiryAt: {
            type: Date,
            default: null
        },
        confirmedAt: {
            type: Date,
            default: null
        },
        confirmationSentAt: {
            type: Date,
            default: null
        }
    });

    //--------------------------------------------------------------------------
    //confirmable instance methods
    //--------------------------------------------------------------------------

    /**
     * @function
     *
     * @description generate confirmation token to be used to confirm 
     *              account creation.
     *              This  function must be called within model instance context
     *
     * @param {generateConfirmationToken~callback} done callback that handles the response.
     * @private
     */
    schema.methods.generateConfirmationToken = function(done) {
        //this context is of model instance
        var confirmable = this;

        //set confirmation expiration date
        var confirmationTokenExpiryAt =
            Utils.addDays(options.confirmable.tokenLifeSpan);

        //generate confirmation token based
        //on confirmation token expiry at
        var tokenizer =
            Utils.tokenizer(confirmationTokenExpiryAt.getTime().toString());

        //set confirmationToken
        confirmable.confirmationToken = tokenizer.encrypt(confirmable.email);

        //set confirmation token expiry date
        confirmable.confirmationTokenExpiryAt = confirmationTokenExpiryAt;

        //clear previous confirm details if any
        confirmable.confirmedAt = null;

        //return confirmable
        done(null, confirmable);
    };
    //documentation for `done` callback of `generateConfirmationToken`
    /**
     * @description a callback to be called once generate confirmation token is done
     * @callback generateConfirmationToken~callback
     * @param {Object} error any error encountered during generating confirmation token
     * @param {Object} confirmable confirmable instance with `confirmationToken`,
     *                             and `confirmationTokenExpiryAt` set-ed
     */


    /**
     * @function
     *
     * @description send confirmation instructions to allow account 
     *              to be confirmed.
     *              This method must be called within instance context
     *
     * @param {sendConfirmation~callback} done callback that handles the response.
     * @private
     */
    schema.methods.sendConfirmation = function(done) {
        //this refer to model instance context
        var confirmable = this;

        var isConfirmed =
            (confirmable.confirmedAt && confirmable.confirmedAt !== null);

        //if already confirmed back-off
        if (isConfirmed) {
            done(null, confirmable);
        }

        //send confirmation instruction
        else {
            confirmable
                .send(
                    'Account confirmation',
                    confirmable,
                    function finish() {
                        //update confirmation send time
                        confirmable.confirmationSentAt = new Date();

                        //save confirmable instance
                        confirmable.save(function(error) {
                            if (error) {
                                done(error);
                            } else {
                                done(null, confirmable);
                            }
                        });
                    });
        }
    };
    //documentation for `done` callback of `sendConfirmation`
    /**
     * @description a callback to be called once sending confirmation is done
     * @callback sendConfirmation~callback
     * @param {Object} error any error encountered during sending confirmation
     * @param {Object} confirmable confirmable instance with `confirmationSentAt`
     *                             updated and persisted
     */


    /**
     * @function
     *
     * @description Check if account is confirmed by using the below flow:
     *              1. If is confirmed continue.
     *              2. If not confirmed and confirmation token not expired 
     *                 throw `Account not confirmed`
     *              3. If not confirmed and confirmation token expired
     *                 generate confirmation token, send it and throw
     *                 `Confirmation token expired. Check your email for confirmation instructions`
     *
     * @callback isConfirmed~callback done callback that handle response
     * @private
     */
    schema.methods.isConfirmed = function(done) {
        //this context is of model instance
        var confirmable = this;

        //check if already confirmed
        var isConfirmed =
            (confirmable.confirmedAt && confirmable.confirmedAt !== null);

        //check if confirmation token expired
        var isTokenExpired = !Utils.isAfter(new Date(), confirmable.confirmationTokenExpiryAt);

        //account has not been confirmed
        //and token has not yet expire
        if (!isConfirmed && !isTokenExpired) {
            done(new Error('Account not confirmed'));
        }

        //account has not been confirmed and
        //confirmation token is expired 
        else if (!isConfirmed && isTokenExpired) {
            //compose confirmation
            async
                .waterfall(
                    [
                        function generateConfirmationToken(next) {
                            confirmable.generateConfirmationToken(next);
                        },
                        function sendConfirmation(confirmable, next) {
                            confirmable.sendConfirmation(next);
                        }
                    ],
                    function(error /*, confirmable*/ ) {
                        //is there any error during
                        //compose new confirmation?
                        if (error) {
                            done(error);
                        }
                        //new confirmation token is
                        // and send successfully
                        else {
                            done(new Error('Confirmation token expired. Check your email for confirmation instructions.'));
                        }
                    });
        }

        //is confirmed 
        else {
            done(null, confirmable);
        }
    };
    //documentation for `done` callback of `isConfirmed`
    /**
     * @description a callback to be called once check confirmation is done
     * @callback isConfirmed~callback
     * @param {Object} error any error encountered during the process of checking
     *                       confirmation
     * @param {Object} confirmable confirmable instance with `confirmationToken`,
     *                             `confirmationTokenExpiryAt` and `confirmationSentAt`
     *                             updated and persisted if confirmable was not confirmed
     *                             and confirmation token was expired. Otherwise untouched
     *                             confirmable instance.
     */


    /**
     * @function
     * @description confirm account using existing confirmation token
     * @param  {Function} done a callback to handle response
     * @private
     */
    schema.methods.confirm = function(done) {
        //this is of model instance
        var confirmable = this;

        async
            .waterfall([
                    //TODO check presence of confirmation token
                    function(next) {
                        //check if confirmation token expired
                        var isTokenExpiry = !Utils.isAfter(new Date(), confirmable.confirmationTokenExpiryAt);

                        if (isTokenExpiry) {
                            //if token expired
                            next(new Error('Confirmation token expired'));
                        } else {
                            //otherwise continue with token verification
                            next(null, confirmable);
                        }
                    },
                    function(confirmable, next) {
                        //verify confirmation token
                        var value =
                            confirmable.confirmationTokenExpiryAt.getTime().toString();

                        var tokenizer =
                            Utils.tokenizer(value);

                        if (!tokenizer.match(confirmable.confirmationToken, confirmable.email)) {
                            next(new Error('Invalid confirmation token'));
                        } else {
                            //is valid token
                            next(null, confirmable);
                        }
                    },
                    function(confirmable, next) {
                        //update confirmation details
                        confirmable.confirmedAt = new Date();
                        confirmable.save(function(error) {
                            if (error) {
                                next(error);
                            } else {
                                next(null, confirmable);
                            }
                        });
                    }
                ],
                function(error, confirmable) {
                    if (error) {
                        done(error);
                    } else {
                        done(null, confirmable);
                    }
                });
    };
    //documentation for `done` callback of `confirm`
    /**
     * @description a callback to be called once account confirmation is done
     * @callback confirm~callback
     * @param {Object} error any error encountered during the process of confirmation
     * @param {Object} confirmable confirmable instance with `confirmedAt` set-ed
     *                             and persisted
     */


    //--------------------------------------------------------------------------
    //confirmable static methods
    //--------------------------------------------------------------------------

    /**
     * @function
     * @author lykmapipo
     *
     * @description confirm account creation.
     *              This method must be called within model static context
     *
     * @param  {String}   confirmationToken a valid confirmation token send during
     *                                      `sendConfirmationEmail`
     *
     *
     * @param {confirm~callback} done callback that handles the response.
     * @public
     */
    schema.statics.confirm = function(confirmationToken, done) {
        //this refer to model static context
        var Confirmable = this;

        //TODO
        //sanitize confirmationToken

        async
            .waterfall(
                [
                    function(next) {
                        //find confirmable using confirmation token
                        Confirmable
                            .findOne({
                                confirmationToken: confirmationToken
                            })
                            .exec(next);
                    },
                    function(confirmable, next) {
                        //any confirmable found?
                        var confirmableNotExist =
                            (
                                _.isUndefined(confirmable) ||
                                _.isNull(confirmable)
                            );

                        if (confirmableNotExist) {
                            next(new Error('Invalid confirmation token'));
                        } else {
                            next(null, confirmable);
                        }
                    },
                    function(confirmable, next) {
                        confirmable.confirm(next);
                    }
                ],
                function(error, confirmable) {
                    if (error) {
                        done(error);
                    } else {
                        done(null, confirmable);
                    }
                });
    };
    //documentation for `done` callback of `confirm`
    /**
     * @description a callback to be called once confirmation is done
     * @callback confirm~callback
     * @param {Object} error any error encountered during account confirmation
     * @param {Object} confirmable a confirmable instance with `confirmedAt`
     *                             updated and persisted
     */
};