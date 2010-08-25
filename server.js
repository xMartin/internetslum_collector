var http = require('http')
var url = require('url')
var querystring = require('querystring')
var fs = require('fs')
var mustache = require('mustache')
var mongo = require('mongodb')

var port = process.argv[2] || 8080
var ip = '127.0.0.1'

console.log('Starting server...')

new mongo.Db('test', new mongo.Server('127.0.0.1', 27017, {}), {}).open(function(err, db) {
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
          display_404()
      }

      function display_root() {
        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end('root')
      }

      function display_list() {
        res.writeHead(200, {'Content-Type': 'text/html'})
        collection.find({}, function(err, cursor) {
          cursor.fetchAllRecords(function(err, items) {
            fs.readFile('./templates/list.html', 'utf8', function(err, template) {
              res.end(mustache.to_html(template, { list: items }))
            })
          })
        })
      }

      function display_add() {
        res.writeHead(200, {'Content-Type': 'text/html'})
        var params = querystring.parse(url_parts.query)
        if (params.url) {
          var doc = { url: params.url }
          collection.insert(doc, function() {
            res.end('url added to the internet slum')
            return
          })
        }
        res.end('invalid')
      }

      function display_404() {
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.end('not found')
      }
    }).listen(port, ip)
  })
})

console.log('Server running at http://' + ip + ':' + port + '/')
