FROM node:20-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN yarn install

EXPOSE 3000

# 生产环境使用以下命令
# CMD ["yarn", "prod"]

# 开发环境使用以下命令（包含migration）
CMD ["sh", "-c", "yarn migration:start && yarn start"]
