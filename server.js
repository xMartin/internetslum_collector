var http = require('http')
var url = require('url')
var querystring = require('querystring')
var fs = require('fs')
var mustache = require('mustache')
var mongodb = require('mongodb')

var port = process.argv[2] || 8080

console.log('Starting server...')

var partials = {}
new Array('header', 'footer').forEach(function(name) {
  partials[name] = fs.readFileSync('./templates/' + name + '.html', 'utf8')
})

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
        fs.readFile('./templates/index.html', 'utf8', function(err, template) {
          res.end(mustache.to_html(template, {}, partials))
        })
      }

      function display_list() {
        res.writeHead(200, {'Content-Type': 'text/html'})
        collection.find({}, function(err, cursor) {
          cursor.fetchAllRecords(function(err, items) {
            fs.readFile('./templates/list.html', 'utf8', function(err, template) {
              items.forEach(function(item) {
                item.formattedDate =
                  item.date.getDate() + '.' + item.date.getMonth() + '.' + item.date.getFullYear() + ', '
                  + item.date.getHours() + ':' + item.date.getMinutes()
              })
              res.end(mustache.to_html(template, { list: items }, partials))
            })
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
          var doc = { username: params.username, url: params.url, date: new Date() }
          collection.insert(doc, function() {
            render('url added to the internet slum')
          })
        }
        else {
          render()
        }

        function render(message) {
          templateTags.message = message || ''
          fs.readFile('./templates/add.html', 'utf8', function(err, template) {
            res.end(mustache.to_html(template, templateTags, partials))
          })
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

console.log('Server running on port ' + port)
