'use strict';

const fs = require('fs');
const YAML = require('yaml');
const chalk = require('chalk');
const ora = require('ora')();

const configAction = require('./config.js');
const DB = require('./../db.class.js');

const run = async function(action, database, db) {
  const [rows] = await db.execute(`SHOW DATABASES LIKE '${database}'`);
  if (action === 'create' && rows.length === 1) {
    process.stdout.write(`${chalk.red('error')} database already exist\n`);
    return;
  }
  if (action === 'drop' && rows.length === 0) {
    process.stdout.write(`${chalk.red('error')} database is not present\n`);
    return;
  }

  await db.execute(`${action} DATABASE ${database};`);
};

const createorDropAction = async function(options, command) {
  if (!configAction.isValidConfigName(options.name)) {
    return;
  }

  const filePath = configAction.getConfigFilePath(options.name);
  const configDataString = fs.readFileSync(filePath, {
    encoding: 'utf8'
  });
  const configData = YAML.parse(configDataString);
  const database = configData.database;
  configData.database = '';

  ora.start();
  const poolId = DB.createPool(configData);
  const db = new DB(poolId);
  await db.getConnection();
  const [, action] = command._name.split(':');
  await run(action, database, db);
  db.releaseConnection();
  await DB.removePools();
  ora.stop();
};

module.exports = {
  createorDropAction
};
