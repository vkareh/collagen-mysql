// MySQL-based back-end store.
var sync = function(method, collection, options) {
    var table = collection._table || collection.constructor.title.toLowerCase();

    collection.mysql.query('SELECT * FROM ??', [table], function(err, rows, fields) {
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
    if (!this.prototype.mysql) {
        // Try to reuse MySQL connection
        if (this.prototype.model && this.prototype.model.prototype.mysql) {
            this.prototype.mysql = this.prototype.model.prototype.mysql;
        } else {
            // Create a connection pool to the configured MySQL database
            var config = Collagen.config && Collagen.config.mysql || {};
            var pool = mysql.createPool(config);

            // Give models access to the MySQL connection pool
            this.prototype.mysql = pool;
            // Wrap query function to grab a connection from the pool automatically
            this.prototype.mysql.query = function(sql, values, callback) {
                if (typeof values === 'function') {
                    callback = values;
                    values = [];
                }
                pool.getConnection(function(err, connection) {
                    if (err) return callback(err);
                    connection.query(sql, values, function(err, rows, fields) {
                        callback(err, rows, fields);
                        connection.end();
                    });
                });
            }
        }
    }

    // Use MySQL as persistent storage for models
    if (this.prototype.storage === 'mysql') {
        this.prototype.sync = sync;
    }
    return register.apply(this, arguments);
}
