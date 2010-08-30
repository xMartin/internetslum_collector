var sys = require('sys')
var http = require('http')
var url = require('url')
var querystring = require('querystring')
var fs = require('fs')
var mustache = require('mustache')
var mongodb = require('mongodb')

var port = process.argv[2] || 8080

console.log('Starting server...')

// load partial templates
var partials = {}
;['header', 'footer'].forEach(function(name) {
  partials[name] = fs.readFileSync('./templates/' + name + '.html', 'utf8')
})
// load templates
var templates = {}
;['index', 'list', 'add'].forEach(function(name) {
  templates[name] = fs.readFileSync('./templates/' + name + '.html', 'utf8')
})
// load stylesheet
var stylesheet = fs.readFileSync('./style.css', 'utf8')

new mongodb.Db('internetslum_collector', new mongodb.Server('localhost', 27017, {}), {}).open(function(err, db) {
  db.collection('urls', function(err, collection) {
    http.createServer(function(req, res) {
      var url_parts = url.parse(req.url)

      switch(url_parts.pathname) {
        case '/':
          display_root()
          break
        case '/list':
          display_list()
          break
        case '/add':
          display_add()
          break
        case '/style.css':
          res.writeHead(200, {'Content-Type': 'text/css'})
          res.end(stylesheet)
          break
        default:
          if (url_parts.pathname.indexOf(/files/) == 0) {
            display_file(url_parts.pathname.substr(7))
          }
          else {
            display_404()
          }
      }

      function display_root() {
        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end(mustache.to_html(templates['index'], {}, partials))
      }

      function display_list() {
        res.writeHead(200, {'Content-Type': 'text/html'})
        collection.find({}, function(err, cursor) {
          cursor.fetchAllRecords(function(err, items) {
            items.forEach(function(item) {
              item.formattedDate =
                item.date.getDate() + '.' + item.date.getMonth() + '.' + item.date.getFullYear() + ', '
                + item.date.getHours() + ':' + item.date.getMinutes()
            })
            res.end(mustache.to_html(templates['list'], { list: items }, partials))
          })
        })
      }

      function display_add() {
        res.writeHead(200, {'Content-Type': 'text/html'})
        var templateTags = {
          formAction: '',
          formMethod: 'GET',
          userNameInputLabel: 'User name:',
          userNameInputName: 'username',
          urlInputLabel: 'URL:',
          urlInputName: 'url'
        }
        var params = querystring.parse(url_parts.query)
        if (params.url) {
          setTimeout(function() {
            checkUrl(params.url, function(err, url) {
              if (!err) {
                var doc = { username: params.username, url: url, date: new Date() }
                collection.insert(doc, function() { sys.log('Added URL `' + url + '`.') })
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
          res.end(mustache.to_html(templates['add'], templateTags, partials))
        }
      }

      function display_file(path) {
        res.writeHead(200)
        fs.readFile('./files/' + path, function(err, file) {
          if (err) {
            display_404()
            return
          }
          res.end(file)
        })
      }

      function display_404() {
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.end('not found')
      }
    }).listen(port)
  })
})

function checkUrl(url, callback) {
  var urlPartsMatch = /(https?\:\/\/)?([^\:\/]*)(\:\d+)?(\/.*)?/.exec(url)
  var urlParts = {}
  urlParts.protocol = urlPartsMatch[1] || 'http://'
  urlParts.host = urlPartsMatch[2] || ''
  urlParts.port = urlPartsMatch[3] ? urlPartsMatch[3].substr(1) : 80
  urlParts.path = urlPartsMatch[4] || '/'
  checkedUrl = urlParts.protocol + urlParts.host + (urlParts.port != 80 ? ':' + urlParts.port : '') + urlParts.path
  var client = http.createClient(urlParts.port, urlParts.host)
  client.on('error', function (err) {
    callback(err, checkedUrl)
  })
  var request = client.request('GET', urlParts.path, {'host': urlParts.host})
  request.end()
  request.on('response', function (response) {
    var err = !(response.statusCode in {'200': 200, '302': 302, '303': 303})
    callback(err, checkedUrl)
  })
}

console.log('Server running on port ' + port)
