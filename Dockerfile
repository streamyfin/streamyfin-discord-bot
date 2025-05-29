
FROM node:23-alpine


WORKDIR /app


COPY package*.json ./


RUN npm install


COPY . .

CMD ["node", "index.js"]
