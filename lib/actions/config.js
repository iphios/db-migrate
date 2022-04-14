'use strict';

const os = require('os');
const fs = require('fs');
const YAML = require('yaml');
const path = require('path');
const chalk = require('chalk');
const pkg = require('./../../package.json');
const jsonschema = require('json-schema');

const folderPath = path.join(os.homedir(), `.${pkg.name}`, 'config');

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

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {
      recursive: true
    });
    process.stdout.write(`${chalk.blue('info')} folder "${folderPath}" created recursively\n`);
  }

  const fileName = `${options.name}.yml`;
  const filePath = path.join(folderPath, fileName);
  if (fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} file "${filePath}" already exist\n`);
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
  fs.writeFileSync(filePath, data, {
    encoding: 'utf8'
  });
  process.stdout.write(`${chalk.green('success')} Successfully created "${fileName}" file in ${folderPath} folder\n`);
};

const listAction = function() {
  const filenames = fs.readdirSync(folderPath, {
    encoding: 'utf8'
  });
  if (!filenames.length) {
    process.stdout.write(`${chalk.blue('info')} config list is empty\n`);
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

  const fileName = `${options.name}.yml`;
  const filePath = path.join(folderPath, fileName);
  if (!fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} file "${filePath}" doesn't exist\n`);
    return;
  }
  fs.unlinkSync(filePath);
  process.stdout.write(`${chalk.green('success')} Successfully removed "${fileName}" file in ${folderPath} folder\n`);
};

module.exports = {
  addAction,
  listAction,
  removeAction
};
