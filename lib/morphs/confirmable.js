'use strict';

//dependencies
const path = require('path');
const Utils = require(path.join(__dirname, '..', 'utils'));

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
            index: true,
            hide: true
        },
        confirmationTokenExpiryAt: {
            type: Date,
            default: null,
            hide: true
        },
        confirmedAt: {
            type: Date,
            default: null,
            hide: true
        },
        confirmationSentAt: {
            type: Date,
            default: null,
            hide: true
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
     * @return Promise
     * @private
     */
    schema.methods.generateConfirmationToken = function (done) {
        //this context is of model instance
        const confirmable = this;

        //set confirmation expiration date
        const confirmationTokenExpiryAt =
            Utils.addDays(options.confirmable.tokenLifeSpan);

        //generate confirmation token based
        //on confirmation token expiry at
        const tokenizer =
            Utils.tokenizer(confirmationTokenExpiryAt.getTime().toString());

        //set confirmationToken
        confirmable.confirmationToken = tokenizer.encrypt(confirmable.email);

        //set confirmation token expiry date
        confirmable.confirmationTokenExpiryAt = confirmationTokenExpiryAt;

        //clear previous confirm details if any
        confirmable.confirmedAt = null;

        //return confirmable
        if (done) {
            done(null, confirmable);
        }
        return Promise.resolve(confirmable);
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
     * @return Promise
     * @private
     */
    schema.methods.sendConfirmation = function (done) {
        //this refer to model instance context
        const confirmable = this;

        const isConfirmed =
            (confirmable.confirmedAt && confirmable.confirmedAt !== null);

        //if already confirmed back-off
        if (isConfirmed) {
            if (done) {
                done(null, confirmable);
            }
            return Promise.resolve(confirmable);
        } else {
            //send confirmation instruction
            return new Promise((resolve, reject) => {
                confirmable
                    .send(
                    'Account confirmation',
                    confirmable,
                    function finish() {
                        //update confirmation send time
                        confirmable.confirmationSentAt = new Date();

                        //save confirmable instance
                        confirmable.save(function (error) {
                            if (error) {
                                reject(error);
                                if (done) {
                                    done(error);
                                }
                            } else {
                                resolve(confirmable);
                                if (done) {
                                    done(null, confirmable);
                                }
                            }
                        });
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
     * @return Promise
     * @private
     */
    schema.methods.isConfirmed = function (done) {
        //this context is of model instance
        const confirmable = this;

        //check if already confirmed
        const isConfirmed =
            (confirmable.confirmedAt && confirmable.confirmedAt !== null);

        //check if confirmation token expired
        const isTokenExpired = !Utils.isAfter(new Date(), confirmable.confirmationTokenExpiryAt);

        //account has not been confirmed
        //and token has not yet expire
        if (!isConfirmed && !isTokenExpired) {
            const error = new Error('Account not confirmed');
            if (done) {
                done(error);
            }
            return Promise.reject(error);
        }

        //account has not been confirmed and
        //confirmation token is expired 
        else if (!isConfirmed && isTokenExpired) {
            //compose confirmation
            return confirmable
                .generateConfirmationToken()
                .then(_confirmable_ => {
                    return _confirmable_.sendConfirmation();
                })
                .then(() => {
                    if (done) {
                        done(new Error('Confirmation token expired. Check your email for confirmation instructions.'));
                    }
                    throw new Error('Confirmation token expired. Check your email for confirmation instructions.');
                })
                .catch(error => {
                    if (error) {
                        if (done) {
                            done(error);
                        }
                        throw error;
                    }
                });
        }
        //is confirmed 
        else {
            if (done) {
                done(null, confirmable);
            }
            return Promise.resolve(confirmable);
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
     * @return Promise
     * @private
     */
    schema.methods.confirm = function (done) {
        //this is of model instance
        const confirmable = this;

        //check if confirmation token expired
        const isTokenExpiry = !Utils.isAfter(new Date(), confirmable.confirmationTokenExpiryAt);

        if (isTokenExpiry) {
            //if token expired
            if (done) {
                done(new Error('Confirmation token expired'));
            }
            return Promise.reject(new Error('Confirmation token expired'));
        }

        //verify confirmation token
        const value = confirmable.confirmationTokenExpiryAt.getTime().toString();
        const tokenizer = Utils.tokenizer(value);
        //If invalid token
        if (!tokenizer.match(confirmable.confirmationToken, confirmable.email)) {
            if (done) {
                done(new Error('Invalid confirmation token'));
            }
            return Promise.reject(new Error('Invalid confirmation token'));
        }

        //update confirmation details
        confirmable.confirmedAt = new Date();
        return confirmable
            .save()
            .then(confirmable => {
                if (done) {
                    done(null, confirmable);
                }
                return confirmable;
            })
            .catch(error => {
                if (done) {
                    done(error);
                }
                throw error;
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
     * @return Promise resolve with confirmable or reject with error
     * @public
     */
    schema.statics.confirm = function (confirmationToken, done) {
        //this refer to model static context
        const Confirmable = this;

        //TODO
        //sanitize confirmationToken


        return Confirmable
            .findOne({
                confirmationToken: confirmationToken
            })
            .exec()
            .then(confirmable => {
                //any confirmable found?
                const confirmableNotExist = (confirmable === undefined ||confirmable === null);

                if (confirmableNotExist) {
                    const error = new Error('Invalid confirmation token');
                    if (done) {
                        done(error);
                    }
                    throw error;
                }
                return confirmable;
            })
            .then(confirmable => {
                return confirmable.confirm();
            })
            .then(confirmable => {
                if (done) {
                    done(null, confirmable);
                }
                return confirmable;
            })
            .catch(error => {
                if (done) {
                    done(error);
                }
                throw error;
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