var http = require('http')
var url = require('url')

var port = process.argv[2] || 8080
var ip = '127.0.0.1'

http.createServer(function(req, res) {
  var url_parts = url.parse(req.url)

  switch(url_parts.pathname) {
    case '/':
  	  display_root(url_parts.pathname, req, res)
  	  break
    case '/edit':
  	  display_edit(url_parts.pathname, req, res)
  	  break
    default:
  	  display_404(url_parts.pathname, req, res)
  }

  function display_root(url, req, res) {
  	res.writeHead(200, {'Content-Type': 'text/html'})
  	res.end('root')
	}

  function display_edit(url, req, res) {
  	res.writeHead(200, {'Content-Type': 'text/html'})
  	res.end('edit')
	}

  function display_404(url, req, res) {
  	res.writeHead(404, {'Content-Type': 'text/html'})
  	res.end('not found')
  }

}).listen(port, ip)

console.log('Server running at http://' + ip + ':' + port + '/')
