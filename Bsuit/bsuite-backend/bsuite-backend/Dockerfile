FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install --arch=x64 --platform=linux --libc=musl sharp
RUN apk add --no-cache bash

# Copy source code
COPY . .

EXPOSE 8001
# Run dev mode
CMD ["npm", "run", "start:dev"]