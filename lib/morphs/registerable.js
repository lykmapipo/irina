'use strict';

//dependencies
var async = require('async');

/**
 * @constructor
 *
 * @description Registerable is responsible for everything related to
 *              registering a new account (ie user sign up) and unregistering.
 *
 *              See {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Registerable|Registerable}
 *
 * @public
 */
module.exports = exports = function Registerable(schema, options) {
    //prepare options
    options = options || {};

    //add registerable schema fields
    schema.add({
        //track when registration occur
        registeredAt: {
            type: Date,
            default: null
        },

        //track when un registration occur
        //since we cant predict how to handle account deletion
        unregisteredAt: {
            type: Date,
            default: null
        }
    });

    //--------------------------------------------------------------------------
    //registerable instance methods
    //--------------------------------------------------------------------------

    /**
     * @function
     * @description un register a given registerable instance.
     *              This  function must be called within model instance context
     *
     * @param {unregister~callback} done callback that handles the response.
     * @private
     */
    schema.methods.unregister = function(done) {
        //this refer to model instance context
        var registerable = this;

        async
            .waterfall(
                [
                    function(next) {
                        //set unregisteredAt
                        registerable.unregisteredAt = new Date();

                        //save unregistered details
                        registerable.save(function(error) {
                            if (error) {
                                next(error);
                            } else {
                                next(null, registerable);
                            }
                        });
                    }
                ],
                function(error, registerable) {
                    if (error) {
                        done(error);
                    } else {
                        done(null, registerable);
                    }
                });
    };

    //documentation for `done` callback of `unregister`
    /**
     * @description a callback to be called once unregister authentication is done
     * @callback unregister~callback
     * @param {Object} error any error encountered during unregistering account
     * @param {Object} registerable registerable instance with `unregisteredAt` set-ed
     */

    //--------------------------------------------------------------------------
    //registerable static/class methods
    //--------------------------------------------------------------------------

    /**
     * @function
     * @description register new authentication
     *              This method must be called within model static context
     *
     * @param  {Object}   credentials valid authentication credentials.
     * @param {register~callback} done callback that handles the response.
     * @public
     */
    schema.statics.register = function(credentials, done) {
        //this refer to model static context
        var Registerable = this;

        //TODO sanitize credentials
        async
            .waterfall(
                [
                    //instantiate new registerable
                    function(next) {
                        next(null, new Registerable(credentials));
                    },
                    //hash password
                    function(registerable, next) {
                        registerable.encryptPassword(next);
                    },
                    //TODO
                    //generate confirmation token
                    //if schema is confirmable
                    //generate confirmation token
                    function(registerable, next) {
                        registerable.generateConfirmationToken(next);
                    },

                    //create registerable and save it
                    function(registerable, next) {
                        //set registering time
                        registerable.registeredAt = new Date();

                        //create registerable
                        registerable.save(function(error) {
                            if (error) {
                                next(error);
                            } else {
                                next(null, registerable);
                            }
                        });
                    },
                    //send a confirmation token
                    //if schema is confirmable
                    //send a confirmation token
                    function(registerable, next) {
                        registerable.sendConfirmation(next);
                    }
                ],
                function finalize(error, registerable) {
                    if (error) {
                        done(error);
                    } else {
                        done(null, registerable);
                    }
                });
    };

    //documentation for `done` callback of `register`
    /**
     * @description a callback to be called once register new authentication is done
     * @callback register~callback
     * @param {Object} error any error encountered during register new authentication
     * @param {Object} registerable registerable instance with all attributes
     *                             set-ed and persisted
     */
};