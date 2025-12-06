pipeline {
    agent any

    triggers {
        githubPush()
    }

    stages {

        stage('Clone Application Repository') {
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

        stage('Clone Test Repository') {
            steps {
                dir('tests') {
                    git branch: 'master', url: 'https://github.com/ibrahimiftikharr/test-cases.git'
                }
            }
        }

        stage('Run Selenium Tests') {
            agent {
                docker {
                    image 'markhobson/maven-chrome'
                    args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2'
                }
            }
            steps {
                dir('tests') {
                    sh 'mvn test'
                }
            }
        }

        stage('Publish Results') {
            steps {
                junit 'tests/target/surefire-reports/*.xml'
            }
        }
    }
}
