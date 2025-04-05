FROM node:18

# Install build tools for wrtc
RUN apt-get update && apt-get install -y python3 make g++ libudev-dev

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "start"]