# syntax=docker/dockerfile:1
# Multi-stage, multi-arch-fähig (amd64 + arm64 für Oracle Cloud / Ampere).
# Beide Base-Images sind offizielle Multi-Arch-Manifeste.

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
# Wrapper + Build-Metadaten zuerst → Layer-Caching für Dependencies.
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
# Non-root laufen lassen.
RUN groupadd --system app && useradd --system --gid app --home /app app
COPY --from=build /workspace/build/libs/*.jar /app/app.jar
USER app
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
