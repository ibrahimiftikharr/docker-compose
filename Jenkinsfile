pipeline {
    agent any

    triggers {
        githubPush() // Trigger on GitHub push
    }

    environment {
        COMMITTER_EMAIL = ''
        TEST_RESULTS = ''
    }

    stages {
        // =======================
        stage('Clone Application Repository') {
            steps {
                script {
                    git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'
                    // Capture committer email from application repo
                    COMMITTER_EMAIL = sh(
                        script: "git log -1 --pretty=format:'%ae'",
                        returnStdout: true
                    ).trim()
                    echo "Committer email: ${COMMITTER_EMAIL}"
                }
            }
        }

        stage('Build and Run Containers') {
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose up --build -d'
                sh 'sleep 10' // Wait for containers to be ready
            }
        }

        // =======================
        stage('Clone Test Repository') {
            agent {
                docker {
                    image 'markhobson/maven-chrome'
                    args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2 -v /tmp/test-results:/tmp/test-results --network=host'
                    reuseNode true
                }
            }
            steps {
                git branch: 'main', url: 'https://github.com/ibrahimiftikharr/test-cases.git'
            }
        }

        stage('Run Selenium Tests') {
            agent {
                docker {
                    image 'markhobson/maven-chrome'
                    args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2 -v /tmp/test-results:/tmp/test-results --network=host'
                    reuseNode true
                }
            }
            steps {
                sh 'mvn clean test'
                // Copy results to shared volume
                sh 'mkdir -p /tmp/test-results && cp -r target/surefire-reports/* /tmp/test-results/ || true'
            }
        }

        stage('Publish Test Results') {
            steps {
                // Publish from the Jenkins workspace (copied from Docker volume)
                junit allowEmptyResults: true, testResults: '/tmp/test-results/*.xml'
            }
        }

        stage('Generate Email Report') {
            steps {
                script {
                    def xmlFiles = sh(
                        script: 'ls /tmp/test-results/*.xml 2>/dev/null || echo ""',
                        returnStdout: true
                    ).trim()

                    if (!xmlFiles) {
                        echo "No test results found"
                        env.TEST_RESULTS = "No test results available"
                        return
                    }

                    def raw = sh(
                        script: 'grep -h "<testcase" /tmp/test-results/*.xml || echo ""',
                        returnStdout: true
                    ).trim()

                    int total = 0
                    int passed = 0
                    int failed = 0
                    int skipped = 0

                    def details = ""

                    if (raw) {
                        raw.split('\n').each { line ->
                            total++
                            def matcher = (line =~ /name=\"([^\"]+)\"/)
                            def name = matcher ? matcher[0][1] : "Unknown Test"

                            if (line.contains("<failure")) {
                                failed++
                                details += "❌ ${name} — FAILED\n"
                            } else if (line.contains("<skipped") || line.contains("</skipped>")) {
                                skipped++
                                details += "⏭️  ${name} — SKIPPED\n"
                            } else {
                                passed++
                                details += "✅ ${name} — PASSED\n"
                            }
                        }
                    }

                    env.TEST_RESULTS = """
═══════════════════════════════════════════════════
   TEST SUMMARY - Build #${env.BUILD_NUMBER}
═══════════════════════════════════════════════════

📊 Statistics:
   Total Tests:    ${total}
   ✅ Passed:       ${passed}
   ❌ Failed:       ${failed}
   ⏭️  Skipped:     ${skipped}

═══════════════════════════════════════════════════
   DETAILED RESULTS
═══════════════════════════════════════════════════

${details ?: 'No test details available'}

═══════════════════════════════════════════════════
Build URL: ${env.BUILD_URL}
Job: ${env.JOB_NAME}
Timestamp: ${new Date()}
═══════════════════════════════════════════════════
"""
                    echo env.TEST_RESULTS
                }
            }
        }
    }

    post {
        always {
            script {
                // Use captured committer email
                def recipient = env.COMMITTER_EMAIL ?: 'default@example.com'
                
                echo "Sending email to: ${recipient}"
                
                emailext(
                    to: recipient,
                    subject: "🧪 Jenkins Build #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",
                    body: env.TEST_RESULTS ?: 'Test results not available',
                    mimeType: 'text/plain'
                )
            }
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
        cleanup {
            // Cleanup temporary test results
            sh 'rm -rf /tmp/test-results || true'
        }
    }
}
