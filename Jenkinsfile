pipeline {
    agent any

    triggers {
        githubPush() // Triggers pipeline whenever GitHub sends a push event
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'
            }
        }

        stage('Build and Run Containers') {
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose up --build -d'
            }
        }
    }
}
