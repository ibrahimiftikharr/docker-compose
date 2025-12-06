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
                    reuseNode true
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
                junit 'test-cases/target/surefire-reports/*.xml'
            }
        }

        // NEW: Send email on Jenkins host
        stage('Send Email') {
            agent any
            steps {
                script {
                    def committer = ''
                    dir('test-cases') {
                        if (fileExists('.git')) {
                            committer = sh(script: "git log -1 --pretty=format:'%ae' || true", returnStdout: true).trim()
                        }
                    }

                    def raw = ''
                    if (fileExists('test-cases/target/surefire-reports')) {
                        raw = sh(script: "grep -h \"<testcase\" test-cases/target/surefire-reports/*.xml || true", returnStdout: true).trim()
                    }

                    int total = 0, passed = 0, failed = 0, skipped = 0
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
                        details = "No test results found."
                    }

                    def emailBody = """
                        Test Summary (Build #${env.BUILD_NUMBER})
                        Total: ${total}, Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}
                        Details:
                        ${details}
                    """

                    if (committer) {
                        emailext(
                            to: committer,
                            subject: "Build #${env.BUILD_NUMBER} – Selenium Test Results",
                            body: emailBody
                        )
                    } else {
                        echo "No committer email found; not sending email."
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker-compose down --remove-orphans || true'
        }
    }
}
