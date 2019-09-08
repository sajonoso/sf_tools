/* 2> nul:
@echo off
setlocal
set CURRENTPATH=%CD%
node %0
goto :eof
*/

/*
 AUTHOR: sajonoso
 SOURCE: https://github.com/sajonoso/sf_tools
 DESCRIPTION: Single file application that allows you to transfer files between computers
 Under windows this can be made into a self executing batch file by renaming from .js to .cmd
 No dependancies required
*/

// const HTTP_PORT = 443;
const HTTP_PORT = 80;
const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Common mime types. First one is the default

/* beautify preserve:start */
const MIME_TYPES = [
  { ext: 'bin', type: 'application/octet-stream' },
  { ext: 'txt', type: 'text/plain' },
  { ext: 'ks', type: 'text/plain' },
  { ext: 'html', type: 'text/html' },
  { ext: 'htm', type: 'text/html' },
  { ext: 'js', type: 'text/javascript' },
  { ext: 'css', type: 'text/css' },
  { ext: 'json', type: 'application/json' },
  { ext: 'png', type: 'image/png' },
  { ext: 'jpg', type: 'image/jpg' },
  { ext: 'gif', type: 'image/gif' },
  { ext: 'wav', type: 'audio/wav' },
  { ext: 'ogg', type: 'audio/ogg' },
  { ext: 'mp3', type: 'audio/mp3' },
  { ext: 'm4a', type: 'audio/mp4' },
  { ext: 'mp4', type: 'video/mp4' },
]
/* beautify preserve:end */


/*
Certificate generated with:
(windows)
openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 3650 -subj '//C=AU\ST=New South Wales\L=Sydney\CN=localhost' -passout pass:thepass -keyout localhost.key -out localhost.crt
(linux)
openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 3650 -subj '/C=AU/ST=New South Wales/L=Sydney/CN=localhost' -passout pass:thepass -keyout localhost.key -out localhost.crt

Set Chrome flag to allow self signed certificate
chrome://flags/#allow-insecure-localhost
*/

const cert_pem = function () {
  /*
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
  */
};

const key_pem = function () {
  /*
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
  */
};

const UPLOAD_FORM_HTML = function () {
  /*
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8">

  <title>Node File Transfer App</title>
  <meta name="description" content="Node File Transfer App">
  <meta name="author" content="sajonoso">

  <!-- <link rel="stylesheet" href="simple_dragdrop.css?v=1.0"> -->
  <style>
    body {
      font-family: arial
    }
    body > h2 {
      text-align: center;
    }
    .sdd_uploading, .sdd_success, .sdd_error { display: none }
    form.dragdrop_uploader {
      width: 320px;
      height: 200px;
      background-color: lightgrey;
      margin: 0 auto;
      padding: 20px 30px;
    }
    form.dragdrop_uploader > .sdd_input.has-advanced-upload {
      width: 320px;
      height: 200px;
      background-color: lightblue;
      border: 1px dashed black;
      text-align: center;
    }
    form.dragdrop_uploader > .sdd_input.has-advanced-upload.is-dragover {
      background-color: #5dc3e4;
      border: 1px solid black;
    }
  </style>
</head>

<body>
  <h2>File Transfer Page</h2>
  <h3>Upload</h3>
  <form class="dragdrop_uploader" method="post" action="" enctype="multipart/form-data">
    <div class="sdd_input">
      <input class="sdd_file" type="file" name="files[]" id="file" /> <!-- data-multiple-caption="{count} files selected" -->
      <div class="sdd_label" for="file"><strong>Choose a file</strong><span class="sdd_dragndrop"> or drag it here</span>.</div>
      <button class="sdd_button" type="submit">Upload</button>
    </div>
    <div class="sdd_uploading">Uploading!</div>
    <div class="sdd_success">Done!</div>
    <div class="sdd_error">Error!<span></span>.</div>
  </form>
  <h3>Download</h3>
  <div>
  Files in current directory<br/>
  ##FILE_LIST##
  </div>

  <script>
    // reference: https://css-tricks.com/examples/DragAndDropFileUploading/ 
    const SimpleDD = function (formClassName) {
      const SDD_PREFIX = 'sdd'

      const dropTargetForm = document.querySelectorAll('.' + formClassName)[0]
      const dropTarget = dropTargetForm.querySelectorAll('.' + SDD_PREFIX + '_input')[0]
      const label = dropTarget.querySelector('.' + SDD_PREFIX + '_label')
      const fileInput = dropTarget.querySelector('input[type="file"]')

      const isSupportDragDrop = function () {
        var div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window &&
          'FileReader' in window;
      }();

      const showFiles = function (files) {
        label.textContent = files.length > 1 ? (fileInput.getAttribute('data-multiple-caption') || '').replace(
          '{count}', files.length) : files[0].name;
      }

      fileInput.addEventListener('change', function (e) {
        showFiles(e.target.files);
      });

      if (isSupportDragDrop) {
        dropTarget.classList.add('has-advanced-upload');

        ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach(function (event) {
          dropTarget.addEventListener(event, function (e) {
            // preventing the unwanted behaviours
            e.preventDefault();
            e.stopPropagation();
          });
        });
        ['dragover', 'dragenter'].forEach(function (event) {
          dropTarget.addEventListener(event, function () {
            dropTarget.classList.add('is-dragover');
          });
        });
        ['dragleave', 'dragend', 'drop'].forEach(function (event) {
          dropTarget.addEventListener(event, function () {
            dropTarget.classList.remove('is-dragover');
          });
        });
        dropTarget.addEventListener('drop', function (e) {
          droppedFiles = e.dataTransfer.files; // the files that were dropped
          fileInput.files = e.dataTransfer.files;
          showFiles(droppedFiles);
        });
      }

    }
  </script>
  <script>
    new SimpleDD('dragdrop_uploader')
  </script>
</body>

</html>  
  */
}

const getText = function (fn) {
  var rawText = fn.toString()
  return rawText.slice(rawText.indexOf('/*') + 4, rawText.indexOf('*/') - 4)
}

const dateFormat = function (dateObj, format) {
  if (!format) return ''

  const hour24 = dateObj.getHours()
  let hour12 = hour24 > 12 ? hour24 - 12 : hour24
  if (!hour12) hour12 = 12
  const amPm = hour24 > 12 ? 'pm' : 'am'
  const pad2 = num => "00".concat(num).slice(-2)

  return format.replace("YYYY", dateObj.getFullYear())
    .replace("MM", pad2(dateObj.getMonth() + 1))
    .replace("DD", pad2(dateObj.getDay() + 1))
    .replace("HH", pad2(hour24))
    .replace("hh", pad2(hour12))
    .replace("mm", pad2(dateObj.getMinutes()))
    .replace("ss", pad2(dateObj.getSeconds()))
    .replace("a", amPm)
}

const https_options = {
  passphrase: 'thepass',
  key: getText(key_pem), // fs.readFileSync('key.pem'),
  cert: getText(cert_pem) // fs.readFileSync('cert.pem')
};


const getFileList = function () {
  const fileList = fs.readdirSync('./', {
    withFileTypes: true
  })

  var fileLinks = 'None<br/>'
  if (fileList && fileList.length > 0) {
    const tmpfileLinks = []
    fileList.forEach(function (dirEnt) {
      if (!dirEnt.isDirectory()) {
        const fileLink = '<a href="' + dirEnt.name + '">' + dirEnt.name + '</a><br/>'
        tmpfileLinks.push(fileLink)
      }
    })
    fileLinks = tmpfileLinks.join('')
  }

  return fileLinks
}

const showMainForm = function (res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })
  var upload_form = getText(UPLOAD_FORM_HTML)
  upload_form = upload_form.replace('##FILE_LIST##', getFileList());
  res.end(upload_form, 'utf-8');
}

const StreamFile = function (res, fileName, contentType) {
  res.writeHead(200, {
    'Content-Type': contentType
  })
  var readStream = fs.createReadStream(fileName);

  readStream.on('data', function(chunk) {
      res.write(chunk, 'binary');
  }).on('end', function(chunk) {
      res.end(chunk, 'binary');
      console.log('Done sending: ' + fileName)
  });  
}


const handleGET = function (req, res) {
  const urlparts = req.url.split('?')
  var filePath = '.' + urlparts[0]
  if (filePath == './') return showMainForm(res)

  var extname = path.extname(filePath)
  var contentType = MIME_TYPES[0].type;
  var typeMatched = MIME_TYPES.filter(function (item) {
    return ('.' + item.ext) === extname;
  })
  if (typeMatched && typeMatched.length === 1) contentType = typeMatched[0].type

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, {
      'Content-Type': 'text/html'
    })
    res.end('<html><body>Page not found</body></html>', 'utf-8')
    return
  }

  StreamFile(res, filePath, contentType)
}

const getMultiPartSingleFilename = function (header) {
  const nameStartCheck = header.indexOf('filename="')
  if (nameStartCheck > 0) {
    const nameStart = nameStartCheck + 'filename="'.length
    const nameEnd = header.indexOf('"', nameStart)
    return header.slice(nameStart, nameEnd)
  }
  return '';
}

const getMultiPart1Details = function (chunk) {
  const header = chunk.toString()
  const sectionParts = header.split('\r\n')
  const boundaryEnd = Buffer.from('\r\n' + sectionParts[0] + '--')
  const endPositionTest = chunk.indexOf(boundaryEnd)
  const endPosition = endPositionTest >= 0 ? endPositionTest : chunk.length
  const headerEnd = header.indexOf('\r\n\r\n') + 4

  var filename = getMultiPartSingleFilename(header)
  if (!filename) filename = (Math.random() * 1000000).toString(36) // os.tmpdir()

  /* beautify preserve:start */
  return { boundaryEnd, headerEnd, endPosition, filename }
  /* beautify preserve:end */
}

const handlePOST = function (req, res) {
  var tmpFileName = ''
  var tmpFile = null
  var count = 0;
  var boundaryEnd = ''
  var endPosition = -1

  req.on('data', function (chunk) {
    endPosition = boundaryEnd ? chunk.indexOf(boundaryEnd) : chunk.length

    if (0 === count) {
      const p1 = getMultiPart1Details(chunk)
      boundaryEnd = p1.boundaryEnd
      console.log('Writing file: ' + p1.filename);
      tmpFile = fs.openSync('./' + p1.filename, 'as')
      fs.writeSync(tmpFile, chunk.slice(p1.headerEnd, p1.endPosition))
    } else {
      if (endPosition >= 0) {
        console.log('endPosition = ' + endPosition);
        fs.writeSync(tmpFile, chunk.slice(0, endPosition))
      } else {
        fs.writeSync(tmpFile, chunk)
      }
    }
    count++;
  });
  req.on('end', function () {
    if (tmpFile) fs.closeSync(tmpFile)
    showMainForm(res)
  });

}

const router = function (request, response) {
  const requestMethod = request.method
  console.log(dateFormat(new Date(), "YYYY-MM-DD HH:mm:ss ") + requestMethod + ' ' + request.url)

  if ('GET' === requestMethod) handleGET(request, response)
  if ('POST' === requestMethod) handlePOST(request, response)
}

if (HTTP_PORT === 443) {
  https.createServer(https_options, router).listen(HTTP_PORT)
} else {
  http.createServer(router).listen(HTTP_PORT)
}

const getIP = function () {
  const networkInterfaces = os.networkInterfaces()
  var ipList = []
  for (var addresses of Object.values(networkInterfaces)) {
    for (var add of addresses) {
      if ('127.0.0.1' !== add.address && 'IPv4' === add.family) {
        ipList.push(add.address)
      }
    }
  }
  return ipList
}


console.log('Server running at ' + (HTTP_PORT === 443 ? 'HTTPS' : 'HTTP') + '://localhost:' + HTTP_PORT + '/' +
  '\nlocalhost IP is: ' + getIP().join(', '))
