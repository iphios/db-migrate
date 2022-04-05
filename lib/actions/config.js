'use strict';

const os = require('os');
const fs = require('fs');
const YAML = require('yaml');
const path = require('path');
const chalk = require('chalk');
const pkg = require('./../../package.json');
const jsonschema = require('json-schema');

jsonschema.add('config_name', {
  type: 'string',
  pattern: '^[a-z0-9]{1,}$'
});

jsonschema.add('config', {
  type: 'object',
  properties: {
    name: {
      $ref: 'config_name'
    },
    host: {
      type: 'string'
    },
    port: {
      type: 'string',
      pattern: '^[0-9]{1,5}$'
    },
    user: {
      type: 'string'
    },
    password: {
      type: 'string'
    },
    database: {
      type: 'string'
    }
  }
});

const folderPath = path.join(os.homedir(), `.${pkg.name}`, 'config');
const getConfigFilePath = name => path.join(folderPath, `${name}.yml`);

const addAction = function(options) {
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

  const filePath = getConfigFilePath(options.name);
  if (fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} file "${filePath}" already exist\n`);
    return;
  }

  const data = YAML.stringify({
    host: options.host,
    port: parseInt(options.port, 10),
    user: options.user,
    password: options.password,
    database: options.database
  });
  fs.writeFileSync(filePath, data, {
    encoding: 'utf8'
  });
  process.stdout.write(`${chalk.green('success')} file "${filePath}" added\n`);
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
    const [config_name] = each.split('.');
    process.stdout.write(`${chalk.blue('info')} ${index + 1} -> ${config_name}\n`);
  });
};

const removeAction = function(options) {
  const filePath = getConfigFilePath(options.name);
  if (!fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} file "${filePath}" doesn't exist\n`);
    return;
  }
  fs.unlinkSync(filePath);
  process.stdout.write(`${chalk.green('success')} file "${filePath}" removed\n`);
};

module.exports = {
  addAction,
  listAction,
  removeAction
};
