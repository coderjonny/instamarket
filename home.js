var Hapi = require('hapi');
var instagramStrategy = require('passport-instagram').Strategy;

try {
    var config = require("./config.json");
}
catch (e) {
    var config = {
        hostname: 'localhost',
        port: 9000,
        urls: {
            failureRedirect: '/login',
            successRedirect: '/'
        },
        instagram: {
            clientID: "...",
            clientSecret: "...",
            callbackURL: "http://localhost:8000/auth/instagram/callback"
        }
    };
}

var plugins = {
    yar: {
        cookieOptions: {
            password: 'worldofwalmart',
            isSecure: false
        }
    },
    travelogue: config // use '../../' instead of travelogue if testing this repo locally
};

var options = {
  views: {
    engines: { html: 'handlebars' },
    path: __dirname + '/views',
    partialsPath: __dirname + '/views/partials',
    layout: true
  }
};

var server = new Hapi.Server(config.hostname, config.port, options);


server.pack.allow({ ext: true }).require(plugins, function (err) {

    if (err) {
        throw err;
    }
});

var Passport = server.plugins.travelogue.passport;
Passport.use(new instagramStrategy(config.instagram, function (accessToken, refreshToken, profile, done) {

    // Find or create user here...
    return done(null, profile);
}));
Passport.serializeUser(function(user, done) {

    done(null, user);
});
Passport.deserializeUser(function(obj, done) {

    done(null, obj);
});

if (process.env.DEBUG) {
    server.on('internalError', function (event) {

        // Send to console
        console.log(event);
    });
}

// addRoutes
server.addRoute({
    method: 'GET',
    path: '/',
    config: { auth: 'passport' }, // replaces ensureAuthenticated
    handler: function (request) {

        // If logged in already, redirect to /home
        // else to /login
        return request.reply.redirect('/home');
    }
});


server.addRoute({
    method: 'GET',
    path: '/login',
    config: {
        auth: false, // use this if your app uses other hapi auth schemes, otherwise optional
        handler: function (request) {

            var html = '<a href="/auth/instagram">Login with instagram</a>';
            if (request.session) {
                html += "<br/><br/><pre><span style='background-color: #eee'>session: " + JSON.stringify(request.session, null, 2) + "</span></pre>";
            }
            return request.reply(html);
        }
    }
});


server.addRoute({
    method: 'GET',
    path: '/home',
    config: { auth: 'passport' },
    handler: function (request) {

        // If logged in already, redirect to /home
        // else to /login
        return request.reply("ACCESS GRANTED");
    }
});


server.addRoute({
    method: 'GET',
    path: '/auth/instagram',
    config: {
        auth: false,
        handler: function (request) {

            Passport.authenticate('instagram')(request);
        }
    }
});


server.addRoute({
    method: 'GET',
    path: '/auth/instagram/callback',
    config: {
        auth: false,
        handler: function (request) {

            Passport.authenticate('instagram', {
                failureRedirect: config.urls.failureRedirect,
                successRedirect: config.urls.successRedirect,
                failureFlash: true
            })(request, function () {

                return request.reply.redirect('/');
            });
        }
    }
});


server.addRoute({
    method: 'GET',
    path: '/clear',
    config: {
        auth: false,
        handler: function (request) {

            request.session.reset();
            return request.reply.redirect('/session');
        }
    }
});


server.addRoute({
    method: 'GET',
    path: '/logout',
    config: {
        auth: false,
        handler: function (request) {

            request.session._logout();
            return request.reply.redirect('/');
        }
    }
});


server.addRoute({
    method: 'GET',
    path: '/session',
    config: {
        auth: false,
        handler: function (request) {

            return request.reply("<pre>" + JSON.stringify(request.session, null, 2) + "</pre><br/><br/><a href='/login'>Login</a>");
        }
    }
});

server.addRoute({
  method: 'GET',
  path: '/admin',
  config: {
      auth: false,
      handler: function (request) {
        return request.reply.view('admin', {admin: 123});
      }
  }
});

server.start(function () {

    console.log('server started on port: ', server.info.port);
});
