'use strict';

const os = require('os');
const fs = require('fs');
const YAML = require('yaml');
const path = require('path');
const chalk = require('chalk');
const jsonschema = require('json-schema');

const pkg = require('./../../package.json');

const CONFIG_FOLDER_NAME = 'config';

const defaultConfigFolderPath = path.join(os.homedir(), `.${pkg.name}`, CONFIG_FOLDER_NAME);

const createDefaultConfigFolder = function() {
  if (!fs.existsSync(defaultConfigFolderPath)) {
    fs.mkdirSync(defaultConfigFolderPath, {
      recursive: true
    });
    process.stdout.write(`${chalk.blue('info')} folder "${defaultConfigFolderPath}" created recursively\n`);
  }
};

const getConfigFilePath = function(configName) {
  const fileName = `${configName}.yml`;
  const filePath = path.join(defaultConfigFolderPath, fileName);
  return filePath;
};

const isValidConfigName = function(configName) {
  const filePath = getConfigFilePath(configName);
  const isExist = fs.existsSync(filePath);
  if (!isExist) {
    process.stdout.write(`${chalk.red('error')} Invalid configuration name "${configName}"\n`);
  }
  return isExist;
};

const addAction = function(options) {
  if (Object.hasOwn(options, 'port')) {
    options.port = Number(options.port);
  }
  if (Object.hasOwn(options, 'connectionLimit')) {
    options.connectionLimit = Number(options.connectionLimit);
  }

  try {
    jsonschema.validate('config', options);
  } catch (err) {
    process.stdout.write(`${chalk.red('error')} ${err.message}\n`);
    return;
  }

  const filePath = getConfigFilePath(options.name);
  if (fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} "${options.name}" configuration already exist\n`);
    return;
  }

  const data = YAML.stringify({
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: options.database,
    connectionLimit: options.connectionLimit
  });

  createDefaultConfigFolder();
  fs.writeFileSync(filePath, data, {
    encoding: 'utf8'
  });
  process.stdout.write(`${chalk.green('success')} "${options.name}" configuration successfully created\n`);
};

const listAction = function() {
  createDefaultConfigFolder();
  const filenames = fs.readdirSync(defaultConfigFolderPath, {
    encoding: 'utf8'
  });
  if (!filenames.length) {
    process.stdout.write(`${chalk.blue('info')} configuration list is empty\n`);
    return;
  }
  filenames.forEach((each, index) => {
    const configName = each.slice(0, -4);
    process.stdout.write(`${chalk.blue('info')} ${index + 1} -> ${configName}\n`);
  });
};

const removeAction = function(options) {
  try {
    jsonschema.validate('config_name', options.name);
  } catch (err) {
    process.stdout.write(`${chalk.red('error')} ${err.message}\n`);
    return;
  }

  if (!isValidConfigName(options.name)) {
    return;
  }

  const filePath = getConfigFilePath(options.name);
  fs.unlinkSync(filePath);
  process.stdout.write(`${chalk.green('success')} "${options.name}" configuration successfully removed\n`);
};

module.exports = {
  getConfigFilePath,
  isValidConfigName,
  addAction,
  listAction,
  removeAction
};
