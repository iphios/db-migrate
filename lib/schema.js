'use strict';

const jsonschema = require('json-schema');

jsonschema.add('config_name', {
  type: 'string',
  pattern: '^[a-z0-9-_]{1,}$'
});

const poolSchema = {
  host: {
    type: 'string'
  },
  port: {
    type: 'integer',
    minium: 0,
    maximum: (2 ** 16) - 1
  },
  user: {
    type: 'string'
  },
  password: {
    type: 'string'
  },
  database: {
    type: 'string'
  },
  connectionLimit: {
    type: 'integer',
    minium: 1
  }
};

jsonschema.add('config', {
  type: 'object',
  properties: {
    ...{
      name: {
        $ref: 'config_name'
      }
    },
    ...poolSchema
  },
  required: ['name', ...Object.keys(poolSchema)]
});

jsonschema.add('db#pool', {
  type: 'object',
  properties: poolSchema,
  required: Object.keys(poolSchema)
});


module.exports = null;
