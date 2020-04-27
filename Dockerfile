FROM openjdk:14-jdk-alpine

RUN addgroup -S gantt && \
    adduser -S gantt -G gantt && \
    mkdir -p /opt/apps/gantt/fichier

WORKDIR /opt/apps/gantt

ARG JAR_FILE=target/*.jar

COPY ${JAR_FILE} /opt/apps/gantt/app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
