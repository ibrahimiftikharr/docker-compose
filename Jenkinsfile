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
                sh 'docker-compose down --remove-orphans || true'
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
                    image 'markhobson/maven-chrome:jdk-11'  // more stable than latest
                    args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2 --network jobify-ci_default'
                }
            }
            steps {
                dir('tests') {                     // ← pom.xml is here
                    sh 'mvn -B test'               // -B = batch mode, cleaner logs
                }
            }
        }

        stage('Publish Test Results') {
            steps {
                junit 'tests/target/surefire-reports/*.xml'
            }
        }
    }

    post {
        always {
            script {
                try {
                    // Get committer email from the app repo (docker-compose)
                    def committer = sh(script: "git log -1 --pretty=format:'^(?!.*Jenkinsfile).*$' --pretty=format:%ae", returnStdout: true).trim()
                    if (!committer) {
                        committer = 'ibrahimiftikharr@hotmail.com' // fallback
                    }

                    // Safely extract test results even if some files are missing
                    def reportFiles = findFiles(glob: 'tests/target/surefire-reports/*.xml')
                    def details = ""
                    def total = 0
                    def passed = 0
                    def failed = 0
                    def skipped = 0

                    if (reportFiles.length == 0) {
                        details = "No test reports generated. Tests likely failed to execute."
                    } else {
                        reportFiles.each { file ->
                            def content = readFile(file.path)
                            def testcases = content.findAll(/<testcase[^>]*>/)
                            testcases.each { tc ->
                                total++
                                def name = (tc =~ /name="([^"]+)"/)[0][1]
                                if (content.contains("<failure") || content.contains("<error")) {
                                    failed++
                                    details += "${name} — FAILED\n"
                                } else if (tc.contains('skipped="true"') || content.contains("<skipped")) {
                                    skipped++
                                    details += "${name} — SKIPPED\n"
                                } else {
                                    passed++
                                    details += "${name} — PASSED\n"
                                }
                            }
                        }
                    }

                    def emailBody = """
Jobify CI - Build #${env.BUILD_NUMBER}
Status: ${currentBuild.currentResult}
Total Tests: ${total}
Passed: ${passed}
Failed: ${failed}
Skipped: ${skipped}

Detailed Results:
${details}

Jenkins URL: ${env.BUILD_URL}
"""

                    emailext(
                        to: committer,
                        subject: "Jobify CI #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",
                        body: emailBody,
                        mimeType: 'text/plain'
                    )
                } catch (Exception e) {
                    echo "Email/notification failed: ${e.message}"
                    // Don't fail the build just because email failed
                }

                // Clean up containers after tests
                sh 'docker-compose down --remove-orphans || true'
            }
        }
    }
}
