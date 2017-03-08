'use strict';
/**
 * @constructor
 *
 * @description registerable extnding mongoose model with ability for
 *              registering a new account and unregistering existing ones.
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
            default: null,
            hide: true
        },

        //track when account has been unregistered
        unregisteredAt: {
            type: Date,
            default: null,
            hide: true
        }
    });

    /**
     * @function
     * @description register new account
     *              This method must be called within model static context
     *
     * @param  {Object}   profile valid account credentials and additional details 
     *                            as per schema definition.
     * @param {register~callback} done callback that handles the response.
     * @return Promise 
     * @public
     */
    schema.statics.register = function (profile, done) {
        //this refer to model static context
        const Registerable = this;
        // Initialize registerable document
        const _registerable_ = new Registerable(profile);

        return _registerable_
            .validate()
            .then(() => {
                //encrypt password
                return _registerable_.encryptPassword();
            })
            .then(registerable => {
                //generate confirmation token if schema is confirmable
                if (registerable.generateConfirmationToken) {
                    return registerable.generateConfirmationToken();
                }
                return registerable;
            })
            .then(registerable => {
                //set registering time
                registerable.registeredAt = new Date();
                //create registerable
                return registerable.save();
            })
            .then(registerable => {
                //send a confirmation token
                //if schema is confirmable
                //and auto confirmation is
                //not enable
                if (registerable.sendConfirmation &&
                    !options.registerable.autoConfirm) {

                    return registerable.sendConfirmation();

                }
                return registerable;
            })
            .then(registerable => {
                //if auto confirm is enable
                //and schema is confirmable
                //confirm account registration
                if (options.registerable.autoConfirm &&
                    registerable.confirm) {

                    registerable.confirmationSentAt = new Date();

                    return registerable
                        .confirm()
                        .then(confirmable => {
                            if (done) {
                                done(null, confirmable);
                            }
                            return confirmable;
                        });
                }
                if (done) {
                    done(null, registerable);
                }
                return registerable;
            })
            .catch(error => {
                //check if unique constraint error 
                //is due to authentication field
                const regex = new RegExp(options.authenticationField, 'g');

                //TODO fire events after register new account
                if (error) {
                    //handle MongoError: E11000 duplicate key error index
                    //on authentication field and ignore others
                    if (error.code === 11000 && regex.test(error.message)) {

                        const errorMessage =
                            'Account with ' + options.authenticationField +
                            ' ' + profile[options.authenticationField] +
                            ' already exist';

                        error = new Error(errorMessage);
                    }
                    //Call callback if provided
                    if (done) {
                        done(error);
                    }
                    //Pass control to catch block 
                    throw error;
                }
            });
    };
    //documentation for `done` callback of `register`
    /**
     * @description a callback to be called once register new account is done
     * @callback register~callback
     * @param {Object} error any error encountered during register new account
     * @param {Object} registerable registerable instance with all attributes
     *                             set-ed and persisted
     */

    //--------------------------------------------------------------------------
    //registerable instance methods
    //--------------------------------------------------------------------------

    /**
     * @function
     * @description un register a given account.
     *              This function must be called within model instance context
     *
     * @param {unregister~callback} done callback that handles the response.
     * @private
     */
    schema.methods.unregister = function (done) {
        //this refer to model instance context
        const registerable = this;

        //TODO fire events
        //before unregister
        //and
        //after unregister

        //set unregistered date
        registerable.unregisteredAt = new Date();

        //save unregistered details
        return registerable
            .save()
            .then(registerable => {
                if (done) {
                    done(null, registerable);
                }
                return registerable;
            })
            .catch(error => {
                if (done) {
                    done(error);
                }
                //Maintain catch block in the chain
                throw error;
            });
    };
    //documentation for `done` callback of `unregister`
    /**
     * @description a callback to be called once unregister account is done
     * @callback unregister~callback
     * @param {Object} error any error encountered during unregistering account
     * @param {Object} registerable account instance with `unregisteredAt` set-ed
     */


};