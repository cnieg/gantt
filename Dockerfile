FROM openjdk:14-jdk-alpine

RUN addgroup -S gantt && adduser -S gantt -G gantt
USER gantt:gantt

ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

ENTRYPOINT ["java","-jar","/app.jar"]
