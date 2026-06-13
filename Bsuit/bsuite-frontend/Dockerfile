FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Vite dev server port
EXPOSE 5173

# Run Vite in dev mode
CMD ["npm", "run", "dev", "--", "--host"]