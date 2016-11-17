'use strict';

//dependencies
var path = require('path');
var async = require('async');
var _ = require('lodash');
var Utils = require(path.join(__dirname, '..', 'utils'));
var validator = require('validator');

/**
 * @constructor
 *
 * @description Holds common settings for authentication.
 *              See {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Authenticatable|Authenticable}
 * 
 * @param {Schema} schema  valid mongoose schema
 * @param {Object} options valid authenticable plugin options
 * @public
 */
module.exports = exports = function Authenticable(schema, options) {
    //prepare options
    options = options || {};

    //prepare password encryption iteration
    options.encryptionIterations = options.encryptionIterations || 10;

    //prepare authentication field
    options.authenticationField = options.authenticationField || 'email';
    options.authenticationFieldType = options.authenticationFieldType || 'String';

    //prepare passoword field
    options.passwordField = options.passwordField || 'password';

    //prepare error messages
    options.errorMessage = options.errorMessage ||
        'Incorrect ' + options.authenticationField + ' or ' + options.passwordField;

    //prepare send methods
    options.send = options.send || schema.methods.send || function (type, authenticable, done) {
        done();
    };

    //prepare schema fields
    var authenticationFields = {};

    //prepare authentication field
    if (options.authenticationField === 'email') {
        authenticationFields[options.authenticationField] = {
            type: String,
            unique: true,
            //lowercase authentication field value before save
            lowercase: true,
            //trim authentication field
            trim: true,
            validate: [validator.isEmail, 'Invalid email address {VALUE}'],
            required: options.authenticationField + ' is required'
        };
    } else {
        if (options.authenticationFieldProperties) {
            authenticationFields[options.authenticationField] = options.authenticationFieldProperties;
        } else {
            authenticationFields[options.authenticationField] = {
                type: String,
                unique: true,
                //lowercase authentication field value before save
                lowercase: true,
                //trim authentication field
                trim: true,
                required: options.authenticationField + ' is required'
            };
        }
    }

    //prepare password field
    authenticationFields[options.passwordField] = {
        type: String,
        required: options.passwordField + ' is required',
        //hide password when toJSON is called on model
        //Warn!: current this depend on mongoose-hidden plugin
        hide: true
    };

    //add authentibale fields into schema
    schema.add(authenticationFields);

    //--------------------------------------------------------------------------
    //authenticable instance methods
    //--------------------------------------------------------------------------


    /**
     * @function
     * @dscription hash account password and set it as current password.
     *             This method must be called within model instance context
     *
     * @param {encryptPassword~callback} done callback that handles the response.
     * @private
     */
    schema.methods.encryptPassword = function (done) {
        //this refer to the model insatnce context
        var authenticable = this;

        Utils
            .hash(
            authenticable.password,
            options.encryptionIterations,
            function (error, hash) {
                if (error) {
                    done(error);
                } else {
                    authenticable.password = hash;
                    done(null, authenticable);
                }
            });
    };
    //documentation for `done` callback of `encryptPassword`
    /**
     * @description a callback to be called when encrypt password is done
     * @callback encryptPassword~callback
     * @param {Object} error any error encountered during encrypting a password
     * @param {Object} authenticable authenticable instance with `password` set-ed 
     *                               to hash
     */


    /**
     * @description implementation of notification send. Default implementation
     *              is `noop`, since send of notification rely on the nature of
     *              application. Schema must implement send and pass it as options
     * @type {Function}
     */
    schema.methods.send = options.send;


    /**
     * @function
     * @dscription compare the given password to the currect encrypted password
     *             This method must be called within model instance context
     *
     * @param {comparePassword~callback} done callback that handles the response.
     * @private
     */
    schema.methods.comparePassword = function (password, done) {
        //this refer to the model instance context
        var authenticable = this;

        Utils
            .compare(password, authenticable.password, function (error, result) {
                if (error) {
                    //if there is any error during comparison
                    done(error);
                } else if (!result) {
                    //if password does not match
                    done(new Error(options.errorMessage));
                } else {
                    //password do match
                    done(null, authenticable);
                }
            });
    };
    //documentation for `done` callback of `comparePassword`
    /**
     * @description a callback to be called when compare password is done
     * @callback comparePassword~callback
     * @param {Object} error any error encountered during comparing passwords
     * @param {Object} authenticable authenticable instance if passwords
     *                               match otherwise corresponding error
     */



    /**
     * @function
     * @description change the existing instance password to the new one
     *              This method must be called within model instance context
     *
     * @param  {String}   newPassword      new instance password to be set-ed
     * @param {changePassword~callback} done callback that handles the response.
     * @private
     */
    schema.methods.changePassword = function (newPassword, done) {
        //this refer to the model instance context
        var authenticable = this;

        async
            .waterfall(
            [
                function (next) {
                    //is new password provided?
                    if (!newPassword) {
                        next(new Error('No ' + options.passwordField + ' provided'));
                    } else {
                        next(null, newPassword);
                    }
                },
                function (newPassword, next) {
                    //set new password
                    authenticable.password = newPassword;

                    //encrypt new password
                    authenticable.encryptPassword(next);
                },
                function (authenticable, next) {
                    //save new password
                    authenticable.save(function (error) {
                        if (error) {
                            next(error);
                        } else {
                            next(null, authenticable);
                        }
                    });
                }
            ],
            function (error, authenticable) {
                //TODO fire events after change password
                if (error) {
                    done(error);
                } else {
                    done(null, authenticable);
                }
            });
    };
    //documentation for `done` callback of `changePassword`
    /**
     * @description a callback to be called when change password is done
     * @callback changePassword~callback
     * @param {Object} error any error encountered during change password
     * @param {Object} authenticable authenticable instance if `password`
     *                               changed successfully
     */


    /**
     * @description authenticate this instance. If authentication failed
     *              update failed attempts and return corresponding error
     *              else reset failed attempts and return authenticable
     * 
     * @callback authenticate~callback
     * @param  {String}   password password of this authenticable
     * @param  {Function} done     a callback to handle response
     * @private
     */
    schema.methods.authenticate = function (password, done) {
        //this context is of model instance
        var auth /*authenticable*/ = this;
        //check if account is locked

        async.waterfall([
            //check account if is locked
            //only if schema is lockable
            function (next) {
                if (auth.isLocked) {
                    auth.isLocked(next);
                } else {
                    next(null, auth);
                }
            },
            //check account if is confirmed
            //only if schema is confirmable
            function (auth, next) {
                if (auth.isConfirmed) {
                    auth.isConfirmed(next);
                } else {
                    next(null, auth);
                }
            },
            function (auth, next) {
                auth
                    .comparePassword(password, function (error, authenticable) {
                        //password does not match
                        if (error) {
                            //restore authenticable to current instance
                            //to prevent undefined when password dont match
                            authenticable = auth;

                            //remember raised password error
                            var passwordError = error;

                            if (options.lockable.enabled) {
                                //update failed attempts
                                authenticable.failedAttempts =
                                    authenticable.failedAttempts + 1;

                                //is failed attempts exceed 
                                //maximum allowed attempts
                                var failedAttemptsExceed =
                                    authenticable.failedAttempts >=
                                    options.lockable.maximumAllowedFailedAttempts;

                                if (failedAttemptsExceed) {
                                    //lock account
                                    //and
                                    //throw account locked error
                                    authenticable
                                        .lock(function (error /*, authenticable*/) {
                                            if (error) {
                                                next(error);
                                            } else {
                                                next(new Error('Account locked. Check unlock instructions sent to you.'));
                                            }
                                        });

                                } else {
                                    //failed attempts are less than 
                                    //maximum allowed failed attempts
                                    //
                                    //save authenticable and
                                    //return password does not match error
                                    authenticable
                                        .save(function (error) {
                                            if (error) {
                                                next(error);
                                            } else {
                                                next(passwordError);
                                            }
                                        });
                                }
                            } else {
                                next(error);
                            }
                        }

                        //password do match
                        else {
                            //clear previous failed attempts
                            //and
                            //save authenticable instance
                            //
                            //See {@link Lockable#resetFailedAttempts}
                            authenticable.resetFailedAttempts(next);
                        }
                    });
            }
        ], done);
    };
    //documentation for `done` callback of `authenticate`
    /**
     * @description a callback to be called when authenticate is done
     * @callback authenticate~callback
     * @param {Object} error any error encountered during authenticate
     * @param {Object} authenticable authenticable instance
     */

    //--------------------------------------------------------------------------
    //authenticable static/model methods
    //--------------------------------------------------------------------------

    /**
     * @function
     * @description authenticate supplied authentication credentials.
     *              This method must be called within model static context
     *
     * @param  {Object}   credentials valid account credentials plus additional
     *                                valid mongoose query criteria
     * @param {authenticate~callback} done callback that handles the response.
     * @public
     */
    schema.statics.authenticate = function (credentials, done) {
        //this refer to the model static
        var Authenticable = this;

        //TODO sanitize input

        async.waterfall([
            //check if credentials provided
            function (next) {

                var isValidCredentials = _.isPlainObject(credentials) &&
                    (
                        _.has(credentials, options.authenticationField) &&
                        _.has(credentials, options.passwordField) &&
                        !_.isEmpty(credentials[options.authenticationField]) &&
                        !_.isEmpty(credentials[options.passwordField])
                    );

                if (isValidCredentials) {
                    next();
                } else {
                    next(new Error(options.errorMessage));
                }
            },

            //find authenticable by authentication field
            function (next) {
                var criteria = {};
                if (options.authenticationField === 'email') {
                    criteria[options.authenticationField] =
                        credentials[options.authenticationField].toLowerCase();
                } else {
                    criteria[options.authenticationField] =
                        credentials[options.authenticationField];
                }

                //ensure authenticable is active
                criteria.unregisteredAt = null;

                //merge with additional criterias
                //to allow custom criteria to be passed
                criteria =
                    _.merge({}, _.omit(credentials, [options.passwordField]), criteria);
                Authenticable
                    .findOne(criteria)
                    .exec(next);
            },

            //check if there is any authenticable found
            function (authenticable, next) {
                var authenticationNotExist = _.isUndefined(authenticable) ||
                    _.isNull(authenticable);

                if (authenticationNotExist) {
                    next(new Error(options.errorMessage));
                } else {
                    next(null, authenticable);
                }
            },


            //authenticate account instance
            function (authenticable, next) {
                authenticable.authenticate(credentials.password, next);
            }
        ],
            function (error, authenticable) {
                //TODO fire events after authenticating
                if (error) {
                    done(error);
                } else {
                    done(null, authenticable);
                }
            });
    };
    //documentation for `done` callback of `authenticate`
    /**
     * @description a callback to be called when authenticate is done
     * @callback authenticate~callback
     * @param {Object} error any error encountered during authenticating credentials
     * @param {Object} authenticable authenticable instance if provided
     *                               credentials pass authenticate flow
     *                               otherwise corresponding error
     */
};
