// MySQL-based back-end store.
var sync = function(method, collection, options) {
    var table = collection._table || collection.constructor.title.toLowerCase();

    collection.mysql().query('SELECT * FROM ??', [table], function(err, rows, fields) {
        if (err) return options.error(err);

        var models = _.chain(rows).map(function(row) {
            // Initialize each row into its corresponding model
            row.id = row[collection.model.idAttribute];
            return new collection.model(row);
        }).filter(function(model) {
            // Filter by read access
            return model.access('read');
        }).value();

        options.success(models);
    });
}

var mysql = require('mysql');
var register = models.Models.register;
models.Models.register = function(server) {
    var model = this;
    if (!model.prototype.mysql) {
        // Try to reuse MySQL connection
        if (model.prototype.model && model.prototype.model.prototype.mysql) {
            model.prototype.mysql = model.prototype.model.prototype.mysql;
        } else {
            // Create a connection pool to the configured MySQL database
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
                            connection.release();
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
    }

    // Use MySQL as persistent storage for models
    if (model.prototype.storage === 'mysql') {
        model.prototype.sync = sync;
    }
    return register.apply(model, arguments);
}
