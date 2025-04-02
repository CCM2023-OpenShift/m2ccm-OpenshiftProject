FROM node:20-alpine3.20 As build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY ./ ./
RUN npm run build

FROM nginx:stable-alpine as production
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
EXPOSE 8080
ENTRYPOINT ["nginx", "-g", "daemon off;"]


