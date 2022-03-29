'use strict';

const os = require('os');
const fs = require('fs');
const YAML = require('yaml');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const pkg = require('./../package.json');
const jsonschema = require('json-schema');

const folderPath = path.join(os.homedir(), `.${pkg.name}`, 'config');
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, {
    recursive: true
  });
  process.stdout.write(`${chalk.blue('info')} folder "${folderPath}" created\n`);
}

jsonschema.add('config_name', {
  type: 'string',
  pattern: /^[a-z]{1,}$/
});

jsonschema.add('string', {
  type: 'string'
});

jsonschema.add('integer', {
  type: 'integer'
});

const defaultValidateFun = function(validationName) {
  return function(value) {
    try {
      jsonschema.validate(validationName, value);
      return true;
    } catch(err) {
      return err.message;
    }
  };
};

const getConfigFilePath = function(name) {
  return path.join(folderPath, `${name}.yml`);
};

const questions = [{
  type: 'input',
  name: 'name',
  message: 'Config name',
  validate: defaultValidateFun('config_name')
}, {
  type: 'input',
  name: 'host',
  message: 'Database host name',
  validate: defaultValidateFun('string')
}, {
  type: 'input',
  name: 'user',
  message: 'Database user name',
  validate: defaultValidateFun('string')
}, {
  type: 'password',
  name: 'password',
  message: 'Database password',
  validate: defaultValidateFun('string')
}, {
  type: 'number',
  name: 'port',
  message: 'Database port name',
  default: 3306,
  validate: defaultValidateFun('integer')
}];

const addAction = async function() {
  const answers = await inquirer.prompt(questions);
  const filePath = getConfigFilePath(answers.name);
  if (fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} file "${filePath}" already exist\n`);
    return;
  }

  const data = YAML.stringify({
    host: answers.host,
    user: answers.user,
    password: answers.password,
    port: answers.port
  });
  fs.writeFileSync(filePath, data, {
    encoding: 'utf8'
  });
  process.stdout.write(`${chalk.green('success')} file "${filePath}" added\n`);
};

const removeAction = async function() {
  const answers = await inquirer.prompt(questions[0]);
  const filePath = getConfigFilePath(answers.name);
  if (!fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} file "${filePath}" doesn't exist\n`);
    return;
  }

  fs.unlinkSync(filePath);
  process.stdout.write(`${chalk.green('success')} file "${filePath}" removed\n`);
};

module.exports = {
  addAction,
  removeAction
};
