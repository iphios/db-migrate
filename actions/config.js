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
    } catch (err) {
      return err.message;
    }
  };
};

const getConfigFilePath = function(name) {
  return path.join(folderPath, `${name}.yml`);
};

const addQuestions = [{
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
  const {
    name
  } = await inquirer.prompt(addQuestions[0]);
  const filePath = getConfigFilePath(name);
  if (fs.existsSync(filePath)) {
    process.stdout.write(`${chalk.red('error')} file "${filePath}" already exist\n`);
    return;
  }

  const answers = await inquirer.prompt(addQuestions.splice(1));
  const data = YAML.stringify(answers);
  fs.writeFileSync(filePath, data, {
    encoding: 'utf8'
  });
  process.stdout.write(`${chalk.green('success')} file "${filePath}" added\n`);
};

const removeAction = async function() {
  const choices = fs.readdirSync(folderPath).map(each => each.split('.')[0]);
  console.log(choices);
  const {
    name
  } = await inquirer.prompt({
    type: 'list',
    name: 'name',
    message: 'Choose which config to remove',
    choices: choices
  });
  const filePath = getConfigFilePath(name);
  fs.unlinkSync(filePath);
  process.stdout.write(`${chalk.green('success')} file "${filePath}" removed\n`);
};

module.exports = {
  addAction,
  removeAction
};
