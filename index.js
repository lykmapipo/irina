'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const libPath = path.join(__dirname, 'lib');
const morphsPath = path.join(libPath, 'morphs');

//load types
require(path.join(libPath, 'types', 'email'));

//require morphs
const Authenticable = require(path.join(morphsPath, 'authenticable'));
const Confirmable = require(path.join(morphsPath, 'confirmable'));
const Lockable = require(path.join(morphsPath, 'lockable'));
const Recoverable = require(path.join(morphsPath, 'recoverable'));
const Registerable = require(path.join(morphsPath, 'registerable'));
const Trackable = require(path.join(morphsPath, 'trackable'));

/**
 * @function
 * @description mongoose irina plugin
 * @param  {Schema} schema  valid mongoose schema
 * @param  {Object} options valid mongoose irina plugin options
 * @public
 */
module.exports = exports = function Irina(schema, optns) {
  //prepare common options
  const options = _.extend({
    authenticationField: 'email',
    confirmable: {
      tokenLifeSpan: 3
    },
    lockable: {
      tokenLifeSpan: 3,
      maximumAllowedFailedAttempts: 3
    },
    recoverable: {
      tokenLifeSpan: 3
    },
    registerable: {
      autoConfirm: false
    },
    trackable: {}
  }, optns || {});

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