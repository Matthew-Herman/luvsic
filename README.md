# luvsic
A site for sharing samples

# Run Instructions

### Clone repo

```sh
git clone https://github.com/Matthew-Herman/luvsic.git
```

### Setup local db

The default npm start expects to connect to a mongoDB database for testing. 
You should set `dbconf` in luvsic/db.js to the correct connection string for the test database.

### Setup production db
The production run requires the existence of a file "config.json".

You should create a local config.json which contains the property `dbconf`. `dbconf` should be set to the connection string for the production db.

```JSON
// config.json
{
  "dbconf": "mongodb://example_username@example_password:PORT_NUMBER.com"
}
```

The production run attempts to connect to the address specified in the `dbconf` property in config.json.

config.json is in .gitignore to protect credentials within it. So it must be created locally.

```sh
cd luvsic
npm install
npm start app.js

```

### Run 

For development
```sh
npm start
```

If npm start is run, the server will serve on port 3000. 
Navigate to localhost:3000 in browser.
