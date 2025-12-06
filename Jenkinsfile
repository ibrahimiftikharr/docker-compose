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
                sh 'docker-compose down --remove-orphans || true'
                sh 'docker-compose up --build -d'
            }
        }
        // -----------------------------
        stage('Clone Test Repository') {
            steps {
                dir('tests') {
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
                dir('tests') {
                    // Adjust 'selenium' to the actual subdirectory containing pom.xml
                    dir('selenium') {
                        sh 'mvn test'
                    }
                }
            }
        }
        // -----------------------------
        stage('Publish Test Results') {
            steps {
                // Adjust path to match the test subdirectory
                junit 'tests/selenium/target/surefire-reports/*.xml'
            }
        }
    }
    // ==========================
    post {
        always {
            script {
                try {
                    sh "git config --global --add safe.directory ${env.WORKSPACE}"
                    // Committer email of the LAST docker-compose commit
                    def committer = sh(
                        script: "git log -1 --pretty=format:'%ae'",
                        returnStdout: true
                    ).trim()
                    
                    // Use find + xargs for robust file handling; ignore if no files
                    def raw = sh(
                        script: "find tests -name '*.xml' -path '*/surefire-reports/*.xml' -exec grep '<testcase' {} + || true",
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
                            def nameMatcher = (line =~ /name=\"([^\"]+)\"/)
                            def name = nameMatcher ? nameMatcher[0][1] : 'Unknown'
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
                        total = 0
                        details = "No test reports found (tests may have failed to run)."
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
                    emailext(
                        to: committer,
                        subject: "Build #${env.BUILD_NUMBER} Test Results",
                        body: emailBody
                    )
                } catch (Exception e) {
                    echo "Post-actions encountered an error: ${e.getMessage()}. Pipeline still considered complete."
                }
            }
        }
    }
}
