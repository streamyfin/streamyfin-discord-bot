export interface BotStats {
  uptime: number
  commandsExecuted: number
  errorsCount: number
  rssItemsProcessed: number
  rssFeeds: number
  lastActivity: string
  status: string
}

export interface Command {
  name: string
  count: number
}

export interface RSSFeed {
  key: string
  url: string
  type: string
  channelId: string
  interval: string
  lastCheck: string | null
  status: string
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  [key: string]: any
}