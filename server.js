//----------------------------------------------------------------------------//
//    INTRODUCTION
//----------------------------------------------------------------------------//
// In this file, we requires() a couple of packages that help us ensure that our
// responses are secure, and also help us produce useful logging of the use of
// our API server.
//
// helmet() will ensure that our responses have certain security headers, and
// morgan() can be used to log in various formats and granularities (not like
// singularities...)
//
const express = require('express'); // importing a CommonJS module
const hubsRouter = require('./hubs/hubs-router.js');

//----------------------------------------------------------------------------//
//    THIRD PARTY MIDDLEWARE IMPORTS
//----------------------------------------------------------------------------//
// these are examples of "third party middleware" ... middleware created by not
// us (the first party), and not express() (the second party), but by a *third*
// party...
//
// if you are really curious, take a peak at how morgan (for example) is written
// by opening ./modules/morgan/index.js (from the root of the project).
//
// these are just express() middleware, just like the ones-es that we writes. (I
// sound like Gollum.)
//
// helmet() ensures that we have certain headers in our responses that help us
// be secure.
//
// morgan(), if added to the middleware chain for any HTTP request, will log
// information about those requests to the console, or a file, etc.
//
// Here, we just require() them so we can add them to our middleware chain using
// server.use() (or router.use() if we want to limit the scope of their
// application)
//
// At this point, we are just importing them through "require()". This gives us
// a middleware function that we can later "server.use()" (or router.use(), if
// we are doing it in a router file.)
//
const helmet = require('helmet');
const morgan = require('morgan');

const server = express();

//----------------------------------------------------------------------------//
//    "USE()'ing" MIDDLEWARE
//----------------------------------------------------------------------------//
// This is where we begin hooking up our middleware functions, including
// built-in (like express.json()), third-party (like helmet() and morgan()), and
// custom (like our own methodLogger(), addName(), lockOut(), and gateKeeper()).

// express.json() is bit of middleware is a parser that ensures that the text in
// the request body, if it happens to be in json format (like a stringified
// object), is converted into a REAL json object (like Pinnochio), which we can
// access through req.body...
server.use(express.json());

// hey look! there's that third party middleware, helmet.
server.use(helmet());

// hey, there's the other third party middleware! now we are cookin...
//
// Look up the docs for morgan to understand what the 'dev' is for. It's cool.
server.use(morgan('dev'));

// methodLogger() is a middleware method at the bottom of the file that is our
// own lame attempt to do what morgan() does...
server.use(methodLogger);

// addName() is a demonstration of how we can add data to the req object (we
// could also add to res... look it up!) checkout the method below for more
// notes on this...
server.use(addName);

//----------------------------------------------------------------------------//
//    LOCKOUT()
//----------------------------------------------------------------------------//
// lockout() is another middleware demonstratino... the method for adding
// lockout() to the middleware chain (server.use()) is commented out, because
// lockout() prevents any other middleware from processing... so don't uncomment
// this unless you want to hork your entire api. (Heh heh. I said hork.)
//
// In this example, we are using lockout as middleware only for HTTP requests to
// /api/hubs. (I have it commented out, because I don't feel like horking right
// now.)
//
// server.use('/api/hubs', lockout);

// lockDivThree() is another bit of middlewear that we wrote that is as toxic as
// lockout(), only it horks the api only if the current second is a multiple of
// 3... we are so weird...
//
// server.use(lockDivThree);

//----------------------------------------------------------------------------//
//    ALTERNATIVE SYNTAX FOR USE()'ing MIDDLEWHERE
//----------------------------------------------------------------------------//
// An alternative syntax ... when we register middleware with ".use()" or
// ".METHOD()", we an pass in a single middleware method. But, we can also pass
// in multiple methods that should apply to the same METHOD and path.
//
// You can do that by including them one after another as parameters to .use()
// or .METHOD():
//
//    sever.use(express.json(), helmet(), morgan('dev'), methodLogger);
//
// Or, you can store them in an array, and pass the array as a parameter:
//
//    const middleware = [
//        express.json(), 
//        helmet(), 
//        morgan('dev'), 
//        methodLogger,
//        addName,
//        // lockout
//        locoutDivThree
//    ];
//    server.use(middleware);
//
// See http://expressjs.com/en/guide/using-middleware.html and
// http://expressjs.com/en/4x/api.html#app.use
//

//----------------------------------------------------------------------------//
//    ROUTERS ARE MIDDLEWARE TOO...
//----------------------------------------------------------------------------//
// server.use() is for mounting middleware to a path (or to all paths). We can
// pass one or more middleware methods to a server.use() call. Note that a
// "router" is a middleware function. 
server.use('/api/hubs', hubsRouter);

//----------------------------------------------------------------------------//
//    OUR LONE ROUTE HANDLER FOR THE ROOT DOCUMENT PATH...
//----------------------------------------------------------------------------//
server.get('/', (req, res, next) => {
  // here, we are checking for "name" on the request object. But the default
  // request object doesn't have a "name" property... if it exists, it would
  // have to have been added by some middleware that got this reqeust before
  // this function did. See "addName()" below...
  const nameInsert = (req.name) ? ` ${req.name}` : '';
  res.send(`
    <h2>Lambda Hubs API</h2>
    <p>Welcome${nameInsert} to the Lambda Hubs API</p>
    `);
});

//----------------------------------------------------------------------------//
//    FUNCTION METHODLOGGER()
//----------------------------------------------------------------------------//
function methodLogger(req, res, next) {
  console.log(`${req.method} Request`);
  next();
}

//----------------------------------------------------------------------------//
//    FUNCTION ADDNAME()
//----------------------------------------------------------------------------//
// You can add anything you want to the request (and response!) objects. They
// are just JSON objects. And, when control is passed to the "next" middleware,
// they will get a copy of the *modified* request and response objects. In this
// way, earlier middleware can pass data to later middleware.
//
// In this case, we are adding a name value to the request object. The GET /
// handler above looks for this name property... if it exists, it returns an
// HTML document that includes it. If it doesn't exist, it returns an HTML
// document without a name in it.
//
// Remember to call "next()"!
//
// And of course, for this middleware to actually do anything, you need to
// .use() it. See above.
//
// Unlike error handling middleware, which we want to ensure shows up *after*
// all other middleware (so if we need to pass control to it, it is further
// ahead in the stack... remember, we can't go back in the stack.)
function addName(req, res, next) {
  req.name = req.name || 'Sean';
  next();
}

//----------------------------------------------------------------------------//
//    FUNCTION LOCKOUT()
//----------------------------------------------------------------------------//
// Lame. Who would be this mean!!!???
function lockout(req, res) {
  // do some validation...
  // ...uh oh, Batman, no go!
  res.status(403).json({ message: 'api lockout!' });
}

//----------------------------------------------------------------------------//
//    FUNCTION LOCKDIVTHREE()
//----------------------------------------------------------------------------//
function lockDivThree(req, res, next) {
  const currentDate = new Date()
  if (currentDate.getSeconds() % 3 === 0) {
    res.status(403).json({ message: 'locked out cuase div by 3' });
  } else {
    next();
  }
}

//----------------------------------------------------------------------------//
//    A GREAT EXAMPLE OF THE TERNARY OPERATOR
//----------------------------------------------------------------------------//
// You will see the ternary operator a lot ("?"). This operator is synonymous to
// code using an if() comparison. See the comments below, where I specify what
// the code would look like without the ternary operator.
function divisibleByThree(req, res, next) {
  let date = new Date();
  let seconds = date.getSeconds();

  seconds % 3 === 0
    ? res.status(418).json({ message: 'REJECTED' })
    : next();

  // it will often be used on one line like this:
  //
  //  seconds % 3 === 0 ? res.status(418).json({message: 'REJECTED'}) : next();
  //
  // without the ternary operator, this would have looked like this:
  //
  //    if (seconds % 3 === 0) {
  //      res.status(418).json({message: 'REJECTED' });
  //    } else {
  //      next();
  //    }
}

module.exports = server;