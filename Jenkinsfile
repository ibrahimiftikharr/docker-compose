pipeline {
    agent any

    triggers {
        githubPush()
    }

    stages {

        // -----------------------------
        stage('Clone Application Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'
            }
        }

        // -----------------------------
        stage('Build and Run Containers') {
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose up --build -d'
            }
        }

        // -----------------------------
stage('Clone Test Repository') {
    steps {
        sh 'rm -rf tests'    // clean old
        sh 'mkdir tests'
        dir("${env.WORKSPACE}@2/tests") {     // << clone into docker workspace
            git branch: 'master', url: 'https://github.com/ibrahimiftikharr/test-cases.git'
        }
    }
}


        // -----------------------------
        stage('Run Selenium Tests') {
            agent {
                docker {
                    image 'markhobson/maven-chrome'
                    args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2'
                }
            }
            steps {
               dir("${env.WORKSPACE}@2/tests") 
              {
               sh 'mvn test'
             }

            }
        }

        // -----------------------------
        stage('Publish Test Results') {
            steps {
                junit 'tests/target/surefire-reports/*.xml'
            }
        }
    }

    // ==========================
    post {
        always {
            script {
                sh "git config --global --add safe.directory ${env.WORKSPACE}"

                // Committer email of the LAST docker-compose commit
                def committer = sh(
                    script: "git log -1 --pretty=format:'%ae'",
                    returnStdout: true
                ).trim()

                def raw = sh(
                    script: "grep -h \"<testcase\" tests/target/surefire-reports/*.xml",
                    returnStdout: true
                ).trim()

                int total = 0
                int passed = 0
                int failed = 0
                int skipped = 0

                def details = ""

                raw.split('\n').each { line ->
                    total++
                    def name = (line =~ /name=\"([^\"]+)\"/)[0][1]

                    if (line.contains("<failure")) {
                        failed++
                        details += "${name} — FAILED\n"
                    } else if (line.contains("<skipped") || line.contains("</skipped>")) {
                        skipped++
                        details += "${name} — SKIPPED\n"
                    } else {
                        passed++
                        details += "${name} — PASSED\n"
                    }
                }

                def emailBody = """
Test Summary (Build #${env.BUILD_NUMBER})

Total Tests:   ${total}
Passed:        ${passed}
Failed:        ${failed}
Skipped:       ${skipped}

Detailed Results:
${details}
"""

                emailext(
                    to: committer,
                    subject: "Build #${env.BUILD_NUMBER} Test Results",
                    body: emailBody
                )
            }
        }
    }
}
