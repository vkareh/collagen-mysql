// MySQL-based back-end store.
var sync = function(method, model, options) {

    // Verify model access
    if (!model.access(method)) return options.error(new Error('You do not have permission to ' + method + ' this ' + model.constructor.title));

    var table = model._table || model.constructor.title.toLowerCase();
    switch (method) {
        case 'read':
            // Read from MySQL
            if (model.id) {
                model.mysql().query('SELECT * FROM ?? WHERE ?? = ?', [table, model.idAttribute, model.id], function(err, rows) {
                    if (err) return options.error(err);
                    model.set(rows[0]);
                    options.success(model);
                });
            }
            break;
        default:
            return options.error(new Error(method + ' not implemented.'));
    }
}

var mysql = require('mysql');
var register = models.Model.register;
models.Model.register = function(server) {
    var model = this;
    if (!model.prototype.mysql) {
        var config = Collagen.config && Collagen.config.mysql || {};

        // Single configured database
        if (_.has(config, 'host')) {
            config['default'] = config;
        }

        // Create connection pool for each of the configured databases
        var pool = [];
        _.each(config, function(options, key) {
            pool[key] = mysql.createPool(options);

            // Wrap query function to grab a connection from the pool automatically
            pool[key].query = function(sql, values, callback) {
                if (typeof values === 'function') {
                    callback = values;
                    values = [];
                }
                pool[key].getConnection(function(err, connection) {
                    if (err) return callback(err);
                    connection.query(sql, values, function(err, rows, fields) {
                        callback(err, rows, fields);
                        connection.end();
                    });
                });
            }

            // Give models access to the MySQL connection pools
            model.prototype.mysql = function(db) {
                db = db || _.first(_.keys(config));
                return pool[db];
            }
        });
    }

    // Use MySQL as persistent storage for models
    if (model.prototype.storage === 'mysql') {
        model.prototype.sync = sync;
    }
    return register.apply(model, arguments);
}
