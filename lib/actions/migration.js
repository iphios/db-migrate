'use strict';

const fs = require('fs');
const YAML = require('yaml');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');
const ora = require('ora')();

const configAction = require('./config.js');
const DB = require('./../db.class.js');

const MIGRATION_FOLDER_NAME = 'migrations';
const MIGRATION_TABLE_NAME = 'schema_migrations';

const defaultMigrationFolderPath = path.join(process.cwd(), MIGRATION_FOLDER_NAME);

const getNewMigrationNumber = function() {
  return moment(new Date()).utc().format('YYYYMMDDHHmmssSSS');
};

const createDefaultMigrationFolder = function() {
  if (!fs.existsSync(defaultMigrationFolderPath)) {
    fs.mkdirSync(defaultMigrationFolderPath, {
      recursive: false
    });
    process.stdout.write(`${chalk.blue('info')} folder "${defaultMigrationFolderPath}" created\n`);
  }
};

const createDefaultMigrationTable = async function(db) {
  const [rows] = await db.execute(`SHOW TABLES LIKE '${MIGRATION_TABLE_NAME}'`);
  if (rows.length === 0) {
    await db.execute(`CREATE TABLE ${MIGRATION_TABLE_NAME} (
      id bigint(20) unsigned NOT NULL,
      PRIMARY KEY (id)
    )`);
    process.stdout.write(`${chalk.green('success')} "${MIGRATION_TABLE_NAME}" table create successfully\n`);
  }
};

const getConfigDetails = function(name) {
  if (!configAction.isValidConfigName(name)) {
    return;
  }

  const filePath = configAction.getConfigFilePath(name);
  const configDataString = fs.readFileSync(filePath, {
    encoding: 'utf8'
  });
  const configData = YAML.parse(configDataString);
  return configData;
};

const createAction = function(migrationName) {
  const migrationFileName = `${getNewMigrationNumber()}_${migrationName.replace(/\W/g, '_')}.js`;
  const fileContent = `'use strict';

exports.up = async function(db) {
  // write your code here
};

exports.down = async function(db) {
  // write your code here
};
`;
  createDefaultMigrationFolder();
  fs.writeFileSync(path.join(defaultMigrationFolderPath, migrationFileName), fileContent, {
    encoding: 'utf8'
  });
  process.stdout.write(`${chalk.green('success')} "${migrationFileName}" migration file successfully created\n`);
};

const runMigration = async function(db, migrationFile, action) {
  const migrationCode = require(path.join(defaultMigrationFolderPath, migrationFile));
  const currentMigrationId = migrationFile.split('_')[0];

  try {
    await db.beginTransaction();
    ora.start(`migration:${action} "${currentMigrationId}" running...`);

    await migrationCode[action](db);
    if (action === 'up') {
      await db.execute(`INSERT INTO ${MIGRATION_TABLE_NAME} (id) VALUES(:id)`, {
        id: currentMigrationId
      });
    } else {
      await db.execute(`DELETE FROM ${MIGRATION_TABLE_NAME} WHERE id = :id`, {
        id: currentMigrationId
      });
    }

    await db.commit();
    ora.succeed(`migration:${action} "${currentMigrationId}" completed`);
  } catch (err) {
    await db.rollback();
    ora.fail(`migration:${action} "${currentMigrationId}" failed with error: ${err.message}`);
  } finally {
    ora.stop();
  }
};

const upAction = async function(options, command) {
  createDefaultMigrationFolder();

  const [, action] = command._name.split(':');

  const configData = getConfigDetails(options.name);
  const poolId = DB.createPool(configData);
  const db = new DB(poolId);
  await db.getConnection();
  await createDefaultMigrationTable(db);

  if (Object.hasOwn(options, 'id')) {
    const migrationFile = fs.readdirSync(defaultMigrationFolderPath).find(file => file.startsWith(`${options.id}_`));
    if (migrationFile === undefined) {
      process.stdout.write(`${chalk.red('error')} Invalid migration id "${options.id}"\n`);
      db.releaseConnection();
      await DB.removePools();
      return;
    }

    const [rows] = await db.execute(`SELECT 1 AS one FROM ${MIGRATION_TABLE_NAME} WHERE id = :id`, {
      id: migrationFile.split('_')[0]
    });
    if (rows.length === 1) {
      process.stdout.write(`${chalk.red('error')} "${options.id}" migration already ran\n`);
      db.releaseConnection();
      await DB.removePools();
      return;
    }

    await runMigration(db, migrationFile, action);
    db.releaseConnection();
    await DB.removePools();
  } else {
    const migrationFiles = fs.readdirSync(defaultMigrationFolderPath).sort((file1, file2) => {
      const [file1Id] = file1.split('_'),
        [file2Id] = file2.split('_');
      return file1Id < file2Id ? -1 : 1;
    });

    if (migrationFiles.length === 0) {
      process.stdout.write(`${chalk.yellow('warning')} no migrations to run\n`);
      db.releaseConnection();
      await DB.removePools();
      return;
    }

    let anyMigrationRan = false;
    const [rows] = await db.execute(`SELECT id FROM ${MIGRATION_TABLE_NAME} ORDER BY ID ASC`);
    for (let i = 0, j = 0; i < migrationFiles.length; i++) {
      const currentMigrationId = migrationFiles[i].split('_')[0];

      if (rows[j] !== undefined && currentMigrationId === rows[j].id) {
        j++;
        continue;
      }

      await runMigration(db, migrationFiles[i], action);
      anyMigrationRan = true;
    }
    if (!anyMigrationRan) {
      process.stdout.write(`${chalk.blue('info')} no pending migrations to run\n`);
    }

    db.releaseConnection();
    await DB.removePools();
  }
};

const downAction = async function(options, command) {
  createDefaultMigrationFolder();

  const [, action] = command._name.split(':');

  const configData = getConfigDetails(options.name);
  const poolId = DB.createPool(configData);
  const db = new DB(poolId);
  await db.getConnection();
  await createDefaultMigrationTable(db);

  if (Object.hasOwn(options, 'id')) {
    const migrationFile = fs.readdirSync(defaultMigrationFolderPath).find(file => file.startsWith(`${options.id}_`));
    if (migrationFile === undefined) {
      process.stdout.write(`${chalk.red('error')} Invalid migration id "${options.id}"\n`);
      db.releaseConnection();
      await DB.removePools();
      return;
    }

    const [rows] = await db.execute(`SELECT 1 AS one FROM ${MIGRATION_TABLE_NAME} WHERE id = :id`, {
      id: migrationFile.split('_')[0]
    });
    if (rows.length === 0) {
      process.stdout.write(`${chalk.red('error')} "${options.id}" migration didn't run\n`);
      db.releaseConnection();
      await DB.removePools();
      return;
    }

    await runMigration(db, migrationFile, action);
    db.releaseConnection();
    await DB.removePools();
  } else {
    const [rows] = await db.execute(`SELECT id FROM ${MIGRATION_TABLE_NAME} ORDER BY id DESC LIMIT 1`);
    if (rows.length === 0) {
      process.stdout.write(`${chalk.red('error')} no migrations ran earlier\n`);
      db.releaseConnection();
      await DB.removePools();
      return;
    }

    const migrationFile = fs.readdirSync(defaultMigrationFolderPath).find(file => file.startsWith(`${rows[0].id}_`));
    await runMigration(db, migrationFile, action);
    db.releaseConnection();
    await DB.removePools();
  }
};

module.exports = {
  createAction,
  upAction,
  downAction
};
