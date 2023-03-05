# syntax=docker/dockerfile:1
FROM node:alpine

WORKDIR /app

COPY ["package*.json", "./"]

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "app.js" ]