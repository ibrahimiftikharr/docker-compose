pipeline {

    agent any

    triggers {
        githubPush()
    }

    stages {

        /* ------------------------------------------------------------------
         * STAGE 1: Clone application repo and run Docker containers
         * ------------------------------------------------------------------ */
        stage('Clone & Run App Containers') {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'

                sh 'docker-compose down || true'
                sh 'docker-compose up --build -d'
            }
        }

        /* ------------------------------------------------------------------
         * STAGE 2: Clone test cases repo
         * ------------------------------------------------------------------ */
        stage('Clone Test Cases') {
            steps {
                // clone test repo inside a separate folder
                dir('test-cases') {
                    git branch: 'master', url: 'https://github.com/ibrahimiftikharr/test-cases.git'
                }
            }
        }

        /* ------------------------------------------------------------------
         * STAGE 3: Run Selenium Tests in Docker (headless Chrome)
         * ------------------------------------------------------------------ */
        stage('Run Selenium Tests') {
            agent {
                docker {
                    image 'markhobson/maven-chrome'
                    args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2'
                }
            }
            steps {
                dir('test-cases') {
                    sh 'mvn test'
                }
            }
        }

        /* ------------------------------------------------------------------
         * STAGE 4: Publish JUnit Report
         * ------------------------------------------------------------------ */
        stage('Publish Test Results') {
            steps {
                junit 'test-cases/target/surefire-reports/*.xml'
            }
        }
    }

    /* ------------------------------------------------------------------
     * POST: Email test results to the committer who pushed the repo
     * ------------------------------------------------------------------ */
    post {
        always {
            script {
                // Identify the email of the person who pushed the commit
                sh "git config --global --add safe.directory ${env.WORKSPACE}"

                def committer = sh(
                    script: "cd test-cases && git log -1 --pretty=format:'%ae'",
                    returnStdout: true
                ).trim()

                // Parse test results
                def raw = sh(
                    script: "grep -h \"<testcase\" test-cases/target/surefire-reports/*.xml",
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

                // Prepare email
                def emailBody = """
Test Summary (Build #${env.BUILD_NUMBER})

Total Tests:   ${total}
Passed:        ${passed}
Failed:        ${failed}
Skipped:       ${skipped}

Detailed Results:
${details}
"""

                // Send email
                emailext(
                    to: committer,
                    subject: "Build #${env.BUILD_NUMBER} – Selenium Test Results",
                    body: emailBody
                )
            }
        }
    }
}
