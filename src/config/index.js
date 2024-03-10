const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(8080),
    JWT_SECRET: Joi.string().required(),
    ACCESS_TOKEN_EXPIRY: Joi.number().default(900),
    REFRESH_TOKEN_EXPIRY: Joi.number().default(3600),
    DB_NAME: Joi.string().required(),
    DB_DIALECT: Joi.string().valid('mysql', 'mssql').default('mssql'),
    DB_HOST: Joi.string().default('localhost'),
    DB_PORT: Joi.number().default(1433),
    DB_USERNAME: Joi.string().default('sa'),
    DB_PASSWORD: Joi.string().default(''),
    CREATE_LIMIT: Joi.number().default(50),
    BANK_ASSETS_DIRECTORY: Joi.string().default(''),
    CUSTOMER_ASSETS_DIRECTORY: Joi.string().default(''),
    INTERNAL_ASSETS_DIRECTORY: Joi.string().default(''),
    REDIS_HOST: Joi.string().default('127.0.0.1'),
    REDIS_PORT: Joi.number().default(6379),
    LDAP_SERVER_URL: Joi.string().required(),
    LDAP_USERNAME: Joi.string().required(),
    LDAP_SUFFIX_ONE: Joi.string().required(),
    LDAP_SUFFIX_TWO: Joi.string().required(),
    // LDAP_PAGINATION: Joi.string().required(),
    LDAP_PASSWORD: Joi.string().required(),
    LDAP_READER_DN: Joi.string().required(),
    LDAP_READER_PASSWORD: Joi.string().required(),
    EMAIL_HOST: Joi.string(),
    EMAIL_PORT: Joi.number(),
    EMAIL_USERNAME: Joi.string(),
    EMAIL_PASSWORD: Joi.string(),
    EMAIL_SECURE: Joi.string(),

  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  CREATE_LIMIT: envVars.CREATE_LIMIT,
  BANK_ASSETS_DIRECTORY: envVars.BANK_ASSETS_DIRECTORY,
  CUSTOMER_ASSETS_DIRECTORY: envVars.CUSTOMER_ASSETS_DIRECTORY,
  INTERNAL_ASSETS_DIRECTORY: envVars.INTERNAL_ASSETS_DIRECTORY,
};
module.exports.JWT = {
  SECRET: envVars.JWT_SECRET,
  ACCESS_TOKEN_EXPIRY: envVars.ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY: envVars.REFRESH_TOKEN_EXPIRY,
};
module.exports.TO_DMS = {
  UPLOAD_TO_DMS: envVars.TO_DMS,
};
module.exports.DB = {
  NAME: envVars.DB_NAME,
  DIALECT: envVars.DB_DIALECT,
  HOST: envVars.DB_HOST,
  PORT: envVars.DB_PORT,
  USERNAME: envVars.DB_USERNAME,
  PASSWORD: envVars.DB_PASSWORD,
};
module.exports.REDIS = {
  HOST: envVars.REDIS_HOST,
  PORT: envVars.REDIS_PORT,
};

module.exports.LDAP = {
  LD_SERVER_URL: envVars.LDAP_SERVER_URL,
  LD_USERNAME: envVars.LDAP_USERNAME,
  LD_PASSWORD: envVars.LDAP_PASSWORD,
  LD_SUFFIX_ONE: envVars.LDAP_SUFFIX_ONE,
  LD_SUFFIX_TWO: envVars.LDAP_SUFFIX_TWO,
  // LD_PAGINATION: envVars.LDAP_PAGINATION,
  LD_READER_DN: envVars.LDAP_READER_DN,
  LD_READER_PASSWORD: envVars.LDAP_READER_PASSWORD,
};

module.exports.FTP = {
  HOST: process.env.FTP_HOST,
  PORT: process.env.FTP_PORT,
  USERNAME: process.env.FTP_USERNAME,
  PASSWORD: process.env.FTP_PASSWORD,
  TYPE: process.env.FTP_TYPE,
};

module.exports.EMAIL = {
  HOST: envVars.EMAIL_HOST,
  PORT: envVars.EMAIL_PORT,
  USERNAME: envVars.EMAIL_USERNAME,
  PASSWORD: envVars.EMAIL_PASSWORD,
  SECURE: envVars.EMAIL_SECURE,
};
