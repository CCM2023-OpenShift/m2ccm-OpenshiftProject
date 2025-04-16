FROM node:20-alpine3.20 As build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY ./ ./
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000", "--single"]
EXPOSE 3000