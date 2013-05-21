Collagen MySQL
==============

This module provides a MySQL-based persistent storage for models in the
[Collagen.js](http://collagenjs.org) framework.

### Installation & Configuration
Install by running `npm install collagen-mysql` in your Collagen.js app and
add `require('collagen-mysql');` in your app's `index.js` file, anywhere
before the model that needs it is loaded. For example:

```js
var collagen = require('collagen');

require('collagen-mysql'); // This module...
require('collagen-blog'); // Module that will use MySQL

collagen.load(__dirname);
collagen.start();
```

You will need to add the MySQL configuration details. In your `collagen.json`
file, add the following property, replacing values as appropriate.

```js
{
    "mysql": {
        "host": "localhost",
        "port": 3306,
        "database": "database-name",
        "user": "mysql-username",
        "password": "mysql-password"
    }
}
```

You can also create configurations for multiple databases.

```js
{
    "mysql": {
        "db1": {
            "host": "localhost",
            "port": 3306,
            "database": "database-name",
            "user": "mysql-username",
            "password": "mysql-password"
        },
        "db2": {
            "host": "localhost",
            "port": 3306,
            "database": "other-database-name",
            "user": "mysql-username",
            "password": "mysql-password"
        }
    }
}
```

### Usage
Once your module is installed and configured, you will need to add the `storage:
'mysql'` property to the model or collection that will use it. For example:

```js
model = models.Model.extend({
    storage: 'mysql',
    /* My other model properties */
});
```

If you want to add it to a third-party model (i.e. from an installed module), it
is good practice to not modify it and instead augment it in your own app. For
the example above, you would create a new `BlogPost.bones.js` file in your
`app/model` folder and add the following:

```js
model = models.BlogPost.augment({
    storage: 'mysql'
});
```

This way the _BlogPost_ model from the _collagen-blog_ module will be augmented
to use MySQL as the persistence storage, without having to modify the
_collagen-blog_ module. In addition to models, you would also want to add
`storage: 'mysql'` to any collections that need it.

The collagen-mysql module overrides the model's `sync()` method and provides a
`model.mysql()` function that returns a MySQL connection pool for the selected
database configuration. You can use this to override the module's `sync()`
method with your own logic.

To query MySQL, use
`model.mysql().query('SELECT * FROM table ...', function(err, rows) {...})`,
which will grab a connection from the pool and end it after the query has
returned. If you have multiple database configurations, you can select them by
doing the following: `model.mysql('db1').query(...)`, where `db1` is the
database configuration key in your `collagen.json` file.
