var knex = require('../../config/knex');

exports.getCategory = function (id) {
    return knex('categories').select('*').where('id', id).first();
};

exports.addCategory = function(data) {
    return knex('categories').insert(data);
};