# Sichere Deployment-Anleitung

## 🚨 Vor dem Deployment

### 1. Secrets sichern
```bash
# 1. .env.prod erstellen (basierend auf .env.prod.example)
cp .env.prod.example .env.prod

# 2. Mit echten Werten füllen
nano .env.prod

# 3. Berechtigungen einschränken
chmod 600 .env.prod
```

### 2. .gitignore prüfen
```bash
# Sicherstellen, dass .env.prod NICHT committed wird
echo ".env.prod" >> .gitignore
```

## 🐳 Production Deployment

### Lokal starten
```bash
npm start
```

### Docker Production
```bash
# Mit sicherer Konfiguration
docker-compose -f docker-compose.prod.yml up -d

# Status prüfen
docker-compose -f docker-compose.prod.yml ps
```

## 🔒 Zusätzliche Sicherheitsmaßnahmen

### 1. Reverse Proxy (Nginx/Caddy)
Web Panel sollte NIEMALS direkt erreichbar sein:

```nginx
server {
    listen 443 ssl;
    server_name bot-admin.yourdomain.com;
    
    # SSL-Konfiguration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Nur bestimmte IPs erlauben
    allow 192.168.1.0/24;  # Dein Heimnetzwerk
    allow 10.0.0.0/8;      # VPN-Range
    deny all;
    
    # Basic Auth zusätzlich
    auth_basic "Admin Panel";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Firewall-Regeln
```bash
# Nur SSH und spezifische Ports
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 443/tcp  # HTTPS für Web Panel
ufw enable
```

### 3. VPN-Zugang
Web Panel nur über VPN erreichbar machen.

### 4. Monitoring
```bash
# Log-Monitoring
docker-compose -f docker-compose.prod.yml logs -f

# Ressourcen überwachen
docker stats
```

## ⚠️ Was NICHT tun

1. **Niemals** Ports direkt extern öffnen (`0.0.0.0:3000`)
2. **Niemals** Secrets in docker-compose.yml
3. **Niemals** ohne HTTPS betreiben
4. **Niemals** schwache Passwörter verwenden
5. **Niemals** ohne Backup der Redis-Daten

## ✅ Sicherheits-Checkliste

- [ ] `.env.prod` mit starken Passwörtern erstellt
- [ ] Web Panel nur localhost/VPN erreichbar
- [ ] HTTPS mit gültigen Zertifikaten
- [ ] Firewall konfiguriert
- [ ] Regular Backups eingerichtet
- [ ] Monitoring aktiv
- [ ] Updates automatisiert (Watchtower)