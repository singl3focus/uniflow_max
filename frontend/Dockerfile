# Dev build
FROM node:alpine
 
WORKDIR /app
 
# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install
 
COPY . .
 
EXPOSE 3000
 
CMD ["npm", "run", "dev"]
