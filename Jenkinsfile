pipeline { 
    
    agent any
    triggers { githubPush() }

    stages {
        stage('Clone & Run App') {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/docker-compose.git'
                sh 'docker-compose down --remove-orphans || true'
                sh 'docker-compose up --build -d'
                sh 'sleep 5' // give MERN app time to start
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
    }

    post {
        always {
            script {
                def committer = ''
                dir('test-cases') {
                    if (fileExists('.git')) {
                        committer = sh(
                            script: "git log -1 --pretty=format:%ae",
                            returnStdout: true
                        ).trim()
                    }
                }
                if (!committer || committer == '') {
                    committer = 'therentmates@gmail.com'
                }

                def raw = ''
                if (fileExists('test-cases/target/surefire-reports')) {
                    raw = sh(
                        script: "grep -h '<testcase' test-cases/target/surefire-reports/*.xml || true",
                        returnStdout: true
                    ).trim()
                }

                int total = 0, passed = 0, failed = 0, skipped = 0
                def details = ""

                if (raw) {
                    raw.split('\n').each { line ->
                        total++
                        def m = (line =~ /name="([^"]+)"/)
                        def name = m ? m[0][1] : "Unknown Test"
                        if (line.contains("<failure")) {
                            failed++
                            details += "Failed: ${name}\n"
                        } else if (line.contains("<skipped") || line.contains("</skipped>")) {
                            skipped++
                            details += "Skipped: ${name}\n"
                        } else {
                            passed++
                            details += "Passed: ${name}\n"
                        }
                    }
                } else {
                    details = "No test results found (tests may have failed to run)."
                }

                def color = currentBuild.currentResult == 'SUCCESS' ? '#28a745' : '#dc3545'

                def emailBody = """
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2 style="color: ${color};">FA22-BCS-062 Jobify CI – Build #${env.BUILD_NUMBER}</h2>
                        <p><strong>Status:</strong> <span style="color:${color}; font-size:20px;">${currentBuild.currentResult}</span></p>
                        <p><strong>Triggered by:</strong> ${currentBuild.getBuildCauses()[0].shortDescription}</p>
                        <p><strong>Duration:</strong> ${currentBuild.durationString}</p>

                        <h3>Test Results Summary</h3>
                        <ul>
                            <li><strong>Total Tests:</strong> ${total}</li>
                            <li><strong>Passed:</strong> <span style="color:green;">${passed}</span></li>
                            <li><strong>Failed:</strong> <span style="color:red;">${failed}</span></li>
                            <li><strong>Skipped:</strong> ${skipped}</li>
                        </ul>

                        <h4>Detailed Results:</h4>
                        <pre style="background:#f4f4f4; padding:15px; border-radius:8px;">${details}</pre>

                        <hr>
                        <p>
                            <a href="${env.BUILD_URL}" style="color:#007bff; text-decoration:none;">View Full Build</a> |
                            <a href="${env.BUILD_URL}testReport/" style="color:#007bff; text-decoration:none;">View Test Report</a>
                        </p>
                        <small>Sent from Jobify-CI on AWS EC2</small>
                    </body>
                    </html>
                """

                emailext(
                    to: committer,
                    subject: "Jobify-CI #${env.BUILD_NUMBER} FA22-BCS-062 – ${currentBuild.currentResult} (${passed}/${total} Passed)",
                    body: emailBody,
                    mimeType: 'text/html',
                    attachLog: true,
                    compressLog: true
                )
            }

        }
    }
}
