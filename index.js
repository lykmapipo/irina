'use strict';

//dependencies
var path = require('path');
var _ = require('lodash');
var libPath = path.join(__dirname, 'lib');
var morphsPath = path.join(libPath, 'morphs');

//load types

//require morphs
var Authenticable = require(path.join(morphsPath, 'authenticable'));
var Confirmable = require(path.join(morphsPath, 'confirmable'));
var Lockable = require(path.join(morphsPath, 'lockable'));
var Recoverable = require(path.join(morphsPath, 'recoverable'));
var Registerable = require(path.join(morphsPath, 'registerable'));
var Trackable = require(path.join(morphsPath, 'trackable'));

/**
 * @function
 * @description mongoose irina plugin
 * @param  {Schema} schema  valid mongoose schema
 * @param  {Object} options valid mongoose irina plugin options
 * @public
 */
module.exports = exports = function Irina(schema, options) {
    //prepare common options
    options = _.merge({
        confirmable: {
            tokenLifeSpan: 3
        },
        lockable: {
            tokenLifeSpan: 3,
            maximumAllowedFailedAttempts: 3,
            enabled:false
        },
        recoverable: {
            tokenLifeSpan: 3
        },
        registerable: {
            autoConfirm: false
        },
        trackable: {}
    }, options || {});

    //morph schema to be authenticable
    //
    //warn!:this is must morph for others
    //morphs to work
    Authenticable.call(null, schema, options);

    //morph schema to be confirmable
    Confirmable.call(null, schema, options);

    //morph schema to be lockable
    Lockable.call(null, schema, options);

    //morph schema to be recoverable
    Recoverable.call(null, schema, options);

    //morph schema to be registerable
    Registerable.call(null, schema, options);

    //morph schema to be trackable
    Trackable.call(null, schema, options);
};