import { LogEntry } from '@/types'

interface LogViewerProps {
  logs: LogEntry[]
}

export default function LogViewer({ logs }: LogViewerProps) {
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-400'
      case 'warn':
      case 'warning':
        return 'text-yellow-400'
      case 'info':
        return 'text-blue-400'
      case 'debug':
        return 'text-gray-400'
      default:
        return 'text-gray-300'
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Recent Logs</h2>
      <div className="bg-gray-900 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <p className="text-gray-400">No logs available</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-2 flex">
              <span className="text-gray-500 mr-2 flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`mr-2 font-bold flex-shrink-0 ${getLevelColor(log.level)}`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="text-gray-300 break-words">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}