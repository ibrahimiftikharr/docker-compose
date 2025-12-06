pipeline {
    agent any

    stages {
        stage('Clone Application Repository') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    userRemoteConfigs: [[url: 'https://github.com/ibrahimiftikharr/mern-app.git']]
                ])
            }
        }

        stage('Clone Selenium Test Repository') {
            steps {
                sh 'rm -rf tests'      // Clean previous
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
                dir("tests") {
                    sh 'mvn test'
                }
            }
            post {
                always {
                    junit 'tests/target/surefire-reports/*.xml'
                }
            }
        }
    }

    post {
        always {
            emailext (
                to: "yourEmail@gmail.com",
                subject: "CI Pipeline Result: ${currentBuild.currentResult}",
                body: "Job finished with status: ${currentBuild.currentResult}"
            )
        }
    }
}
