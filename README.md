# irina

[![Build Status](https://travis-ci.org/lykmapipo/irina.svg?branch=master)](https://travis-ci.org/lykmapipo/irina)

Simple and flexible authentication workflows for [mongoose](https://github.com/Automattic/mongoose) inspired by 
[devise](https://github.com/plataformatec/devise).

## Usage

```javascript
var mongoose = require('mongoose');
var irina = require('irina');

//define User schema
var UserSchema = new Schema({ ... });

//plugin irina to User schema
User.plugin(irina);

//register user schema
mongoose.model('User',UserSchema);

...

//register a new user account
User.register(credentials,done);

//confirm user registration
User.confirm('confirmationToken',done);

//authenticate provided user credentials
User.authenticate(credentials,done);

//unlock locked user account
User.unlock('unlockToken',done);

//request passwword recovering
User.requestRecover(criteria,done)

//recover user password and set new password
User.recover(recoveryToken, newPassword, done);

//see Modules docs for more

...

```

## Modules

### Authenticable
It lays down the infrastructure for authenticating a user. It extend `mongoose model` with the following:

- `email` : An attribute used to store user email address. `irina` 
opt to use email address but it can be overriden by supply a custom attribute to use.

- `password` : An attribute which is used to store user password hash.

- `encryptPassword(callback(error,authenticable))` : An instance method 
which encrypt the current model instance password using [bcryptjs](https://github.com/dcodeIO/bcrypt.js).

Example

```js

....

//encypt instance password
user
    .encryptPassword(function(error, authenticable) {
        if (error) {
            console.log(error);
        } else {
            console.log(authenticable);
        }
    });

...

```

- `comparePassword(password, callback(error,authenticable))` : An instance 
method which takes in a plain string `password` and compare with the instance hashed password to see if they match.

Example

```js

...

//after having model instance
user
    .comparePassword(password,function(error, authenticable) {
        if (error) {
            console.log(error);
        } else {
            console.log(authenticable);
        }
});

...

```

- `authenticate(credentials, callback(error,authenticable))` : A model 
static method which takes in credentials in the format below : 

```js
var faker = require('faker');
var credentials = {
            email: faker.internet.email(),
            password: faker.internet.password()
        };
```

where `email` is valid email and `password` is valid password of already registered user. It will then authenticate the given credentials. If they are valid credential a user with the supplied credentials will be returned otherwise corresponding errors will be returned.

Example

```js
var faker = require('faker');

//you may obtain this credentials from anywhere
//this is just a demostration for how credential must be
var credentials = {
            email: faker.internet.email(),
            password: faker.internet.password()
        };

User
    .authenticate(credentials,function(error, authenticable) {
            if (error) {
                console.log(error);
            } else {
                console.log(authenticable);
            }
    });

...

```

### Confirmable
Provide a means to confirm user account registration. It extend `mongoose model` with the following:

- `confirmationToken` : An attribute which used to store current register user confirmation token.

- `confirmationTokenExpiryAt` : An attribute that keep tracks of when 
the confirmation token will expiry. Beyond that, new confirmation token will be generated and notification will be send.

- `confirmedAt` : An attribute that keep tracks of when user account is confirmed.

- `confirmationSentAt` : An attribute that keep tracks of when confirmation request is sent.

- `generateConfirmationToken(callback(error,confirmable))` : This instance method will generate `confirmationToken` and `confirmationTokenExpiryAt` time. It also update and persist an instance before return it.

Example
```js

...

user
    .generateConfirmationToken(function(error, confirmable) {
        if (error) {
            console.log(error);
        } else {
           console.log(confirmable);
        }
    });

...

```

- `sendConfirmation(callback(error,confirmable))` : This instance method which utilizes [model.send()](https://github.com/lykmapipo/irina#sending-notifications) and send the confirmation notification. On successfully send, it will update `confirmationSentAt` instance attribute with the current time stamp and persist the instance before return it.

Example
```js
 
 ...

user
    .sendConfirmation(function(error, confirmable) {
        if (error) {
            consle.log(error);
        } else {
           consle.log(confirmable);
        }
});

...

```

- `confirm(confirmationToken, callback(error,confirmable))` : This 
static/class method taken the given `confirmationToken` and confirm un-confirmed registration which match the given confirmation token. It 
will update `confirmedAt` instance attribute and persist the instance 
before return it.

Example
```js
 
 ...

User
    .confirm('confirmationToken',function(error, confirmable) {
            if (error) {
                console.log(error);
            } else {
                console.log(confirmable);
            }
        });

...

```

### Lockable
Provide a means of locking an account after a specified number of failed sign-in attempts `(defaults to 3 attempts)`. user can unlock account through unlock instructions sent. It extend the model with the following:

- `failedAttempt` : An attribute which keeps track of failed login attempts.

- `lockedAt` : An attribute which keeps track of when account is locked.

- `unlockedAt` : An attribute which keeps track of when and account is unlocked.

- `unlockToken` : An attribute which store the current unlock token of the locked account.

- `unlockTokenSentAt` : An attribute which keeps track of when the unlock token notification sent.

- `unlockTokenExpiryAt` : An attribute which keep track of `unlockToken` expiration. If `unlockToken` is expired new token will get generated and set.

- `generateUnlockToken(callback(error,lockable))` : An instance method that generate `unlockToken` and `unlockTokenExpiryAt`. Instance will get persisted before returned otherwise corresponding errors will get returned.

Example
```js

...

user
    .generateUnlockToken(function(error, lockable) {
        if (error) {
            console.log(error)
        } else {
           console.log(lockable)
        }
});

...

```
 
- `sendLock(callback(error,lockable))` : An instance method which send account locked notification to the owner. It will set `unlockTokenSentAt` to track when the lock notification is sent. Instance will get update before returned otherwise corresponding errors will get returned.

Example
```js

...

user
    .sendLock(function(error, lockable) {
        if (error) {
            console.log(error);
        } else {
            console.log(lockable);
        }
    });

...

```

- `lock(callback(error,lockable))` : An instance method that used to lock an account. When invoked, it will check if the number of `failedAttempts` is greater that the configured `maximum allowed login attempts`, if so the account will get locked by setting `lockedAt` to the current timestamp of `lock` invocation. Instance will get persisted before returned otherwise corresponding errors will get returned.

Example
```js

...

user
    .lock(function(error, lockable) {
        if (error) {
            console.log(error);
        } else {
            console.log(lockable);
        }
    });

...

```

- `unlock(unlockToken, callback(error,lockable))` : A model static method which unlock a locked account with the provided `unlockToken`. If the token expired the new `unlockToken` will get generated. If token is valid, locked account will get unlocked and `unlockedAt` attribute will be set to current timestamp and `failedAttempts` will get set to 0. Instance unlocked will get persisted before returned otherwise corrensponding errors will get returned.

Example
```js

...

User
    .unlock(unlockToken, function(error, lockable) {
            if (error) {
                console.log(error);
            } else {
                  console.log(lockable);
            }
    });

...

```

### Recoverable
Lays out infrastructure of resets the user password and sends reset instructions. It extend model with the following:

- `recoveryToken` : An attribute that store recovery token

- `recoveryTokenExpiryAt` : An attribute that track when the recoverable token is expiring.

- `recoverySentAt` : An attribute that keep track as of when the recovery notification is sent.

- `recoveredAt` : An attribute which keeps track of when the password was recovered.

- `generateRecoveryToken(callback(error,recoverable))` : An instance method which used to generate `recoveryToken` and set `recoveryTokenExpiryAt` timestamp. Instance will get persisted before returned othewise corresponding errors will get returned.

Example
```js
...

user
    .generateRecoveryToken(function(error, recoverable) {
        if (error) {
            console.log(error)
        } else {
            console.log(recoverable);
        }
    });

...

```

- `sendRecovery(callback(error,recoverable))` : An instance method which is used to send recovery notification to the user. It will set `recoveryTokenSentAt` timestamp. Instance will get persisted before returned othewise corresponding errors will get returned.

Example
```js
...

user
    .sendRecovery(function(error, recoverable) {
        if (error) {
            console.log(error);
        } else {
            console.log(recoverable);
        }
    });

...

```

- `recover(recoveryToken, newPassword, callback(error,recoverable))` : A model static method which is used to recover an account with the matched `recoverToken`. The `newPassword` provided will get encrypted before set as user password. It will set `recoveredAt` before persist the model. 

Example
```js

...

User
    .recover(
        recoveryToken,
        faker.internet.password(),
        function(error, recoverable) {
            if (error) {
                console.log(error);
            } else {
                console.log(recoverable);
            }
        });

...

```

### Registerable
Handles signing up users through a registration process, also allowing them to edit and destroy their account. It extend model with the following:

- `registeredAt` : An attribute which keeps track of whn an account is registered.

- `unregisteredAt` : An attribute which keep tracks of when an account is unregistered.

- `register(credentials, callback(error,registerable))` : A model static method which is used to register provided credentials. It takes care of checking if email is taken and validating credentials. It will return registered user otherwise corresponding registration errors.

Example
```js
var faker = require('faker');
var credentials = {
            email: faker.internet.email(),
            password: faker.internet.password()
        }

User
    .register(credentials, function(error, registerable) {
        if (error) {
            console.log(error);
        } else {
            console.log(registerable);
        }
    });

...

```

- `unregister(callback(error,registerable))` : An instance method which allow to unregister(destroy a user). The currently implementation is to set 
`unregiesteredAt` to current timestamp of the invocation. Instance will get persisted before returned otherwise corresponding errors will be returned.

Example:
```js

...

user
    .unregister(function(error, registerable) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(registerable);
                    }
                });

...

```

### Trackable
Provide a means of tracking user signin activities. It extend provided 
model with the followings:

- `signInCount` : Keeps track of number of count a user have been sign 
in into you API

- `currentSignInAt` : Keeps track of the latest time when user signed 
in into you API

- `currentSignInIpAddress` : Keeps track of the latest IP address a 
user used to log with into your API

- `lastSignInAt` : Keeps track of the previous sign in time prior to 
the current sign in.

- `lastSignInIpAddress` : Keeps track of the previous IP address 
user used to log with into your API

- `track(ipAddress,callback(error,trackable))` : This is model instance method, which when called with the IP address, it will update current tracking details and set the provided IP address as the `currentSignInIpAddress`. On successfully tracking, a provided `callback` will be get invoked and provided with error if occur and the current updated model instance.

Example
```js

...

User
    .findOne({email:'validEmail'})
    .exec(function(error,user){
        if(error){
            console.log(error);
        }
        else{
            user
                .track('validIpAddress',function(error,trackable){
                    if(error){
                        console.log(error);
                    }
                    else{
                        console.log(trackable);
                    }
                });
        }
    });

...

``` 

## Sending Notifications
The default implementation of `irina` to send notifications is `noop`. This is because there are different use case(s) when it come on sending notifications.

Due to that reason, `irina` requires your model to implement `send` method which accept `type, authentication, done` as it argurments.

- `type` : Refer to the type of notifcation to be sent. There are just three types which are `Account confirmation`, `Account recovery` and `Password recover` which are sent when new account is registered, an account is locked and need to be unlocked and when account is requesting to recover the password repsectively.

- `authenticable` : Refer to the current user model instance.

- `done` : Is the callback that you must call after finish sending the notification. By default this callback will update notification send details based on the usage.

### How to implement a send
Simple add `send` into your model as `instance methods`.

```js
var UserSchema = new Schema({
    ...
});

//the add send
UserSchema.methods.send = function(type, authenticable, done) {
        //your notification sending implementation
        //i.e email, sms, etc
        console
            .log(
                'Notification type: %s.\nAuthenticable: %s \n',
                type,
                JSON.stringify(authenticable)
            );
        done();
    };

...

```
Thats all needed and `irina` will be able to utilize your `send` implementation.

### Sending Issues
It is recommended to use job queue like [kue](https://github.com/learnboost/kue) when implementing your `send` to reduce your API response time.


## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```
* Then run test
```sh
$ npm test
```

## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.


## TODO
- [ ] Lowercase authentication field if it is email


## Licence
The MIT License (MIT)

Copyright (c) 2015 lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 