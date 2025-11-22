'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import StatsCard from './StatsCard'
import CommandsChart from './CommandsChart'
import RSSFeeds from './RSSFeeds'
import LogViewer from './LogViewer'
import LoginModal from './LoginModal'
import { BotStats, Command, RSSFeed, LogEntry } from '@/types'

export default function Dashboard() {
  const [stats, setStats] = useState<BotStats | null>(null)
  const [commands, setCommands] = useState<Command[]>([])
  const [rssFeeds, setRssFeeds] = useState<RSSFeed[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({})

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const credentials = btoa(`${username}:${password}`)
    const headers = { 'Authorization': `Basic ${credentials}` }
    
    try {
      const response = await fetch('/api/stats', { headers })
      if (response.ok) {
        setAuthHeaders(headers)
        setIsAuthenticated(true)
        setAuthError(null)
        return true
      } else if (response.status === 401) {
        setAuthError('Invalid credentials')
      } else {
        setAuthError('Authentication failed')
      }
      return false
    } catch (error) {
      setAuthError('Network error occurred')
      return false
    }
  }

  const fetchData = async () => {
    try {
      const [statsRes, commandsRes, rssRes, logsRes] = await Promise.all([
        fetch('/api/stats', { headers: authHeaders }),
        fetch('/api/commands', { headers: authHeaders }),
        fetch('/api/rss', { headers: authHeaders }),
        fetch('/api/logs?limit=50', { headers: authHeaders })
      ])

      if (!statsRes.ok || !commandsRes.ok || !rssRes.ok || !logsRes.ok) {
        if (statsRes.status === 401) {
          setIsAuthenticated(false)
          setAuthError('Session expired. Please login again.')
          return
        }
        throw new Error('Failed to fetch data')
      }

      const [statsData, commandsData, rssData, logsData] = await Promise.all([
        statsRes.json(),
        commandsRes.json(),
        rssRes.json(),
        logsRes.json()
      ])

      setStats(statsData)
      setCommands(commandsData)
      setRssFeeds(rssData)
      setLogs(logsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
      const interval = setInterval(fetchData, 10000) // Update every 10 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, authHeaders])

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ background: '#1e1a3f' }}>
        <LoginModal 
          isOpen={true} 
          onLogin={handleLogin} 
          error={authError || undefined} 
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1a3f' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#8b5cf6' }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1a3f' }}>
        <div className="text-red-400 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 text-white rounded hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1e1a3f' }}>
      <header className="shadow-lg" style={{ background: 'linear-gradient(to bottom, #2a2660cc, transparent)' }}>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" 
                 style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              🎬
            </div>
            <h1 className="text-4xl font-bold text-white">
              Finn - Streamyfin Bot Dashboard
            </h1>
          </div>
          <button 
            onClick={() => {
              setIsAuthenticated(false)
              setAuthHeaders({})
              setAuthError(null)
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="🟢 Finn Status"
              value={stats ? "ONLINE" : "OFFLINE"}
              icon="🤖"
              color="bg-green-600"
            />
            <StatsCard
              title="⏱️ Uptime"
              value={stats ? formatUptime(stats.uptime) : '0s'}
              icon="⏰"
              color="bg-blue-600"
            />
            <StatsCard
              title="⚡ Commands"
              value={stats?.commandsExecuted.toLocaleString() || '0'}
              icon="💫"
              color="bg-purple-600"
            />
            <StatsCard
              title="📡 RSS Feeds"
              value={stats?.rssFeeds.toString() || '0'}
              icon="📺"
              color="bg-orange-600"
            />
          </div>

          {/* Charts and Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <CommandsChart commands={commands} />
            <RSSFeeds feeds={rssFeeds} />
          </div>

          {/* Logs */}
          <LogViewer logs={logs} />
        </motion.div>
      </main>
    </div>
  )
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}