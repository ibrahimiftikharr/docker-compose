pipeline {
    agent any

    triggers {
        githubPush()
    }

    stages {

        stage('Clone & Run App Containers') {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'
                sh 'docker-compose down || true'
                sh 'docker-compose up --build -d'
            }
        }

        stage('Clone Test Cases (host)') {
            steps {
                // Keep a host-side copy for logs/inspection
                dir('test-cases') {
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
                // Checkout inside the container workspace to ensure pom.xml is present
                dir('test-cases') {
                    git branch: 'master', url: 'https://github.com/ibrahimiftikharr/test-cases.git'
                    // Show files for debugging (optional)
                    sh 'pwd && ls -la'
                    // Run tests
                    sh 'mvn test -DskipITs=true'
                }
            }
        }

        stage('Publish Test Results') {
            steps {
                // Publish reports from the host-side path
                junit 'test-cases/target/surefire-reports/*.xml'
            }
        }
    }

    post {
        always {
            script {
                // Get last commit author email safely
                def committer = ''
                dir('test-cases') {
                    if (fileExists('.git')) {
                        try {
                            committer = sh(script: "git log -1 --pretty=format:'%ae' || true", returnStdout: true).trim()
                        } catch (err) {
                            committer = ''
                        }
                    }
                }

                // Parse test results
                def raw = ''
                if (fileExists('test-cases/target/surefire-reports')) {
                    raw = sh(script: "grep -h \"<testcase\" test-cases/target/surefire-reports/*.xml || true", returnStdout: true).trim()
                }

                int total = 0
                int passed = 0
                int failed = 0
                int skipped = 0
                def details = ""

                if (raw) {
                    raw.split('\\n').each { line ->
                        total++
                        def m = (line =~ /name=\"([^\"]+)\"/)
                        def name = m ? m[0][1] : "UnnamedTest"

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
                } else {
                    details = "No test results found (no surefire XML files)."
                }

                def emailBody = """
                    Test Summary (Build #${env.BUILD_NUMBER})
                    Total Tests: ${total}
                    Passed: ${passed}
                    Failed: ${failed}
                    Skipped: ${skipped}
                    Detailed Results:
                    ${details}
                """

                if (committer) {
                    emailext(
                        to: committer,
                        subject: "Build #${env.BUILD_NUMBER} – Selenium Test Results",
                        body: emailBody
                    )
                } else {
                    echo "No committer email found; not sending email. Test summary:\n${emailBody}"
                }
            }
        }
    }
}
