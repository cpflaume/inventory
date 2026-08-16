# syntax=docker/dockerfile:1
# Multi-stage, multi-arch-fähig (amd64 + arm64 für Oracle Cloud / Ampere).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Release-Tag ins Bundle backen (Versionsanzeige). Ohne Build-Arg: „dev".
ARG APP_VERSION=dev
RUN APP_VERSION="$APP_VERSION" npm run build

# nginx-unprivileged lauscht als non-root auf 8080.
FROM nginxinc/nginx-unprivileged:1.31-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
