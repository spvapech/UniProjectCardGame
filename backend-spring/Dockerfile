FROM eclipse-temurin:17
VOLUME /tmp
COPY target/*.jar backend-spring-docker.jar
ENTRYPOINT ["java","-jar","/backend-spring-docker.jar"]
