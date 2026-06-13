# Use a Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies with flags to ensure optional dependencies are installed
# Remove package-lock.json if it exists to avoid npm bug with optional dependencies
RUN rm -f package-lock.json && \
    npm install --force && \
    npm rebuild

# Copy the rest of the source code
COPY . .

# Expose the Vite dev port
EXPOSE ${VITE_PORT}

# Run Vite in dev mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "${VITE_PORT}"]
