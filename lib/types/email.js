'use strict';

//dependencies
var mongoose = require('mongoose');
var Types = mongoose.Types;
var Schema = mongoose.Schema;

/**
 * @constructor
 * @description mongoose email schema type
 */
function Email(path, options) {
    mongoose.SchemaTypes.String.call(this, path, options);

    function validateEmail(val) {
        // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(val);
    }

    this.validate(validateEmail, 'Invalid email address');
}

Email.prototype.__proto__ = mongoose.SchemaTypes.String.prototype;

Email.prototype.cast = function(val) {
    return val ? val.toLowerCase() : val;
};

/**
 * @description exports mongoose email type
 * @type {Email}
 */
Schema.Types.Email = Email;
Types.Email = String;
module.exports = Email;