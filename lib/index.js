'use strict';

const emitter = require('./events/emitter');
const isNil = require('ramda/src/isNil');

var gloo = function (hostname, port, ssl) {
    if (
        isNil(hostname) ||
        typeof hostname !== 'string' ||
        hostname === ''
    ) {
        throw new Error("gloo constructor requires hostname to be specified<string>")
    }
    if (
        isNil(port) ||
        typeof port !== 'number'
    ) {
        throw new Error("gloo constructor requires port to be specified<string>")
    }
    return {
        emitter: emitter(hostname, port, ssl)
    }
};

module.exports = gloo;