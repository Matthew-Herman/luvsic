// 1ST DRAFT DATA MODEL
const mongoose = require('mongoose');

// Users
// samples is a list of references to Sample objects uploaded by the User
const user = new mongoose.Schema({
  username: {type: String, required: true, unique: true}, // provided by authentication plugin
  password: {type: String, required: true}, // hash provided by authentication plugin
  samples:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sample' }]
});

// Samples
const sample = new mongoose.Schema({
  user: {type: String, required: true},
  name: {type: String, required: true, unique: true},
  instruments: {type: String, required: true},
  description: {type: String, required: false},
  imageid: {type: String, required: false},
  soundid: {type: String, required: false},
  dateUploaded: {type: Date, required: true},
  numdownloads: {type: Number, required: false}
});

// register models with mongoose
mongoose.model('User', user);
mongoose.model('Sample', sample);

// is the environment variable, NODE_ENV, set to PRODUCTION?
let dbconf;
if (process.env.NODE_ENV === 'PRODUCTION') {
 // if we're in PRODUCTION mode, then read the configration from a file
 // use blocking file io to do this...
 const fs = require('fs');
 const path = require('path');
 const fn = path.join(__dirname, 'config.json');
 const data = fs.readFileSync(fn);

 // our configuration file will be in json, so parse it and set the
 // conenction string appropriately!
 const conf = JSON.parse(data);
 dbconf = conf.dbconf;
} else {
 // if we're not in PRODUCTION mode, then use
 dbconf = 'mongodb://localhost/luvsic';
}
mongoose.connect(dbconf);

const db = mongoose.connection;
db.once('open', function() {
  console.log("Connected to luvsic db");
});
