# Web Panel

The Streamyfin Discord Bot includes a built-in web panel for monitoring and administration.

## Features

### 📊 **Dashboard Overview**
- Bot status (online/offline)
- Uptime tracking
- Total commands executed
- Error count monitoring
- RSS feed statistics

### 📈 **Command Analytics**
- Most used commands
- Usage statistics
- Real-time command tracking

### 📡 **RSS Monitor**
- Active RSS feeds
- Feed status (active/pending)
- Last check timestamps
- Items processed counter

### 📝 **Activity Logs**
- Real-time bot activity
- Error tracking
- Command execution logs
- RSS processing logs

## Setup

### 1. Enable the Web Panel

Add to your `.env` file:

```env
ENABLE_WEB_PANEL=true
WEB_PANEL_PORT=3000
WEB_PANEL_PASSWORD=your_secure_password
```

### 2. Environment Variables

- **`ENABLE_WEB_PANEL`**: Set to `true` to enable the web panel
- **`WEB_PANEL_PORT`**: Port number (default: 3000)
- **`WEB_PANEL_PASSWORD`**: Optional basic auth password for security

### 3. Access the Panel

Once the bot is running with the web panel enabled:

1. Open your browser
2. Navigate to `http://localhost:3000` (or your configured port)
3. If you set a password, use username `admin` and your configured password

## Security

### Basic Authentication
If `WEB_PANEL_PASSWORD` is set, the panel will be protected with HTTP Basic Authentication:
- Username: `admin`
- Password: Your configured password

### Network Security
- The web panel only binds to localhost by default
- For production, consider using a reverse proxy (nginx, Apache)
- Always use HTTPS in production environments

## API Endpoints

The web panel exposes several API endpoints:

- **`GET /api/stats`** - Bot statistics and uptime
- **`GET /api/commands`** - Command usage statistics
- **`GET /api/rss`** - RSS feed information
- **`GET /api/logs?limit=50`** - Recent activity logs
- **`GET /api/health`** - Health check endpoint

## Production Deployment

For production environments:

1. **Use a reverse proxy** (nginx recommended)
2. **Enable HTTPS** with SSL certificates
3. **Set a strong password** for the web panel
4. **Consider firewall rules** to restrict access

### Example nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development

The web panel uses:
- **Express.js** for the API server
- **Vanilla JavaScript** for the frontend
- **Redis** for data storage
- **Real-time updates** via periodic polling

To customize the interface, modify the files in `web-static/`.

## Troubleshooting

### Panel not accessible
- Check if `ENABLE_WEB_PANEL=true` is set
- Verify the port is not in use by another service
- Check firewall settings if accessing remotely

### No data showing
- Ensure Redis is running and connected
- Check bot logs for any connection errors
- Verify the bot has been running long enough to collect data

### Authentication issues
- Double-check your password in the `.env` file
- Use username `admin` (lowercase)
- Clear browser cache if previously accessed without auth