'use strict';

const os = require('os');
// const fs = require('fs');
const moment = require('moment');
// const ora = require('ora')();
/*
 * path.join(os.homedir(), '.db-migrate')
 * console.log(chalk.red('error'), 'db-migrate');
 * console.log(chalk.blue('info'), 'db-migrate');
 * console.log(chalk.yellow('warning'), 'db-migrate');
 * console.log(chalk.green('success'), 'db-migrate');
 */

/*
 * ora.start('Loading unicorns');
 * setTimeout(() => {
 *   ora.stop();
 * }, 2e3);
 */

/*
 * setTimeout(() => {
 *   ora.start('Loading unicorns');
 *   ora.succeed('123');
 *   ora.fail('1243');
 *   ora.stop();
 * }, 2e3);
 */

const getMigrationNumber = function() {
  return moment(new Date()).utc().format('YYYYMMDDHHmmssSSS');
};

const createAction = function(migrationName) {
  console.log(migrationName);
  console.log(__dirname);
};

module.exports = {
  createAction
};
