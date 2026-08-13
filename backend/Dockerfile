# syntax=docker/dockerfile:1
# Multi-stage, multi-arch-fähig (amd64 + arm64 für Oracle Cloud / Ampere).
# Beide Base-Images sind offizielle Multi-Arch-Manifeste.
#
# Wichtig: Das Spring-Boot-Fat-Jar ist reines JVM-Bytecode und damit
# architektur-unabhängig. Der Build-Stage läuft deshalb IMMER nativ auf der
# Build-Plattform ($BUILDPLATFORM) – Gradle wird also nur einmal (amd64)
# ausgeführt und NICHT unter QEMU-Emulation je Ziel-Arch. Nur der triviale
# Runtime-Stage (Jar kopieren + User anlegen) wird pro Ziel-Arch gebaut.
FROM --platform=$BUILDPLATFORM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
# Wrapper + Build-Metadaten zuerst → Layer-Caching für Dependencies.
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
# BuildKit-Cache-Mount für den Gradle-Cache: Dependencies werden über Builds
# hinweg wiederverwendet statt jedes Mal neu geladen.
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon bootJar

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
# Non-root laufen lassen.
RUN groupadd --system app && useradd --system --gid app --home /app app
COPY --from=build /workspace/build/libs/*.jar /app/app.jar
USER app
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
