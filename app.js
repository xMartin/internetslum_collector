var sys = require('sys')
var http = require('http')
var url = require('url')
var querystring = require('querystring')
var fs = require('fs')
var express = require('express')
var mustache = require('mustache')
var mongodb = require('mongodb')

var port = process.argv[2] || 8080

console.log('Starting server...')

// load partial templates
var partials = {}
;['header', 'footer'].forEach(function(name) {
  partials[name] = fs.readFileSync('./views/' + name + '.html', 'utf8')
})
// load templates
var templates = {}
;['index', 'list', 'add'].forEach(function(name) {
  templates[name] = fs.readFileSync('./views/' + name + '.html', 'utf8')
})

// get collection "urls" from db
// FIXME Opening the database and getting the collection works asynchronously so it may be requested before it is available.
new mongodb.Db('internetslum_collector', new mongodb.Server('localhost', 27017, {}), {}).open(function(err, db) {
  db.collection('urls', function(err, collection) {
    url_collection = collection
  })
})

var app = express.createServer();

app.configure(function() {
  app.use(express.staticProvider(__dirname + '/public'))
})

app.get('/', function(req, res) {
  res.send(mustache.to_html(templates['index'], {}, partials))
})

app.get('/list', function(req, res) {
  url_collection.find({}, function(err, cursor) {
    cursor.fetchAllRecords(function(err, items) {
      items.forEach(function(item) {
        item.formattedDate =
          item.date.getDate() + '.' + item.date.getMonth() + '.' + item.date.getFullYear() + ', '
          + item.date.getHours() + ':' + item.date.getMinutes()
      })
      res.send(mustache.to_html(templates['list'], { list: items }, partials))
    })
  })
})

app.get('/add', function(req, res) {
  var templateTags = {
    formAction: '',
    formMethod: 'GET',
    userNameInputLabel: 'User name:',
    userNameInputName: 'username',
    urlInputLabel: 'URL:',
    urlInputName: 'url'
  }
  var params = querystring.parse(url.parse(req.url).query)
  if (params.url) {
    setTimeout(function() {
      checkUrl(params.url, function(err, url) {
        if (!err) {
          var doc = { username: params.username, url: url, date: new Date() }
          url_collection.insert(doc, function() { sys.log('Added URL `' + url + '`.') })
        }
        else {
          sys.log('Rejected invalid URL `' + url + '`.')
        }
      })
    }, 0)
    render('url probably added to the internet slum')
  }
  else {
    render()
  }

  function render(message) {
    templateTags.message = message || ''
    res.send(mustache.to_html(templates['add'], templateTags, partials))
  }
})

app.listen(port)

function checkUrl(url, callback) {
  var urlPartsMatch = /(https?\:\/\/)?([^\:\/]*)(\:\d+)?(\/.*)?/.exec(url)
  var urlParts = {}
  urlParts.protocol = urlPartsMatch[1] || 'http://'
  urlParts.host = urlPartsMatch[2] || ''
  urlParts.port = urlPartsMatch[3] ? urlPartsMatch[3].substr(1) : 80
  urlParts.path = urlPartsMatch[4] || '/'
  var checkedUrl = urlParts.protocol + urlParts.host + (urlParts.port != 80 ? ':' + urlParts.port : '') + urlParts.path
  var client = http.createClient(urlParts.port, urlParts.host)
  client.on('error', function (err) {
    callback(err, checkedUrl)
  })
  var request = client.request('GET', urlParts.path, {'host': urlParts.host})
  request.end()
  request.on('response', function (response) {
    var err = !(response.statusCode in {'200': 200, '301': 301, '302': 302, '303': 303, '304': 304, '307': 307})
    callback(err, checkedUrl)
  })
}

console.log('Server running on port ' + port)
