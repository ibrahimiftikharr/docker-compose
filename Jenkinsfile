pipeline { 
    


    agent any
    triggers { githubPush() }

    stages {
        stage('Clone & Run App Containers') 
      {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'
                sh 'docker-compose down || true'
                sh 'docker-compose up --build -d'
            }
        }






     }
