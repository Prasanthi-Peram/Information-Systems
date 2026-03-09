FROM python:3.10-slim

# Install system dependencies for psycopg2 and other ML libraries
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install requirements first (better for Docker caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire ml directory into /app
COPY . .

# Change the default command to keep the container alive
# This allows you to 'exec' into it for training
CMD ["tail", "-f", "/dev/null"]