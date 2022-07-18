'use strict';

// require packages
const mysql = require('mysql2/promise');
const bluebird = require('bluebird');
const jsonschema = require('json-schema');
const chalk = require('chalk');
const crypto = require('node:crypto');
const debug = require('./debug.js');

/**
 * @class
 * @classdesc it is used in all database operations.
 */
const DB = class {
  static #pools = {};

  /**
   * @method
   * @desc this method is used to create pool and return pool id.
   * @param {Object} options - database connection options.
   * @param {string} options.host - Hostname or the IP address.
   * @param {number} options.port - The port number to use.
   * @param {string} options.user - User name.
   * @param {string} options.password - Password.
   * @param {string} options.database - Database name.
   * @param {number} options.connectionLimit - maximum number of connections.
   * @returns {string} pool id.
   */
  static createPool(options) {
    try {
      jsonschema.validate('db#pool', options);
    } catch (err) {
      process.stdout.write(`${chalk.red('error')} ${err.message}\n`);
      return;
    }

    const optionsStringify = JSON.stringify(options);
    const poolId = crypto.createHash('md5').update(optionsStringify).digest('hex');

    if (DB.#isPoolId(poolId)) {
      debug['dbmigrate:db'](`"${poolId}" pool already exist for "${optionsStringify}"`);
      return poolId;
    }

    const defaultOptions = {
      waitForConnections: true,
      queueLimit: 0,
      decimalNumbers: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      timezone: 'Z',
      charset: 'utf8mb4',
      namedPlaceholders: true,
      nestTables: false,
      rowsAsArray: false,
      Promise: bluebird
    };

    const finalOptions = {
      ...defaultOptions,
      ...options
    };

    const pool = mysql.createPool(finalOptions);

    pool.on('acquire', function(connection) {
      debug['dbmigrate:db'](`connection ${connection.connectionId} is acquired from the pool ${poolId}`);
    });

    pool.on('connection', function(connection) {
      debug['dbmigrate:db'](`new connection ${connection.connectionId} is made within the pool ${poolId}`);
    });

    pool.on('enqueue', function() {
      debug['dbmigrate:db'](`waiting for available connection slot form the pool ${poolId}`);
    });

    pool.on('release', function(connection) {
      debug['dbmigrate:db'](`connection ${connection.connectionId} is released back to the pool ${poolId}`);
    });

    DB.#pools[poolId] = pool;
    debug['dbmigrate:db'](`pool created for "${optionsStringify}" with pool id ${poolId}`);

    return poolId;
  }

  /**
   * @method
   * @desc this method is used to clear all pools.
   */
  static async removePools() {
    for (const [poolId, pool] of Object.entries(DB.#pools)) {
      await pool.end();
      debug['dbmigrate:db'](`${poolId} pool destroyed`);
    }
    DB.#pools = {};
  }

  /**
   * @method
   * @desc this method is used to check if pool id already present.
   * @param {string} poolId - pool id.
   * @returns {boolean} return true if pool present for pool id.
   */
  static #isPoolId(poolId) {
    return Object.hasOwn(DB.#pools, poolId);
  }

  #poolId;
  #con;

  /**
   * @method
   * @param {string} poolId - pool id.
   */
  constructor(poolId) {
    if (!DB.#isPoolId(poolId)) {
      throw new Error('Invalid pool id');
    }

    this.#poolId = poolId;
    this.#con = null;
  }

  /**
   * @method
   * @desc this method is used to find if connection is active or released to pool.
   * @returns {boolean} either true or false.
   */
  #isConnectionActive() {
    return this.#con !== null && DB.#pools[this.#poolId].pool._freeConnections._list.indexOf(connection => {
      return connection !== undefined && connection.connectionId === this.#con.connection.connectionId;
    }) === -1;
  }

  /**
   * @method
   * @desc this method is used to get connection from pool.
   */
  async getConnection() {
    if (this.#isConnectionActive()) {
      debug['dbmigrate:db']('already got connection');
      return;
    }

    this.#con = await DB.#pools[this.#poolId].getConnection();
  }

  /**
   * @method
   * @desc this method is used to release connection back to the pool.
   */
  releaseConnection() {
    if (this.#isConnectionActive()) {
      this.#con.release();
      this.#con = null;
    }
  }

  /**
   * @method
   * @desc this method is used to check if transaction has started.
   * @returns {boolean} either true or false.
   */
  async #inTransaction() {
    const [rows] = await this.execute('SELECT @@in_transaction');
    return rows[0]['@@in_transaction'] === '0' ? false : true;
  }

  /**
   * @method
   * @desc this method is used to start transaction for current connection.
   */
  async beginTransaction() {
    // START TRANSACTION
    if (this.#isConnectionActive() && !this.#inTransaction()) {
      await this.#con.beginTransaction();
    }
  }

  /**
   * @method
   * @desc this method is used to commit transaction for current connection.
   */
  async commit() {
    // COMMIT
    if (this.#isConnectionActive() && await this.#inTransaction()) {
      await this.#con.commit();
    }
  }

  /**
   * @method
   * @desc this method is used to rollback transaction for current connection.
   */
  async rollback() {
    if (this.#isConnectionActive() && await this.#inTransaction()) {
      await this.#con.rollback();
    }
  }

  /**
   * @method
   * @desc this method is used to perform sql operations.
   * @param {string} sql sql statement.
   * @param {Array|Object} params arguments for sql can be passed either array or object for binding values in sql.
   */
  async execute(sql, params = {}) {
    if (this.#isConnectionActive()) {
      return await this.#con.execute(sql, params);
    }
  }
};

module.exports = DB;
