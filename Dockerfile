# Verwende ein Node.js-Base-Image
FROM node:18-alpine

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package.json und package-lock.json
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den restlichen Code ins Arbeitsverzeichnis
COPY . .

# Exponiere den Port (optional, falls der Bot Webhooks oder HTTP-Server nutzt)
# EXPOSE 3000

# Starte den Bot
CMD ["node", "index.js"]
