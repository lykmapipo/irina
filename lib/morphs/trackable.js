'use strict';

//dependencies
// const _ = require('lodash');

/**
 * @name Trackable
 * @constructor
 * @description Track account signin details.
 * @param {Schema} schema  valid mongoose schema
 * @param {Object} options valid trackable plugin options
 * @see  {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Trackable|Trackable}
 * @public
 */
module.exports = exports = function Trackable(schema /*,optns*/ ) {

  //prepare options
  /* const options = _.merge({}, optns);*/

  //add trackable schema fields
  schema.add({
    signInCount: {
      type: Number,
      default: 0,
      index: true,
      hide: true
    },
    currentSignInAt: {
      type: Date,
      default: null,
      index: true,
      hide: true
    },
    currentSignInIpAddress: {
      type: String,
      index: true,
      default: null,
      hide: true
    },
    lastSignInAt: {
      type: Date,
      default: null,
      index: true,
      hide: true
    },
    lastSignInIpAddress: {
      type: String,
      index: true,
      default: null,
      hide: true
    }
  });

  //--------------------------------------------------------------------------
  //trackable instance methods
  //--------------------------------------------------------------------------

  /**
   * @function
   * @description update tracking details of the model instance.
   *              This method must be called within mode instance context.
   *
   * @param  {String}   ipAddress current remote ip address of the signin account
   * @param {track~callback} done callback that handles the response.
   * @private
   */
  schema.methods.track = function (ipAddress, done) {
    //this refer model instance context
    const trackable = this;

    //update signInCount
    trackable.signInCount = trackable.signInCount + 1;

    //update previous sign in details
    trackable.lastSignInAt = trackable.currentSignInAt;
    trackable.lastSignInIpAddress = trackable.currentSignInIpAddress;

    //update current sign in details
    trackable.currentSignInAt = new Date();
    trackable.currentSignInIpAddress = ipAddress;

    //save tracking details
    trackable.save(function (error) {
      if (error) {
        done(error);
      } else {
        done(null, trackable);
      }
    });
  };
  //documentation for `done` callback of `track`
  /**
   * @description a callback to be called once update trackable details is done
   * @callback track~callback
   * @param {Object} error any error encountered during update tracking details
   * @param {Object} trackable trackable instance with `lastSignInAt`, `lastSignInIpAddress`
   *                           `currentSignInAt`, `currentSignInIpAddress`
   *                           updated and persisted
   */
};
