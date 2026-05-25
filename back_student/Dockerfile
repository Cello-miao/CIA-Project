FROM node:20-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN yarn install


EXPOSE 3000
CMD ["yarn", "migration:start"]
CMD ["yarn", "start"]
