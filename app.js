
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const hasha = require('hasha');
const serveStatic = require('serve-static');
const moment = require('moment-timezone');
const session = require('express-session');
var list = [];
list.length = 0;
var count = 0;
var check = 0;
var checkin = "";
var log = [];
log.length = 0;

moment.tz.setDefault("Europe/Zagreb");

var app = new express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'bottom text',
  resave: true,
  saveUninitialized: true
}));

var auth = function (req, res, next) {
  if (!(req.url === '/login') && (!req.session || !req.session.authenticated)) {
    res.redirect('/login');
    return;
  }
  next();
};

const dest = 'uploads/';

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest);
}

//moment(fs.statSync("./"+dest+file).atime).add(2,'hours').format('DD-MM-YYYY hh:mm:ss ')

function scan(aye) {
  fs.readdir(dest, (err, files) => {//------------UPDATE LIST------------
    console.log(aye + " REQUEST");//-----------------ADD DATE----------------
    list.length = 0;
    files.forEach(file => {
      list[count] = { "name": file, "hash": hasha.fromFileSync('./' + dest + file, { algorithm: 'sha256' }), "order": count, "date": moment(fs.statSync("./" + dest + file).atime).add(2, 'hours').format('DD-MM-YYYY hh:mm:ss '), "size": fs.statSync("./" + dest + file).size };
      // console.log("File #"+count+" = "+list[count].name+" | hash = "+list[count].hash+" | order = "+list[count].order+" | date = "+list[count].date+" | size = "+list[count].size);
      count++;
    });
    count = 0;
  })//------------UPDATE LIST------------
}
scan('START');

var storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, dest) },
  filename: function (req, file, cb) {
    for (i = 0; i < list.length; i++) {
      if (list[i].name == file.originalname) {
        //console.log("Copy!");
        le = (path.extname(file.originalname)).length;
        namey = ((file.originalname).slice(0, -le));
        namey = namey + "(1)" + path.extname(file.originalname);
        cb(null, namey);
        break;
        check = 1;
      } else { }
    }
    if (check == 0) { cb(null, file.originalname); } else { }
    check = 0;
  }
})

var upload = multer({ storage: storage }).array('upl');

app.post('/', auth, upload, function (req, res, next) {
  //  console.log(req.files.length + " file(s) uploaded");
  scan('POST');
  res.redirect('/');
});

app.get('/delete/:id', auth, function (req, res, next) {
  //  console.log("DELET request ("+req.params.id+")")
  if (fs.existsSync(dest + "/" + list[req.params.id].name)) {
    fs.unlinkSync(dest + "/" + list[req.params.id].name, (err) => {
      if (err) { } else { }
    });
  }
  scan('DEL');
  res.redirect('/');
});

app.get('/', auth, function (req, res, next) {
  //scan('GET');
  res.render('index', {
    list: list,
    dest: dest
  });
});

app.post('/login', function (req, res, next) {
  console.log("username = " + req.body.username + " password = " + req.body.password);
  if (req.body.username && req.body.username === 'user' && req.body.password && req.body.password === 'pass') {
    req.session.authenticated = true;
    console.log("ONLINE");
    checkin = "";
    res.redirect('/');
  } else {
    console.log("OFFLINE");
    checkin = "Wrong Username/Password!";
    res.redirect('/login');
  }
});

app.get('/uploads/:file', auth, function (req, res, next) {
  res.sendFile(path.join(__dirname, '/uploads/' + req.params.file));
});

app.get('/login', auth, function (req, res, next) {
  console.log("GET LOGIN");
  if (req.session.authenticated) { res.redirect('/'); } else {
    res.render('login', { checkin: checkin });
  }
  checkin = "";
});

app.get('/logout', function (req, res, next) {
  req.session.authenticated = false;
  checkin = "You logged out!";
  res.redirect('/login');
});

app.get('/test', auth, function (req, res, next) {
  res.send("You can only see this after you've logged in.");
});

const port = 80;
app.listen(port, function () { console.log('Listening on port ' + port); });
