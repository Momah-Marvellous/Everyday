# Use official Node.js image
FROM node:18

# Install yt-dlp and ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg wget && \
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire project
COPY . .

# Make sure the downloads folder exists
RUN mkdir -p downloads

# Expose the port your backend runs on
EXPOSE 2009

# Start the backend
CMD ["node", "index.js"]
