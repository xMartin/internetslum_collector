var http = require('http')

var port = process.argv[2] || 8080
var ip = '127.0.0.1'

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('Internetslum\n')
}).listen(port, ip)

console.log('Server running at http://' + ip + ':' + port + '/')
