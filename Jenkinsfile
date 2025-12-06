pipeline {
    agent any
    triggers { githubPush() }

    stages {
        stage('Clone & Run App') {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'
                sh 'docker-compose down --remove-orphans || true'
                sh 'docker-compose up --build -d'
                sh 'sleep 20'   // give MERN app time to start
            }
        }

        stage('Run Selenium Tests') {
            agent {
                docker {
                    image 'markhobson/maven-chrome:jdk-11'
                    args '''
                        -u root:root 
                        -v /var/lib/jenkins/.m2:/root/.m2 
                        --network jobify-ci_default
                    '''
                    reuseNode true   // THIS IS THE KEY: reports stay on the Jenkins host!
                }
            }
            steps {
                dir('test-cases') {
                    git branch: 'master', url: 'https://github.com/ibrahimiftikharr/test-cases.git'
                    sh 'mvn test'
                }
            }
        }

        stage('Publish Test Results') {
            steps {
                junit 'test-cases/target/surefire-reports/*.xml'   // now the files are really there
            }
        }
    }

    post {
        always {
            // Clean up containers so next build starts fresh
            sh 'docker-compose down --remove-orphans || true'

            // Optional: send email only if you have SMTP configured
            // Comment out the whole block below if email keeps failing
            /*
            script {
                def committer = sh(script: "git log -1 --pretty=format:%ae", returnStdout: true).trim()
                if (!committer) committer = 'ibrahimiftikharr@hotmail.com'

                emailext(
                    to: committer,
                    subject: "Jobify CI #${BUILD_NUMBER} - ${currentBuild.currentResult}",
                    body: "Build ${currentBuild.currentResult}\nCheck console: ${BUILD_URL}",
                    mimeType: 'text/plain'
                )
            }
            */
        }
    }
}
