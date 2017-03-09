'use strict';

//dependencies
const path = require('path');
const Utils = require(path.join(__dirname, '..', 'utils'));

/**
 * @constructor
 *
 * @description Handles blocking account access after a certain number of attempts.
 *              It will send instructions to the user when the lock happens,
 *              containing a details to unlock account.
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
            index: true,
            hide: true
        },
        lockedAt: {
            type: Date,
            default: null,
            hide: true
        },
        unlockedAt: {
            type: Date,
            default: null,
            hide: true
        },
        unlockToken: {
            type: String,
            default: null,
            index: true,
            hide: true
        },
        unlockSentAt: {
            type: Date,
            default: null,
            hide: true
        },
        unlockTokenExpiryAt: {
            type: Date,
            default: null,
            hide: true
        }
    });

    //--------------------------------------------------------------------------
    //lockable instance methods
    //--------------------------------------------------------------------------

    /**
     * @function
     *
     * @description generate unlock token to be used to unlock locked account.
     *              This  function must be called within model instance context
     *
     * @param {generateUnlockToken~callback} done callback that handles the response.
     * @return Promise resolve with lockable or reject with error
     * @private
     */
    schema.methods.generateUnlockToken = function (done) {
        //this context is of model instance
        const lockable = this;

        //set unlock expiration date
        console.log(options.lockable.tokenLifeSpan);
        const unlockTokenExpiryAt = Utils.addDays(options.lockable.tokenLifeSpan);


        //generate unlock token based
        //on unlock token expiry at
        const tokenizer =
            Utils.tokenizer(unlockTokenExpiryAt.getTime().toString());

        //set unlockToken
        lockable.unlockToken = tokenizer.encrypt(lockable.email);

        //set unlock token expiry date
        lockable.unlockTokenExpiryAt = unlockTokenExpiryAt;

        //clear previous unlock details if any
        lockable.unlockedAt = null;
        if (done) {
            done(null, lockable);
        }
        return Promise.resolve(lockable);

    };
    //documentation for `done` callback of `generateUnlockToken`
    /**
     * @description a callback to be called once generate unlock token is done
     * @callback generateUnlockToken~callback
     * @param {Object} error any error encountered during generating unlock token
     * @param {Object} lockable lockable instance with `unlockToken`, and 
     *                          `unlockTokenExpiryAt` set-ed
     */


    /**
     * @function
     * 
     * @description send notification to allow account to be unlocked.
     *              This method must be called within model instance context
     *
     * @param {sendUnLock~callback} done callback that handles the response.
     * @return Promise resolve with lockable or reject with error
     * @private
     */
    schema.methods.sendUnLock = function (done) {
        //this refer to model instance context
        const lockable = this;

        const isUnlocked =
            lockable.unlockedAt && lockable.unlockedAt !== null;

        //if already unlocked back-off
        if (isUnlocked) {
            if (done) {
                done(null, lockable);
            }
            return Promise.resolve(lockable);
        }

        //send unlock instructions
        else {
            return new Promise((resolve, reject) => {
                lockable
                    .send(
                    'Account recovery',
                    lockable,
                    function finish() {
                        //update unlock token send time
                        lockable.unlockTokenSentAt = new Date();

                        //save lockable instance
                        lockable
                            .save()
                            .then(() => {
                                if (done) {
                                    done(null, lockable);
                                }
                                resolve(lockable);
                            })
                            .catch(error => {
                                if (error) {
                                    if (done) {
                                        done(error);
                                    }
                                    reject(error);
                                }
                            });
                    });
            });
        }
    };
    //documentation for `done` callback of `sendUnLock`
    /**
     * @description a callback to be called once send unlock instructions is done
     * @callback sendUnLock~callback
     * @param {Object} error any error encountered during sending unlock instructions
     * @param {Object} lockable lockable instance with `unlockSentAt` updated 
     *                          and persisted
     */


    /**
     * @function
     *
     * @description lock the model instance after maximum allowed failed attempts
     *              reached.
     *              This  function must be called within model instamce context
     *
     * @param {lock~callback} done callback that handles the response.
     * @return Promise resolve with lockable or reject with error
     * @private
     */
    schema.methods.lock = function (done) {
        //this refer to model instance context
        const lockable = this;
        if (options.lockable.enabled) {

            lockable.lockedAt = new Date();
            //generate unlock token
            return lockable
                .generateUnlockToken()
                .then(lockable => {
                    return lockable.sendUnLock();
                })
                .then(lockable => {
                    if (done) {
                        done(null, lockable);
                    }
                    return lockable;
                })
                .catch(error => {
                    if (error) {
                        if (done) {
                            done(error);
                        }
                    }
                });
        } else {
            if (done) {
                done(null, lockable);
            }
            return Promise.resolve(lockable);
        }

    };
    //documentation for `done` callback of `lock`
    /**
     * @description a callback to be called once lock account is done
     * @callback lock~callback
     * @param {Object} error any error encountered during lock an account
     * @param {Object} lockable lockable instance with `unlockSentAt` updated 
     *                          and persisted
     */


    /**
     * @function
     * @description reset account failed attempts to zero
     * @param  {Function} done callback that handles the response
     * @return Promise resolve with lockable or reject with error
     * @private
     */
    schema.methods.resetFailedAttempts = function (done) {
        //this context is of model instance 
        const lockable = this;

        //clear previous failed attempts
        lockable.failedAttempts = 0;

        //save lockable instance
        //and return it
        return lockable
            .save()
            .then(() => {
                if (done) {
                    done(null, lockable);
                }
                return lockable;
            })
            .catch(error => {
                if (error) {
                    if (done) {
                        done(error);
                    } else {
                        throw error;
                    }
                }
            });
    };


    /**
     * @function
     *
     * @description Check if account is locked by using the below flow:
     *              1. If not locked continue.
     *              2. If locked and lock token not expired throw
     *                  `Account locked. Check your email for unlock instructions`
     *              3. If locked and lock token expired
     *                 generate unlock token, send it and throw
     *                 `Account locked. Check your email for unlock instructions`
     *
     * @callback isLocked~callback done callback that handle response
     * @return Promise resolve with lockable when account is not locked or reject with error
     * @private
     */
    schema.methods.isLocked = function (done) {
        //this context is of model instance
        const lockable = this;

        //check if already locked
        const isLocked =
            lockable.lockedAt && lockable.lockedAt !== null;

        //check if unlock token expired
        const isUnlockTokenExpired = !Utils.isAfter(new Date(), lockable.unlockTokenExpiryAt);

        //account is not locked
        //back-off
        if (!isLocked) {
            if (done) {
                done(null, lockable);
            }
            return Promise.resolve(lockable);
        }

        //is locked and
        //unlock token is not expired 
        else if (isLocked && !isUnlockTokenExpired) {
            const error = new Error('Account locked. Check unlock instructions sent to you.');
            if (done) {
                done(error);
            } else {
                return Promise.reject(error);
            }
        }

        //is locked and
        //unlock token is expired 
        else {
            //compose lock
            return lockable
                .generateUnlockToken()
                .then(lockable => {
                    return lockable.sendUnLock();
                })
                .then(() => {
                    const error = new Error('Account locked. Check unlock instructions sent to you.');
                    if (done) {
                        done(error);
                    }
                    throw error;
                })
                .catch(error => {
                    if (error) {
                        if (done) {
                            done(error);
                        } else {
                            throw error;
                        }
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
     * @param {Object} lockable lockable instance with `unlockToken`,
     *                          `unlockTokenExpiryAt` and `unlockSentAt`
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
     * @description unlock locked account
     *              This  function must be called within model static context
     *
     * @param {unlock~callback} done callback that handles the response.
     * @private
     */
    schema.statics.unlock = function (unlockToken, done) {
        //this refer to model static context
        const Lockable = this;

        //find lockable using unlock token
        return Lockable
            .findOne({
                unlockToken: unlockToken
            })
            .exec()
            .then(lockable => {
                //any lockable found?
                const lockableNotExist = (lockable === undefined || lockable === null);

                if (lockableNotExist) {
                    const error = new Error('Invalid unlock token');
                    if (done) {
                        done(error);
                    }
                    throw error;
                }
                return lockable;
            })
            .then(lockable => {
                //check if unlock token expired
                const isTokenExpired = !Utils.isAfter(new Date(), lockable.unlockTokenExpiryAt);

                if (isTokenExpired) {
                    //if expired
                    const error = new Error('Unlock token expired');
                    if (done) {
                        done(error);
                    }
                    throw error;
                }
                return lockable;
            })
            .then(lockable => {
                //verify locktoken
                const value = lockable.unlockTokenExpiryAt.getTime().toString();

                const tokenizer = Utils.tokenizer(value);

                if (!tokenizer.match(unlockToken, lockable.email)) {
                    const error = new Error('Invalid unlock token');
                    if (done) {
                        done(error);
                    }
                    throw error;
                }
                return lockable;
            })
            .then(lockable => {
                //update unlock details
                lockable.unlockedAt = new Date();

                //clear failed attempts
                lockable.failedAttempts = 0;

                //clear lockedAt
                lockable.lockedAt = null;

                //save lockable instance
                return lockable.save(() => {
                    if (done) {
                        done(null, lockable);
                    }
                    return lockable;
                });
            })
            .catch(error => {
                if (error) {
                    if (done) {
                        done(error);
                    }
                    throw error;
                }
            });
    };
    //documentation for `done` callback of `unlock`
    /**
     * @description a callback to be called once unlock account is done
     * @callback unlock~callback
     * @param {Object} error any error encountered during unlock an account
     * @param {Object} lockable lockable instance with `unlockedAt` updated 
     *                          and persisted
     */
};