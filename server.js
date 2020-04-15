const crypto = require('crypto')
const { spawn } = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

//const dotenv = fs.readFileSync(path.join(__dirname, '.env'), { encoding: 'utf8' })
//process.env = { ...process.env, ...dotenv }

const port = process.env.PORT || 6000
const secret = process.env.PYKE_SECRET

const server = http.createServer((req, res) => {
  console.log('[Pyke] Received request.')

  res.writeHead(400, { 'Content-Type': 'application/json' })

  if (req.method !== 'POST') {
    return res.end(JSON.stringify({ error: 'Invalid request' }))
  }

  let jsonString = ''
  req.on('data', data => jsonString += data)

  req.on('end', () => {
    try {
      const hash = 'sha1=' + crypto.createHmac('sha1', secret).update(jsonString).digest('hex') 
      if (hash !== req.headers['x-hub-signature']) {
        console.log('[Pyke] Received invalid github signature.')
        return res.end(JSON.stringify({ error: 'Invalid key' }))
      }

      const pyke = spawn(`${__dirname}/pyke`)
      pyke.stdout.on('data', data => {
        const buff = new Buffer(data)
        console.log(buff.toString('utf-8'))
      })

      res.writeHead(400, { 'Content-Type': 'application/json' })

      return res.end(JSON.stringify({ success: true }))
    } catch (err) {
      console.error(err)
      return res.end(JSON.stringify({ error: 'Internal server error' }))
    }
  })
})

server.listen(port, () => console.log(`Pyke hook listening on port ${port}`))

