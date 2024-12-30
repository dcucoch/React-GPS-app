const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.NODE_ENV !== 'production' ? 'localhost': 'https://camion.navidadloprado.cl'
const port = process.env.PORT || 3005
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Store latest device location and tracking status
let deviceLocation = null
let isTracking = true
let lastError = null

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // Handle device location updates
      if (pathname === '/update-location' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            // Handle tracking being stopped
            if (!data.isTracking) {
              deviceLocation = null
              isTracking = false
              lastError = null
              res.writeHead(200)
              res.end(JSON.stringify({ success: true }))
              return
            }
            // Validate location data
            if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
              lastError = 'Invalid location format'
              throw new Error(lastError)
            }
            deviceLocation = {
              lat: data.lat,
              lng: data.lng,
              timestamp: Date.now(),
              isTracking: data.isTracking,
              error: null
            }
            // Update tracking status
            isTracking = data.isTracking
            lastError = null
            res.writeHead(200)
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: lastError || 'Invalid location data' }))
          }
        })
        return
      }

      // Handle location requests
      if (pathname === '/get-location') {
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        })
        if (!isTracking) {
          res.end(JSON.stringify({ isTracking: false, error: lastError }))
          return
        }
        res.end(JSON.stringify(deviceLocation || { error: lastError || 'No location data available' }))
        return
      }

      if (pathname === '/a') {
        await app.render(req, res, '/a', query)
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query)
      } else {
        await handle(req, res, parsedUrl)
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      lastError = err.message || 'Internal server error'
      res.statusCode = 500
      res.end(JSON.stringify({ error: lastError }))
    }
  })

  server.once('error', (err) => {
    console.error(err)
    lastError = err.message || 'Server initialization error'
    process.exit(1)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})