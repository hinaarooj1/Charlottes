# Use the official Node.js image as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React Vite app
RUN npm run build

# Expose port 5000
EXPOSE 5000

# Start the Node.js application
CMD ["npm", "start"]