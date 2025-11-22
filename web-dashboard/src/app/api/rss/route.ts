import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'

// Simple authentication check
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }
  
  const credentials = authHeader.split(' ')[1]
  const decoded = Buffer.from(credentials, 'base64').toString('utf-8')
  const [username, password] = decoded.split(':')
  
  return username === 'admin' && password === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Connect to Redis to get RSS feed data
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    
    await redisClient.connect()
    
    try {
      // Get RSS monitoring feeds from Redis (monitor:* keys)
      const monitorKeys = await redisClient.keys('monitor:*')
      const feeds = []
      
      for (const key of monitorKeys) {
        if (!key.includes(':sent') && !key.includes(':lastCheck')) {
          try {
            const config = await redisClient.hGetAll(key)
            const lastCheck = await redisClient.get(`${key}:lastCheck`)
            
            feeds.push({
              url: config.url || '',
              title: config.type === 'github' ? 'GitHub Feed' : 'RSS Feed',
              status: lastCheck ? 'active' : 'pending',
              lastUpdate: lastCheck ? new Date(parseInt(lastCheck)).toISOString() : new Date().toISOString(),
              itemCount: 0, // Could be enhanced to track item counts
              type: config.type || 'rss',
              channelId: config.channelId || ''
            })
          } catch (keyError) {
            console.warn(`Failed to get config for key ${key}:`, keyError.message)
          }
        }
      }
      
      return NextResponse.json(feeds)
    } finally {
      await redisClient.quit()
    }
  } catch (error) {
    console.error('RSS API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSS feeds' },
      { status: 500 }
    )
  }
}