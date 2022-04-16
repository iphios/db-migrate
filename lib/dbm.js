'use strict';

const {
  program: commander
} = require('commander');
const pkg = require('./../package.json');
require('./schema.js');
const configAction = require('./actions/config.js');
const migrationAction = require('./actions/migration.js');
const dbAction = require('./actions/db.js');

commander
  .name(pkg.name)
  .usage('[options] [command]')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'print the version string')
  .helpOption('-e, --help', 'shows a list of commands or help for one command')
  .addHelpCommand('help [command]', 'display help for one command')
  .action(function() {
    this.help();
  });

// config
commander
  .command('config:add')
  .description('add a new configuration to the file')
  .requiredOption('-n, --name <type>', 'Configuration name')
  .requiredOption('-h, --host <type>', 'Hostname or the IP address')
  .requiredOption('-P, --port <type>', 'The port number to use')
  .requiredOption('-u, --user <type>', 'User name')
  .requiredOption('-p, --password <type>', 'Password')
  .requiredOption('-D, --database <type>', 'Database name')
  .requiredOption('-l, --connectionLimit <type>', 'The maximum number of connections')
  .action(configAction.addAction);
commander
  .command('config:list')
  .description('list existing configuration')
  .action(configAction.listAction);
commander
  .command('config:remove')
  .requiredOption('-n, --name <type>', 'Configuration name')
  .description('remove existing configuration')
  .action(configAction.removeAction);

// db
commander
  .command('db:create')
  .description('create database')
  .requiredOption('-n, --name <type>', 'Configuration name')
  .action(dbAction.createorDropAction);
commander
  .command('db:drop')
  .description('drop database')
  .requiredOption('-n, --name <type>', 'Configuration name')
  .action(dbAction.createorDropAction);

// migration
commander
  .command('migration:create')
  .description('create migration file')
  .argument('<migration name>', 'The name for the new migration')
  .action(migrationAction.createAction);
commander
  .command('migration:up')
  .description('all missing migrations will run or single migration passed with option will run')
  .requiredOption('-n, --name <type>', 'Configuration name')
  .option('-i, --id <type>', 'migration id')
  .action(migrationAction.upAction);
commander
  .command('migration:down')
  .description('only one migration which is latest will run or single migration passed with option will run')
  .requiredOption('-n, --name <type>', 'Configuration name')
  .option('-i, --id <type>', 'migration id')
  .action(migrationAction.downAction);

commander.parse(process.argv);
