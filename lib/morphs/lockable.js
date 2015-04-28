'use strict';

//dependencies
var async = require('async');
var _ = require('lodash');
var path = require('path');
var Utils = require(path.join(__dirname, '..', 'utils'));

/**
 * @constructor
 *
 * @description Handles blocking authentication access after a certain number of attempts.
 *              It will send an email to the user when the lock happens,
 *              containing a link to unlock its account.
 *
 *              See {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Lockable|Lockable}
 *
 * @public
 */

module.exports = exports = function Lockable(schema, options) {
    //prepare options
    options = options || {};

    //add lockable schema fields
    schema.add({
        failedAttempts: {
            type: Number,
            default: 0,
            index: true
        },
        lockedAt: {
            type: Date,
            default: null
        },
        unlockedAt: {
            type: Date,
            default: null
        },
        unlockToken: {
            type: String,
            default: null,
            index: true
        },
        unlockSentAt: {
            type: Date,
            default: null
        },
        unlockTokenExpiryAt: {
            type: Date,
            default: null
        }
    });

    //--------------------------------------------------------------------------
    //lockable instance methods
    //--------------------------------------------------------------------------

    /**
     * @function
     *
     * @description generate unlock token to be used to unlock authentication locked.
     *              This  function must be called within model instance context
     *
     * @param {generateUnlockToken~callback} done callback that handles the response.
     * @private
     */
    schema.methods.generateUnlockToken = function(done) {
        //this context is of model instance
        var lockable = this;

        //set unlock expiration date
        var unlockTokenExpiryAt = Utils.addDays(options.lockable.tokenLifeSpan);

        //generate unlock token based
        //on unlock token expiry at
        var tokenizer =
            Utils.tokenizer(unlockTokenExpiryAt.getTime().toString());

        //set unlockToken
        lockable.unlockToken = tokenizer.encrypt(lockable.email);

        //set unlock token expiry date
        lockable.unlockTokenExpiryAt = unlockTokenExpiryAt;

        //clear previous unlock details if any
        lockable.unlockedAt = null;

        done(null, lockable);

    };

    //documentation for `done` callback of `generateUnlockToken`
    /**
     * @description a callback to be called once generate unlock token is done
     * @callback generateUnlockToken~callback
     * @param {Object} error any error encountered during generating unlock token
     * @param {Object} lockable lockable instance with `unlockToken`,
     *                             and `unlockTokenExpiryAt` set-ed
     */

    /**
     * @function
     * 
     * @description send notification to allow account to be unlocked.
     *              This method must be called within model instance context
     *
     * @param {sendUnLock~callback} done callback that handles the response.
     * @private
     */
    schema.methods.sendUnLock = function(done) {
        //this refer to model instance context
        var lockable = this;

        //if already unlocked back-off
        var isUnlocked =
            lockable.unlockedAt && lockable.unlockedAt !== null;

        if (isUnlocked) {
            done(null, lockable);
        } else {
            //send unlock email
            lockable
                .send(
                    'Account recovery',
                    lockable,
                    function finish() {
                        //update unlock token send time
                        lockable.unlockTokenSentAt = new Date();
                        lockable.save(function(error) {
                            if (error) {
                                done(error);
                            } else {
                                done(null, lockable);
                            }
                        });
                    });
        }
    };

    //documentation for `done` callback of `sendUnLock`
    /**
     * @description a callback to be called once send unlock notification is done
     * @callback sendUnLock~callback
     * @param {Object} error any error encountered during sending unlock notification
     * @param {Object} lockable lockable instance with `unlockSentAt`
     *                             updated and persisted
     */

    /**
     * @function
     *
     * @description lock the model instance after maximum allowed failed attempts
     *              This  function must be called within model instamce context
     *
     * @param {lock~callback} done callback that handles the response.
     * @private
     */
    schema.methods.lock = function(done) {
        //this refer to model instance context
        var lockable = this;

        async
            .waterfall(
                [
                    function(next) {
                        //set locked date
                        lockable.lockedAt = new Date();

                        next(null, lockable);
                    },
                    function(lockable, next) {
                        //generate unlock token
                        lockable
                            .generateUnlockToken(next);
                    },
                    function(lockable, next) {
                        //send unlock notification
                        lockable
                            .sendUnLock(next);
                    }
                ],
                function(error, lockable) {
                    if (error) {
                        done(error);
                    } else {
                        done(null, lockable);
                    }
                });
    };

    //documentation for `done` callback of `lock`
    /**
     * @description a callback to be called once lock authentication is done
     * @callback lock~callback
     * @param {Object} error any error encountered during lock an authentication
     * @param {Object} lockable lockable instance with `unlockSentAt`
     *                             updated and persisted
     */


    /**
     * @function
     * @description reset failed attempts to zero
     * @param  {Function} done callback that handles the response
     * @private
     */
    schema.methods.resetFailedAttempts = function(done) {
        //this context is of model instance 
        var lockable = this;

        //clear previous failed attempts
        lockable.failedAttempts = 0;

        //save lockable instance
        //and return it
        lockable.save(function(error) {
            if (error) {
                done(error);
            } else {
                done(null, lockable);
            }
        });
    };

    /**
     * @function
     *
     * @description Check if lockable is locked by using the below flow:
     *              1. If not locked continue.
     *              2. If locked and lock token not expired throw
     *                  `Account locked. Check your email to unlock`
     *              3. If locked and lock token expired
     *                 `composeLock` and throw
     *                 `Account locked. Check your email for unlock instructions`
     *
     * @callback isLocked~callback done callback that handle response
     * @private
     */
    schema.methods.isLocked = function(done) {
        //this context is of model instance
        var lockable = this;

        //check if already locked
        var isLocked =
            lockable.lockedAt && lockable.lockedAt !== null;

        //check if unlock token expired
        var isUnlockTokenExpired = !Utils.isAfter(new Date(), lockable.unlockTokenExpiryAt);

        //is not locked
        if (!isLocked) {
            done(null, lockable);
        }

        //is locked and
        //unlock token is not expired 
        else if (isLocked && !isUnlockTokenExpired) {
            done(new Error('Account locked. Check your email for unlock instructions'));
        }

        //is locked and
        //unlock token is expired 
        else {
            //compose lock
            async.waterfall([
                function generateUnlockToken(next) {
                    lockable.generateUnlockToken(next);
                },
                function sendUnLock(lockable, next) {
                    lockable.sendUnLock(next);
                }
            ], function(error /*, lockable*/ ) {
                //is there any error during
                //compose new lock?
                if (error) {
                    done(error);
                }
                //new unlock token generated
                // and send successfully
                else {
                    done(new Error('Account locked. Check your email for unlock instructions'));
                }
            });
        }
    };
    //documentation for `done` callback of `isLocked`
    /**
     * @description a callback to be called once check lock is done
     * @callback isLocked~callback
     * @param {Object} error any error encountered during the process of checking
     *                       lock
     * @param {Object} lockable lockable instance with `lockToken`,
     *                          `lockTokenExpiryAt` and `lockSentAt`
     *                          updated and persisted if lockable was not locked
     *                          and lock token was expired. Otherwise untouched
     *                          lockable instance.
     */



    //--------------------------------------------------------------------------
    //lockable static methods
    //--------------------------------------------------------------------------

    /**
     * @function
     *
     * @description unlock locked authentication
     *              This  function must be called within model static context
     *
     * @param {unlock~callback} done callback that handles the response.
     * @private
     */
    schema.statics.unlock = function(unlockToken, done) {
        //this refer to model static context
        var Lockable = this;

        async
            .waterfall(
                [
                    function(next) {
                        //find lockable using unlock token
                        Lockable
                            .findOne({
                                unlockToken: unlockToken
                            })
                            .exec(next);
                    },
                    function(lockable, next) {
                        //any lockable found?
                        var lockableNotExist =
                            (
                                _.isUndefined(lockable) ||
                                _.isNull(lockable)
                            );

                        if (lockableNotExist) {
                            next(new Error('Invalid unlock token'));
                        } else {
                            next(null, lockable);
                        }
                    },
                    function(lockable, next) {
                        //check if unlock token expired
                        var isTokenExpired = !Utils.isAfter(new Date(), lockable.unlockTokenExpiryAt);

                        if (isTokenExpired) {
                            //if expired
                            next(new Error('Unlock token expired'));
                        } else {
                            //otherwise continue with token verification
                            next(null, lockable);
                        }
                    },
                    function(lockable, next) {
                        //verify locktoken
                        var value =
                            lockable.unlockTokenExpiryAt.getTime().toString();

                        var tokenizer =
                            Utils.tokenizer(value);

                        if (!tokenizer.match(unlockToken, lockable.email)) {
                            next(new Error('Invalid unlock token'));
                        } else {
                            //is valid token
                            next(null, lockable);
                        }
                    },
                    function(lockable, next) {
                        //update unlock details
                        lockable.unlockedAt = new Date();

                        //clear failed attempts
                        lockable.failedAttempts = 0;

                        //clear lockedAt
                        lockable.lockedAt = null;

                        lockable.save(function(error) {
                            if (error) {
                                next(error);
                            } else {
                                next(null, lockable);
                            }
                        });
                    }
                ],
                function(error, lockable) {
                    if (error) {
                        done(error);
                    } else {
                        done(null, lockable);
                    }
                });
    };

    //documentation for `done` callback of `unlock`
    /**
     * @description a callback to be called once unlock authentication is done
     * @callback unlock~callback
     * @param {Object} error any error encountered during luock an authentication
     * @param {Object} lockable lockable instance with `unlockedAt`
     *                             updated and persisted
     */

};