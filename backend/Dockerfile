# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the Express backend
CMD ["npm", "start"]
