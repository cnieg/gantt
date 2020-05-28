[![Java CI with Maven](https://github.com/cnieg/gantt/workflows/Java%20CI%20with%20Maven/badge.svg)](https://github.com/cnieg/gantt/actions?query=workflow%3A%22Java+CI+with+Maven%22) [![Docker Pulls](https://img.shields.io/docker/pulls/cnieg/gantt)](https://hub.docker.com/r/cnieg/gantt)

# What is it ?
This project is a web app to make gantt diagrams on a browser

# Files for your organization
In order to run, the app needs 2 files in the folder `fichier`.

## Team
A file `team.json` describing your organization teams :
```json
[{
  "key": 1,
  "label": "Unassigned",
  "backgroundColor": "#03A9F4",
  "textColor": "#FFF"
}, {
  "key": 2,
  "label": "First team",
  "backgroundColor": "#f57730",
  "textColor": "#FFF"
}, {
  "key": 3,
  "label": "Second team",
  "backgroundColor": "#e157de",
  "textColor": "#FFF"
}]
```

## Status
A file `status.json` describing your organization teams :
```json
[{
   "key": "todo",
   "label": "TO DO",
   "backgroundColor": "#dfe1e5",
   "textColor": "#42526e"
 }, {
   "key": "in_progress",
   "label": "En cours",
   "backgroundColor": "#deebff",
   "textColor": "#0747a6"
 }, {
   "key": "blocked",
   "label": "Bloqué",
   "backgroundColor": "#ffbdaf",
   "textColor": "#ff2d00"
 }, {
   "key": "done",
   "label": "Terminé",
   "backgroundColor": "#e3fcef",
   "textColor": "#064"
 }]
```

# Installation

## With Kubernetes and Helm

1. Create a file `override.yaml` to override the default [values.yaml](https://github.com/cnieg/helm-charts/blob/master/charts/gantt/values.yaml) of the Chart.
2. In a terminal, enter following commands :

```bash
helm repo add github-cnieg https://cnieg.github.io/helm-charts
helm repo update
helm upgrade -i <release_name> github-cnieg/gantt --version <chart_version>
```

## With Docker

```bash
docker run --name gantt cnieg/gantt
```

# Build

Before building the app, you need to have installed :
- Maven 3+
- Java 13+

Once done, just run the following command :
```bash
mvn clean package
```

Then, if you need to start the app :
```bash
java -jar target/gant-<version>.jar
```
