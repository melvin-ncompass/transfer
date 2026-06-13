# Use lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python scripts
COPY . .

# Run the 10M seeder
CMD ["python", "seed_docker_10m.py"]

