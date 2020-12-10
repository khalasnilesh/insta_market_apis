module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  directory: __dirname + '/migrations',
  tableName: 'migrations'
};
