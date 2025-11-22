import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'

// Simple authentication check
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }
  
  // Basic auth check - you can customize credentials
  const credentials = authHeader.split(' ')[1]
  const decoded = Buffer.from(credentials, 'base64').toString('utf-8')
  const [username, password] = decoded.split(':')
  
  // Simple check - replace with your preferred auth
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

    // Connect to Redis to get bot stats
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    
    await redisClient.connect()
    
    try {
      // Get bot statistics from Redis
      const botStartTime = await redisClient.get('bot:startTime') || Date.now().toString()
      
      // Get command stats hash to count total commands executed
      const commandStats = await redisClient.hGetAll('bot:command_stats') || {}
      const commandsExecuted = Object.values(commandStats).reduce((sum, count) => sum + parseInt(count || '0'), 0)
      
      // Count RSS monitoring feeds
      const monitorKeys = await redisClient.keys('monitor:*')
      const rssFeeds = monitorKeys.filter(key => !key.includes(':sent') && !key.includes(':lastCheck')).length
      
      // Calculate uptime
      const uptime = Math.floor((Date.now() - parseInt(botStartTime)) / 1000)
      
      const stats = {
        uptime,
        commandsExecuted,
        rssFeeds,
        errorsCount: 0, // Could be enhanced to track errors
        lastActivity: Date.now()
      }
      
      return NextResponse.json(stats)
    } finally {
      await redisClient.quit()
    }
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}