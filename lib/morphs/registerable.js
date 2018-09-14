'use strict';

//dependencies
const _ = require('lodash');
const async = require('async');

/**
 * @name Registerable
 * @constructor
 * @description registerable extnding mongoose model with ability for
 *              registering a new account and unregistering existing ones.
 * @param {Schema} schema  valid mongoose schema
 * @param {Object} options valid registerable plugin options
 * @see  {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Registerable|Registerable}
 * @public
 */
module.exports = exports = function Registerable(schema, optns) {

  //prepare options
  const options = _.merge({}, optns);

  //add registerable schema fields
  schema.add({

    //track when registration occur
    registeredAt: {
      type: Date,
      default: null,
      index: true,
      hide: true
    },

    //track when account has been unregistered
    unregisteredAt: {
      type: Date,
      default: null,
      index: true,
      hide: true
    }

  });

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

    async
    .waterfall([
        function (next) {
          //set unregistered date
          registerable.unregisteredAt = new Date();

          //save unregistered details
          registerable.save(function (error) {
            if (error) {
              next(error);
            } else {
              next(null, registerable);
            }
          });
        }
      ],
      function (error, registerable) {
        if (error) {
          done(error);
        } else {
          done(null, registerable);
        }
      });
  };
  //documentation for `done` callback of `unregister`
  /**
   * @description a callback to be called once unregister account is done
   * @callback unregister~callback
   * @param {Object} error any error encountered during unregistering account
   * @param {Object} registerable account instance with `unregisteredAt` set-ed
   */

  //--------------------------------------------------------------------------
  //registerable static/class methods
  //--------------------------------------------------------------------------

  /**
   * @function
   * @description register new account
   *              This method must be called within model static context
   *
   * @param  {Object}   profile valid account credentials and additional details
   *                            as per schema definition.
   * @param {register~callback} done callback that handles the response.
   * @public
   */
  schema.statics.register = function (profile, done) {
    //this refer to model static context
    const Registerable = this;

    //TODO sanitize profile

    async
    .waterfall(
      [
        //instantiate new registerable
        function (next) {
          next(null, new Registerable(profile));
        },
        //validate details
        function (registerable, next) {
          registerable.validate(function (error) {
            if (error) {
              next(error);
            } else {
              next(null, registerable);
            }
          });
        },
        //encrypt password
        function (registerable, next) {
          registerable.encryptPassword(next);
        },
        //generate confirmation token
        //if schema is confirmable
        function (registerable, next) {
          if (registerable.generateConfirmationToken) {
            registerable.generateConfirmationToken(next);
          } else {
            next(null, registerable);
          }
        },
        //update registering details
        //and save account
        function (registerable, next) {
          //set registering time
          registerable.registeredAt = new Date();

          //create registerable
          registerable.save(function (error) {
            if (error) {
              next(error);
            } else {
              next(null, registerable);
            }
          });
        },
        //send a confirmation token
        //if schema is confirmable
        //and auto confirmation is
        //not enable
        function (registerable, next) {
          if (registerable.sendConfirmation &&
            !options.registerable.autoConfirm) {

            registerable.sendConfirmation(next);

          } else {
            next(null, registerable);
          }
        },
        //if auto confirm is enable
        //and schema is confirmable
        //confirm account registration
        function (registerable, next) {
          if (options.registerable.autoConfirm &&
            registerable.confirm) {

            registerable.confirmationSentAt = new Date();
            registerable.confirm(next);

          } else {
            next(null, registerable);
          }
        }
      ],
      function finalize(error, registerable) {
        //check if unique constraint error
        //is due to authentication field
        var regex = new RegExp(options.authenticationField, 'g');

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

          done(error);
        } else {
          done(null, registerable);
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
};
