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

    // Connect to Redis to get command statistics
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    
    await redisClient.connect()
    
    try {
      // Get command usage statistics from Redis hash
      const commands = await redisClient.hGetAll('bot:command_stats') || {}
      const commandList = Object.entries(commands).map(([name, count]) => ({
        name,
        count: parseInt(count) || 0
      })).sort((a, b) => b.count - a.count)
      
      // Calculate percentages
      const totalCount = commandList.reduce((sum, cmd) => sum + cmd.count, 0)
      const commandsWithPercentages = commandList.map(cmd => ({
        ...cmd,
        percentage: totalCount > 0 ? Math.round((cmd.count / totalCount) * 100) : 0
      }))
      
      return NextResponse.json(commandsWithPercentages)
    } finally {
      await redisClient.quit()
    }
  } catch (error) {
    console.error('Commands API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commands' },
      { status: 500 }
    )
  }
}