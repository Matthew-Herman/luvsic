const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = mongoose.model('User');

// Source: http://www.passportjs.org/docs/configure/ under 'Custom Callback'
// Explannation of handling signup and login with passport cusotm callbacks
//     Source: https://medium.com/@nohkachi/local-authentication-with-express-4-x-and-passport-js-745eba47076d
passport.use('signup', new LocalStrategy(
  function(username, password, done) {
    if (username.length < 5) {
      return done(null, false, {'message': 'Username too short'});
    }
    if (password.length < 5) {
      return done(null, false, {'message': 'password too short'});
    }
    User.findOne({username: username}, function(err, user) {

      if(err) {
        return done(err);
      }
      if(user) {
        console.log('user already exists');
        return done(null, false, {'message': 'Username already taken'});
      }
      else {

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {

            if (err) {
              return done(err);
            }

            const newUser = new User();
            newUser.username = username;
            newUser.password = hash;

            newUser.save(function(err, user) {
              if(err) {
                return done(err);
              }
              if(!user) {
                  return done(null, false, {'message': 'Please fill all fields'});
              }
              return done(null, newUser);
            });

          });
        });

      }

    }); // User.findOne end

  } // function end
)); // pasport.use end

passport.use('login', new LocalStrategy(
  function(username, password, done) {
    if (!username || username.length < 5) {
      return done(null, false, {'message': 'Username too short'});
    }
    if (!password || password.length < 5) {
      return done(null, false, {'message': 'Password too short'});
    }

    User.findOne({username: username}, function(err, user) {

      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {'message': 'Username is incorrect'});
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {

        // res is true if hash matches password else false
        if (err) {
          return done(err);
        }
        if (isMatch === false) {
          return done(null, false, {'message': 'Password is incorrect'});
        }
        else {
          return done(null, user);
        }

      });

    });

  }
));

// Source: http://www.passportjs.org/docs/configure/ under 'Sessions'
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

console.log("Auth done");

module.exports = passport;
