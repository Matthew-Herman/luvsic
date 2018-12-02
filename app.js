const express = require('express');
const session = require('express-session');
const path = require('path');
const parser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
require( './db' );

// passport object and custom functions setup in auth
const passport = require('./auth');

// Multer saves uploaded files to public/img & public/samples
// Source: https://www.npmjs.com/package/multer under 'DiskStorage'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, 'public/');
    let fpath = dest;

    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/gif') {
      fpath = dest + '/img';
    }
    else if (file.mimetype === 'audio/mp3' || file.mimetype === 'audio/wav') {
      fpath = dest + '/samples';
    }
    cb(null, fpath);
  },
  filename: function (req, file, cb) {
    let fname = Date.now()+'';
    if (file.mimetype === 'image/jpeg') {
      fname += '.jpeg';
    }
    else if (file.mimetype === 'image/gif') {
      fname += '.gif';
    }
    else if (file.mimetype === 'audio/mp3') {
      fname += '.mp3';
    }
    else if (file.mimetype === 'audio/wav') {
      fname += '.wav';
    }

    cb(null, fname);
  }
});

function fileFilter (req, file, cb) {
  if (file.fieldname === 'images') {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/gif') {
      cb(null, true); // accept
    }
    else {
      cb(new Error('Image file must be .jpeg or .gif')); // propagate to router
    }
  }
  else if (file.fieldname === 'sounds') {
    if (file.mimetype === 'audio/mp3' || file.mimetype === 'audio/wav') {
      cb(null, true); // accept
    }
    else {
      cb(new Error('Audio file must be .mp3 or .wav')); // propagate to router
    }
  }

}

const limits = {fileSize: 1073741824, files: 2};
const upload = multer({storage: storage, limits: limits, fileFilter: fileFilter});

const app = express();

const User = mongoose.model('User');
const Sample = mongoose.model('Sample');

const sessionOptions = {
	secret: 'password123',
	saveUninitialized: false,
	resave: false
};

//////////////////// Middleware ////////////////////

app.set('view engine', 'hbs');
app.use(parser.urlencoded({ extended: false }));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

app.use('/samples', (req, res, next) => {
  const fileName = req.path.replace("/", "");
  res.setHeader('Content-Disposition', 'attachment;'+fileName);
  return next();
});
app.use('/samples', express.static(path.join(__dirname, 'public/samples')));

// req.user exists if user who sent req has passport authenticated session
app.use((req, res, next) => {
  if (req.user) {
    res.locals.username = req.user.username;
  }
  next();
});

// when call as middleware in routes, restricts access to only logged-in users
function loggedInOnly(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
}

// Removes files in files from local file system
// Expects files in same format as req.files from multer
function removeFiles (files) {
  if (files["images"]) {
    const file = files["images"][0];
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Could not delete " + file.path);
      }
    });
  }
  if (files["sounds"]) {
    const file = files["sounds"][0];
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Could not delete " + file.path);
      }
    });
  }
}

//////////////////// Routes ////////////////////

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res, next) => {
  passport.authenticate('login', function(err, user, message) {

    if (err) {
      return res.render('login', {'message': message['message']});
    }
    if (!user) {
      console.log(message);
      return res.render('login', {'message': message['message']});
    }
    req.login(user, function(err){
      if(err){
        console.log(err);
        return res.render('login', {'message': message['message']});
      }
      return res.redirect('/');
    });

  })(req, res, next);

});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res, next) => {

  passport.authenticate('signup', function(err, user, message) {

    if (err) {
      return res.render('register', {'message': message['message']});
    }
    if (!user) {
      return res.render('register', {'message': message['message']});
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/');
    });

  })(req, res, next);

});

app.get('/upload', loggedInOnly, (req, res) => {
  res.render('upload');
});

// Use multer to expect 1 imgFile and 1 soundFile
const multerFields = [{name: 'images', maxCount: 1}, {name: 'sounds', maxCount: 1}];
const doUpload = upload.fields(multerFields);

app.post('/upload', loggedInOnly, (req, res) => {
  // Tries to upload files, err conditions in multer options
  // Doc Source: https://www.npmjs.com/package/multer under 'Usage'
  doUpload(req, res, function(err) {
    if (err) {
      console.log(err);
      return res.render('upload', {'message': err});
    }
    if (!req.files) {
      return res.render('upload', {'message': "Must upload both an image and a sound"});
    }
    if (!req.files['images'] || !req.files['sounds']) {
      // This block is executed if only one file was uploaded
      // The one uploaded file needs to be removed from the fs because no sample
      removeFiles(req.files);
      return res.render('upload', {'message': "Must upload both an image and a sound"});
    }
    if (!req.body || !req.body['name'] || !req.body['instruments'] ||
     !req.body['description']) {
      // both files must exist in upload to reach t
      removeFiles(req.files);
      return res.render('upload', {'message': "A field has not been filled out"});
    }

    // By this line file uploads and validation were succesful
    // Create new Sample
    const newSample = new Sample({
      user: req.user.username,
      name: req.body['name'],
      instruments: req.body['instruments'],
      description: req.body['description'],
      imageid: req.files['images'][0].filename,
      soundid: req.files['sounds'][0].filename,
      dateUploaded: Date.now(),
      numdownloads: 0
    });

    // Add sample to db
    newSample.save((err, sample) => {
      if (err) {
        console.log(err);
        res.render('upload', {'message': err});
      }
      else {
        // Update User to keep id of new sample
        User.findById(req.user._id, function(err, user) {
          if (err) {
            res.status(500).send("User Search Error");
          }
          else {
            user.samples.push(sample._id);
            user.save(function(err) {
                if (err) {
                  res.status(500).send("User Update Error");
                }
                else {
                  res.redirect('/');
                }
            });

          }
        });


      }
    });

  });

});

// Source: http://www.passportjs.org/docs/configure/ under 'Log Out'
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/modify', loggedInOnly, (req, res) => {
  if (!req.query.sample) {
    res.status(404).send("Cannot Get " + req.originalUrl);
  }
  Sample.findOne({'name': req.query.sample}, function(err, sample) {
    if (err) {
      return res.status(404).send('Sample ' + req.query.sample + ' does not exist');
    }
    if (!sample) {
      return res.status(404).send('Sample ' + req.query.sample + ' does not exist');
    }
    if (sample.user !== req.user.username) {
      // Check if user owns sample
      return res.status(401).send("401 GET " + req.originalUrl + " no permission");
    }
    const sampleInfo = {
      query: encodeURIComponent(sample.name),
      name: sample.name,
      user: sample.user,
      instruments: sample.instruments,
      description: sample.description,
      imageid: sample.imageid,
      soundid: sample.soundid,
      dateUploaded: sample.dateUploaded.getDate()+"/"+sample.dateUploaded.getMonth()+"/"+sample.dateUploaded.getFullYear(),
      numdownloads: sample.numdownloads
    };

    // Fixes encoding ' inside of query
    // Source: https://stackoverflow.com/questions/7298770/how-do-you-pass-an-apostrophe-through-a-url
    sampleInfo.query = sampleInfo.query.replace(/'/g, '%27');

    return res.render('sampledetail', sampleInfo);
  });
});

app.post('/modify', loggedInOnly, (req, res) => {
  if (!req.query.sample) {
    return res.status(404).send("Cannot Get " + req.originalUrl);
  }
  // Check Sample exists
  Sample.findOne({'name': req.query.sample}, function(err, sample) {
    if (err) {
      return res.status(404).send('Sample ' + req.query.sample + ' does not exist');
    }
    if (!sample) {
      return res.status(404).send('Sample ' + req.query.sample + ' does not exist');
    }
     //Check if user owns sample
    if (sample.user !== req.user.username) {
      return res.status(401).send("401 Cannot Get " + req.originalUrl);
    }
    // Upload user files
    doUpload(req, res, function(err) {
      const sampleInfo = {
        name: sample.name,
        user: sample.user,
        instruments: sample.instruments,
        description: sample.description,
        imageid: sample.imageid,
        soundid: sample.soundid,
        dateUploaded: sample.dateUploaded.getDate()+"/"+sample.dateUploaded.getMonth()+"/"+sample.dateUploaded.getFullYear(),
        numdownloads: sample.numdownloads
      };
      if (err) {
        sampleInfo.message = err;
        return res.render('sampledetail', sampleInfo);
      }
      if (!req.body.save && !req.body.delete) {
        sampleInfo.message = "You must press save or delete";
        return res.render('sampledetail', sampleInfo);
      }
      if (req.body.save) {
        if (req.body.name) {
          sample.name = req.body.name;
        }
        if (req.body.instruments) {
          sample.instruments = req.body.instruments;
        }
        if (req.body.description) {
          sample.description = req.body.description;
        }
        const filesToRemove = {};
        if (req.files['images']) {
          filesToRemove['images'] = [];
          filesToRemove['images'].push({'path': path.join(__dirname, 'public/img/'+sample.imageid)});
          sample.imageid = req.files['images'][0].filename;
        }
        if (req.files['sounds']) {
          filesToRemove['sounds'] = [];
          filesToRemove['sounds'].push({'path': path.join(__dirname, 'public/samples/'+sample.soundid)});
          sample.soundid = req.files['sounds'][0].filename;
        }
        sample.save((err, sample) => {
          if (err) {
            return res.status(404).send('Sample ' + req.query.sample + ' does not exist');
          }
          if (filesToRemove['images'] || filesToRemove['sounds']) {
            // if new file/s uploaded, remove old file/s
            removeFiles(filesToRemove);
          }
          return res.redirect('/modify?sample=' + encodeURIComponent(sample.name));
        });
      } // if (req.body.save) end
      if (req.body.delete) {
        const filesToRemove = {
          'images': [
            {'path': path.join(__dirname, 'public/img/'+sample.imageid)}
          ],
          'sounds': [
            {'path': path.join(__dirname, 'public/samples/'+sample.soundid)
          }]
        };
        sample.remove((err) => {
          if (err) {
            console.error(err);
          }
          removeFiles(filesToRemove);
          res.redirect('/');
        });
      } // if (req.body.delete) end

    }); // doUpload end

  }); // Sample.findOne end
});

//////////////////// API ////////////////////
app.get('/api/samples', (req, res) => {
  const query = {};
  Sample.find(query, function(err, samples) {

    if (err) {
      res.status(500).send("API Error");
    }
    else {

      const samplesArray = samples.map(function(sample) {
        return {
          "id": sample.name+(new Date()).getTime(),
          "user": sample.user,
          "name": sample.name,
          "instruments": sample.instruments,
          "description": sample.description,
          "imageid": sample.imageid,
          "soundid": sample.soundid,
          "dateUploaded":sample.dateUploaded.getDate()+"/"+sample.dateUploaded.getMonth()+"/"+sample.dateUploaded.getFullYear(),
          "numdownloads": sample.numdownloads+""
        };
      });

      res.json({'samples': samplesArray, 'username': req.user ? req.user.username : "none"});
    }

  });
});

app.get('/api/search', (req, res) => {
  let query = {};
  if (req.query.query) {
    console.log(req.query.query);
    query = {
      $or: [
        {'user': {"$regex": req.query.query, "$options": "i"}},
        {'name': {"$regex": req.query.query, "$options": "i"}},
        {'instruments': {"$regex": req.query.query, "$options": "i"}},
        {'description': {"$regex": req.query.query, "$options": "i"}}
      ]
    };
  }
  Sample.find(query, function(err, samples) {
    if (err) {
      res.json("API Error");
    }
    else {
      res.json(samples.map(function(sample) {
        return {
          "id": sample.name+(new Date()).getTime(),
          "user": sample.user,
          "name": sample.name,
          "instruments": sample.instruments,
          "description": sample.description,
          "imageid": sample.imageid,
          "soundid": sample.soundid,
          "dateUploaded": sample.dateUploaded.getDate()+"/"+sample.dateUploaded.getMonth()+"/"+sample.dateUploaded.getFullYear(),
          "numdownloads": sample.numdownloads+""
        };
      }));
    }

  });
});

app.get('/api/download', (req, res) => {
  let query = {};
  if (req.query.soundname) {
    query = {'name': req.query.soundname};
  } else {
    return res.json("Sample not found");
  }
  Sample.findOne(query, function(err, sample) {
    console.log("found sample:");
    console.log(sample);
    if (err) {
      return res.json("Sample not found");
    }
    sample.numdownloads += 1;
    sample.save((err, sample) => {
      if (err) {
        return res.json("API Error");
      }
      return res.json("OK " + sample.name + " updated");
    });

  });
});


app.listen(process.env.PORT || 3000);
