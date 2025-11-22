import { RSSFeed } from '@/types'

interface RSSFeedsProps {
  feeds: RSSFeed[]
}

export default function RSSFeeds({ feeds }: RSSFeedsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">RSS Feeds</h2>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {feeds.length === 0 ? (
          <p className="text-gray-400">No RSS feeds configured</p>
        ) : (
          feeds.map((feed, index) => (
            <div key={index} className="bg-gray-700 rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium truncate">{feed.url}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-gray-400 text-sm">Type: {feed.type}</span>
                    <span className="text-gray-400 text-sm">Interval: {feed.interval}min</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    feed.status === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {feed.status}
                  </span>
                </div>
              </div>
              {feed.lastCheck && (
                <p className="text-gray-500 text-xs mt-2">
                  Last checked: {new Date(feed.lastCheck).toLocaleString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}