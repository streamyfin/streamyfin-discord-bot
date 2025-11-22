# Finn - Streamyfin Bot Dashboard 🎬

A modern Next.js dashboard for monitoring and managing Finn, the Streamyfin Discord Bot.

## 🚀 Features

- **Real-time Monitoring**: Live stats for bot uptime, commands, and RSS feeds
- **Streamyfin Design**: Matches the official Streamyfin website design language
- **Modern Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Authentication**: Secure login with session management
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Charts**: Command usage analytics with Recharts
- **Live Logs**: Real-time activity monitoring

## 🎨 Design Language

The dashboard follows the Streamyfin website design:
- **Colors**: Dark background `#1e1a3f`, gradients `#2a2660cc`, purple accents `#8b5cf6`
- **Typography**: Modern fonts with proper hierarchy
- **Components**: Rounded corners, soft shadows, smooth animations
- **Icons**: Consistent emoji usage for visual clarity

## 🛠 Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
cd web-dashboard
npm install
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

### Build for Production

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
web-dashboard/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes (proxy to main bot)
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── Dashboard.tsx   # Main dashboard component
│   │   ├── StatsCard.tsx   # Stat cards
│   │   ├── CommandsChart.tsx # Command usage charts
│   │   ├── LogViewer.tsx   # Activity logs
│   │   └── ui/             # Reusable UI components
│   └── types/              # TypeScript type definitions
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
└── package.json           # Dependencies
```

## 🔧 Configuration

The dashboard connects to the main bot's web panel API (default port 3001).

Environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🔐 Authentication

The dashboard uses the same authentication as the main bot's web panel:
- Username: `admin`
- Password: From `WEB_PANEL_PASSWORD` environment variable

## 🎯 Features in Detail

### Real-time Stats
- Bot connection status
- Uptime tracking
- Command execution count  
- RSS feed monitoring

### Command Analytics
- Usage frequency charts
- Most popular commands
- Execution trends

### Activity Logs
- Real-time log streaming
- Log level filtering
- Timestamp tracking

### RSS Management
- Feed status monitoring
- Item processing stats
- Configuration overview

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Maintain the Streamyfin design consistency
4. Test on multiple screen sizes

## 📄 License

Part of the Streamyfin Discord Bot project.