// MySQL-based back-end store.
var sync = function(method, model, options) {

    // Verify model access
    if (!model.access(method)) return options.error(new Error('You do not have permission to ' + method + ' this ' + model.constructor.title));

    var table = model._table || model.constructor.title.toLowerCase();
    switch (method) {
        case 'read':
            // Read from MySQL
            if (model.id) {
                model.mysql.query('SELECT * FROM ?? WHERE ?? = ?', [table, model.idAttribute, model.id], function(err, rows) {
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
    if (!this.prototype.mysql) {
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

    // Use MySQL as persistent storage for models
    if (this.prototype.storage === 'mysql') {
        this.prototype.sync = sync;
    }
    return register.apply(this, arguments);
}
