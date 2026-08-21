# syntax=docker/dockerfile:1
# Multi-stage, multi-arch-fähig (amd64 + arm64 für Oracle Cloud / Ampere).
#
# Wie im Backend: Der Vite-Build erzeugt reine statische Assets (arch-unabhängig).
# Der Build-Stage läuft deshalb IMMER nativ auf der Build-Plattform
# ($BUILDPLATFORM) – npm/Vite wird also nur einmal (amd64) ausgeführt und NICHT
# unter QEMU-Emulation je Ziel-Arch. Nur der triviale nginx-Runtime-Stage
# (statische Dateien kopieren) wird pro Ziel-Arch gebaut.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
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
