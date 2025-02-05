# Use Node.js Image 
FROM node:20 

# Create app directory
WORKDIR /app 

# Copy package files 
COPY package*.json ./

# Install dependencies 
RUN npm install

# Copy the application 
COPY . .

# Build the app 
RUN npm run build 

# Expose port 
EXPOSE 3000 

# Start the server 
CMD ["npm", "run", "start:prod"]