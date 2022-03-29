#!/usr/bin/env node

'use strict';

const {
  program: commander
} = require('commander');
const pkg = require('./package.json');
// const ora = require('ora')();
const configAction = require('./actions/config.js');

commander
  .name(pkg.name)
  .usage('[options] [command]')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'print the version string')
  .helpOption('-h, --help', 'shows a list of commands or help for one command')
  .addHelpCommand('help [command]', 'display help for one command')
  .action(function() {
    this.help();
  });

const configCommand = commander
  .command('config')
  .description('save configuration to a file')
  .action(function() {
    this.help();
  });

configCommand
  .command('add')
  .description('add new config')
  .action(configAction.addAction);
configCommand
  .command('remove')
  .description('remove config')
  .action(configAction.removeAction);

commander.parse(process.argv);
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
