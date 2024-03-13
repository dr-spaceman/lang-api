FROM node:18.5
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3333
CMD [ "node", "dist/index.js" ]
