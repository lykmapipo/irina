'use strict';

//dependencies

/**
 * @constructor
 * 
 * @description Track account signin details.
 *              See {@link http://www.rubydoc.info/github/plataformatec/devise/master/Devise/Models/Trackable|Trackable}
 *
 * @public
 */
module.exports = exports = function Trackable(schema, options) {
    //prepare options
    options = options || {};

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
     * @return Promise resolve with trackable or reject with error
     * @private
     */
    schema.methods.track = function (ipAddress, done) {
        //this refer model instance context
        var trackable = this;

        //update signInCount
        trackable.signInCount = trackable.signInCount + 1;

        //update previous sign in details
        trackable.lastSignInAt = trackable.currentSignInAt;
        trackable.lastSignInIpAddress = trackable.currentSignInIpAddress;

        //update current sign in details
        trackable.currentSignInAt = new Date();
        trackable.currentSignInIpAddress = ipAddress;

        //save tracking details
        return trackable
            .save()
            .then(() => {
                if (done) {
                    done(null, trackable);
                }
                return trackable;
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