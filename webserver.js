/* 2> nul:
@echo off
setlocal
set CURRENTPATH=%CD%
R:\programs\node\node %0
goto :eof
*/

/*
 DESCRIPTION: Simple static file web server.
 Under windows this can be made into a self executing batch file by renaming from .js to .cmd
*/

// const HTTP_PORT = 443;
const HTTP_PORT = 80;
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// common mime types first one is the default
const MIME_TYPES = [
  {ext: 'bin', type: 'application/octet-stream'}, 
  {ext: 'txt', type: 'text/plain'},
  {ext: 'ks', type: 'text/plain'},
  {ext: 'html', type: 'text/html'},
  {ext: 'htm', type: 'text/html'},
  {ext: 'js', type: 'text/javascript'},
  {ext: 'css', type: 'text/css'},
  {ext: 'json', type: 'application/json'},
  {ext: 'png', type: 'image/png'},
  {ext: 'jpg', type: 'image/jpg'},
  {ext: 'gif', type: 'image/gif'},
  {ext: 'wav', type: 'audio/wav'},
  {ext: 'ogg', type: 'audio/ogg'},
  {ext: 'mp3', type: 'audio/mp3'},
  {ext: 'm4a', type: 'audio/mp4'},
  {ext: 'mp4', type: 'video/mp4'},
]

/*
Certificate generated with:
(windows)
openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 3650 -subj '//C=AU\ST=New South Wales\L=Sydney\CN=localhost' -passout pass:thepass -keyout localhost.key -out localhost.crt
(linux)
openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 3650 -subj '/C=AU/ST=New South Wales/L=Sydney/CN=localhost' -passout pass:thepass -keyout localhost.key -out localhost.crt

Set Chrome flag to allow self signed certificate
chrome://flags/#allow-insecure-localhost
*/

var cert_pem = function () {/*
-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIJAM9YN4GZJJZcMA0GCSqGSIb3DQEBCwUAMEwxCzAJBgNV
BAYTAkFVMRgwFgYDVQQIDA9OZXcgU291dGggV2FsZXMxDzANBgNVBAcMBlN5ZG5l
eTESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTE5MDQyNzEyMjIyNFoXDTI5MDQyNDEy
MjIyNFowTDELMAkGA1UEBhMCQVUxGDAWBgNVBAgMD05ldyBTb3V0aCBXYWxlczEP
MA0GA1UEBwwGU3lkbmV5MRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQDvKi3JlTdseb9hFe2K17Isptx2TtGPNbYIrKsS
Ya50k8eWwsFrfOe/gBWIwZtyVeAfrVWv1VFyomlrSAvTarTXahPv+tGibuQBs1Qy
8gJlrmnMcyJk8PVxNJtkdjWwKwgwMxUDS1wbSwzBa4WN84iQcWnundI6fKEMNZZX
+IXn3+5h3e+XZ9camRTXq3pW6IwuDRvkSnsA5cENgD7VIXGvgPwhazGPulyWigJY
tGxfaYGV/akWNuXCg6JmNUe6j7GHmhFI8QswWfsb6wFirt+Ig7RYKTJP4IbAgSiR
+1YoGv2g6UhQ5I6ltElNWLVOMAZ8ZaE5/h0WaPQv8J7EDRkfAgMBAAGjUDBOMB0G
A1UdDgQWBBSt5KMA6lfe6OCuT2P2u01prBoTDjAfBgNVHSMEGDAWgBSt5KMA6lfe
6OCuT2P2u01prBoTDjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCb
hSxrp1yQluB6R1aVyjSdj8O26Jliju/XGXhFBSDSIIDWt5LNaGOBKFAWtkEZZ7aL
JUz+JtNMX4OebpXiq/zWprXQKKcfrif84eYqTvS7dSHTU1sImjF3gsmeZvv/UAtn
X7bFlsF/k7iDElCQLQIqhVORTh1SgpuyknD5uLR4w2LRZsqzJWK1dmy96AWPGTj8
ldzcRqA902vzYK3sBnuReV/uwykHDw0xcgp5HyYRGz5KzLEiOuMHrPCflcarawFF
x1jHpjVqQ/lE9mBv9GMxrvvP+nsUPmd+S01MexVZWm2ZGb4h8yshwNdCr/s54W4E
Gl6l9nD1K5Gr8EeOyayS
-----END CERTIFICATE-----
*/};

var key_pem = function () {/*
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDvKi3JlTdseb9h
Fe2K17Isptx2TtGPNbYIrKsSYa50k8eWwsFrfOe/gBWIwZtyVeAfrVWv1VFyomlr
SAvTarTXahPv+tGibuQBs1Qy8gJlrmnMcyJk8PVxNJtkdjWwKwgwMxUDS1wbSwzB
a4WN84iQcWnundI6fKEMNZZX+IXn3+5h3e+XZ9camRTXq3pW6IwuDRvkSnsA5cEN
gD7VIXGvgPwhazGPulyWigJYtGxfaYGV/akWNuXCg6JmNUe6j7GHmhFI8QswWfsb
6wFirt+Ig7RYKTJP4IbAgSiR+1YoGv2g6UhQ5I6ltElNWLVOMAZ8ZaE5/h0WaPQv
8J7EDRkfAgMBAAECggEBAI63mMMmLACrVizVLP8hX82NdRmURzEyWAItJ5i8eaJP
XVb1uP4vdwurny4QenZsEGZWxT88CHJjwIyoXYY3stqpDmSyQ86uZZkuLhyIli2f
OrsqKWga8hwvzFrSv4703toEYZGpsrkGvAHf676diOzJAPHHc+A65s+mWqT8RMvs
ibcdGgHl1ZR8l4iPXmW9Fb8bCTl/8m22ABP6BNyEiKk/R7N6FgjYOVYDqbpvF8mz
to35AQ5VgtgCY7H9j+KTEy7Bm4ZSUGvx9/sB3nCr/PdjhTuQcXew/ZnlYi1vfl8D
DW+kXX49CxFk7a9NQvIWFEEduknrV4LsZwOyKRa3haECgYEA+zAmugl7MhzKjRuC
VdIFzJLFKwcBh7xTDajlvUwOsaxyYEgDy2FITsh9CLvu5E/Qq3vh1pMVEORRT+6D
vZyKxuDToIndti8b7Nq1QEwGRIUy+L7oMyykfMmI5y9um0nduGJ1pY2P6tlszoEp
DU5oma38TZc+vQQCxkTmWqQJ3XUCgYEA878QaRCOkbRzkTS+qNhju9W35qzjspUw
wuGDYVAJG021Lz8d3Wdawx0emTc5ncnR98olXA+Db/ivxWmSeR9+CCYTfBWgoOxi
ZkCfL/XwZBwA65LT7xYFkWUogwklnnfnQOE5qD6dL9b2V4AM3otihewDL+xW/zPq
Q7PWNRb5pcMCgYEAzTm9GlhuwDXHw9xK86VBua/cydfShzz1un5ZHf1LMB0N4d5U
w1E7S6sAhSdO+li/y6vOi4rmNkPkr2LXXg7NT8oW/d5GN/hrX2wdlGfI4yjUyWjo
vA7oYVAju4cEXnnOXjyLlHSBtkZoYJwkl0uNqKn/LsG4r6PcRHO8pSfLK5UCgYBe
Z6cMelwttM159QrPTJg8PQdwMZAzL7NmF4ASJbSRPaSqOvDvOsOdhF7AivIm2e8X
4NRddqi6qoAxnrUbcoYW0+CCE8JV8Zge8HJ3WfMUYwA8PW8WT9oyORLaxaUrXldT
+qehMTciO0jIFRFm9GdhZUrKuefsCgh21mVlxJNGjwKBgAUGLOYFjCkPf794L4bl
djs0FVD3lKt0T3fuH4qt2nwzqInZCASpvugUjYU4U+f595C+384BifN52LqCB8Rd
BSKA7EHgo18vwwkDq7zPMclxAp368OPZZQ81Hi1ooiLjoWtyFjHTUA6s2/sPiKHZ
H4NZ2/TOSYrhf+yTiObyAxPI
-----END PRIVATE KEY-----
*/};

const getText = function(fn) {
  var rawText = fn.toString()
  return rawText.slice(rawText.indexOf('/*') + 2, rawText.length - 3)
}

const dateFormat = function(dateObj, format) {
  if (!format) return ''

  const hour24 = dateObj.getHours()
  let hour12 = hour24 > 12 ? hour24 - 12 : hour24
  if (!hour12) hour12 = 12
  const amPm = hour24 > 12 ? 'pm' : 'am'
  const pad2 = num => "00".concat(num).slice(-2)

  return format.replace("YYYY", dateObj.getFullYear() )
    .replace("MM", pad2(dateObj.getMonth()+1) )
    .replace("DD", pad2(dateObj.getDay()+1) )
    .replace("HH", pad2(hour24) )
    .replace("hh", pad2(hour12) )
    .replace("mm", pad2(dateObj.getMinutes()) )
    .replace("ss", pad2(dateObj.getSeconds()) )
    .replace("a", amPm )
}

const https_options = {
  passphrase: 'thepass',
  key: getText(key_pem), // fs.readFileSync('key.pem'),
  cert: getText(cert_pem) // fs.readFileSync('cert.pem')
};

const router = function (request, response) {
  console.log(dateFormat(new Date(), "YYYY-MM-DD HH:mm:ss ") + request.method + ' ' + request.url)

  const urlparts = request.url.split('?')
  var filePath = '.' + urlparts[0]
  if (filePath == './') filePath = './index.html'

  var extname = path.extname(filePath)
  var contentType = MIME_TYPES[0].type;
  var typeMatched = MIME_TYPES.filter(function(item) { return ('.'+item.ext) === extname; })
  if (typeMatched && typeMatched.length === 1) contentType = typeMatched[0].type

  fs.readFile(filePath, function (error, content) {
    if (error) {
      if (error.code == 'ENOENT') {
        response.writeHead(404, { 'Content-Type': 'text/html' })
        response.end('<html><body>Page not found</body></html>', 'utf-8')
      } else {
        response.writeHead(500)
        response.end('internal error. error code: ' + error.code + ' ..\n')
        response.end()
      }
    } else {
      response.writeHead(200, {
        'Content-Type': contentType
      })
      response.end(content, 'utf-8');
    }
  })
}

if (HTTP_PORT===443) {
  https.createServer(https_options, router).listen(HTTP_PORT)
} else {
  http.createServer(router).listen(HTTP_PORT)
}

console.log('Server running at ' + (HTTP_PORT === 443 ? 'HTTPS' : 'HTTP') + '://localhost:' + HTTP_PORT + '/')
