# luvsic
A site for sharing samples

# Run Instructions

```sh
git clone https://github.com/Matthew-Herman/luvsic.git
```

### Setup local db

The default npm start expects you to configure a local mongoose&mongoDB connection in luvsic/db.js.

### Setup production db
The production run requires the existence of a file "config.json".

You should create a local config.json which contains the address+credentials for the production db.

```JSON
// config.json
{
  "dbconf": "example_username@example_password:PORT_NUMBER.com"
}
```

The JSON is an object which contains one property: a string containing the address with credentials for connecting to a mongoDB database.

The production run attempts to connect to the address specified in the `dbconf` property in config.json.

config.json is in .gitignore to protect credentials within it. So it must be created locally.

```sh
cd luvsic
npm install
npm start app.js

```

If the connection to database is successful, the server will serve on port 3000.
Navigate to localhost:3000 in browser
