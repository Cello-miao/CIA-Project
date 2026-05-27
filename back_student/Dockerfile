FROM node:20-alpine

RUN addgroup -S service-web && adduser -S service-web -G service-web

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

# Enforcing yarn to install production dependencies. Build deps are only used during install
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && yarn install --production --non-interactive --ignore-scripts \
    && apk del .build-deps \
    && yarn cache clean

# Monorepo static artifact injection
# Copy prebuilt distribution artifacts from host 'dist' into the container build folder
COPY dist ./build
COPY ormconfig.js ./
COPY start.js ./

RUN chown -R service-web:service-web /usr/src/app

ENV NODE_ENV=production

USER service-web

# Use the start wrapper which waits for DB port and then requires the built app
CMD ["node", "start.js"]
