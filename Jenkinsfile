pipeline {
  agent any
  environment {
    DOCKER_BUILDKIT = 1
  }
  stages {
    stage('Clone') {
      steps {
        git 'https://github.com/omkarbasvekar/Typing-Speed-Analyzer.git'
      }
    }
    stage('Build Docker Images') {
      steps {
        sh 'docker-compose build'
      }
    }
    stage('Deploy Containers') {
      steps {
        sh 'docker-compose down || true'
        sh 'docker-compose up -d'
      }
    }
  }
}