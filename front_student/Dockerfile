FROM node:18-alpine AS builder

ENV NODE_OPTIONS=--openssl-legacy-provider

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .

# Enforcing build-time variable injection for React compilation
ARG REACT_APP_API_URL
RUN echo "REACT_APP_API_URL=${REACT_APP_API_URL}" > .env \
	&& npm run build



FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache libcap && addgroup -S service-web && adduser -S service-web -G service-web

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run && \
	chown -R service-web:service-web /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run /etc/nginx && \
	setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx

COPY --from=builder /app/build /usr/share/nginx/html

RUN chown -R service-web:service-web /usr/share/nginx/html

USER service-web

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
