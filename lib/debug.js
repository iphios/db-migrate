'use strict';

const debugPkg = require('debug');

const MODULE_NAMES = ['dbmigrate', 'dbmigrate:db'];

const debug = {};
MODULE_NAMES.forEach(module => debug[module] = debugPkg(module));

module.exports = debug;
