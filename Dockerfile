  FROM node:18

WORKDIR /app

COPY Server/package*.json ./

RUN npm install

COPY Server/ .

# Copy built frontend to server's static folder
COPY Client/Jobify/dist ./Client/Jobify/dist

EXPOSE 5000

CMD ["node", "server.js"]
