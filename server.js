var http = require('http')
var url = require('url')
var mongo = require('mongodb')

var port = process.argv[2] || 8080
var ip = '127.0.0.1'

console.log('Starting server...')

var db = new mongo.Db('test', new mongo.Server('127.0.0.1', 27017, {}), {})
db.open(function() {
  db.collection('urls', function(err, collection) {
    http.createServer(function(req, res) {
      var url_parts = url.parse(req.url)

      switch(url_parts.pathname) {
        case '/':
      	  display_root(url_parts.pathname, req, res)
      	  break
        case '/list':
      	  display_list(url_parts.pathname, req, res)
      	  break
        default:
      	  display_404(url_parts.pathname, req, res)
      }

      function display_root(url, req, res) {
      	res.writeHead(200, {'Content-Type': 'text/html'})
      	res.end('root')
    	}

      function display_list(url, req, res) {
        var result = 'result:'
      	res.writeHead(200, {'Content-Type': 'text/html'})
      	collection.find({}, function(err, cursor) {
          cursor.toArray(function(err, items) {
            items.forEach(function(item) {
              result = result + ' ' + item.url
            })
            res.end(result)
          })
        })
    	}

      function display_404(url, req, res) {
      	res.writeHead(404, {'Content-Type': 'text/html'})
      	res.end('not found')
      }
    }).listen(port, ip)
  })
})

console.log('Server running at http://' + ip + ':' + port + '/')
