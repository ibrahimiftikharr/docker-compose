pipeline { 
    agent any
    triggers { githubPush() }

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
                // keep a host-side copy for logs/inspection
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
                // IMPORTANT: checkout inside the docker container workspace so pom.xml is present
                dir('test-cases') {
                    // Do fresh checkout inside container to ensure files are present in the container's workspace
                    git branch: 'master', url: 'https://github.com/ibrahimiftikharr/test-cases.git'

                    // show files for debugging (optional)
                    sh 'pwd && ls -la'

                    // run tests
                    sh 'mvn test -DskipITs=true'
                }
            }
        }

        stage('Publish Test Results') {
            steps {
                // publish reports from the host-side path (Jenkins will find them since agent returned)
                junit 'test-cases/target/surefire-reports/*.xml'
            }
        }
    }

    post {
        always {
            script {
                // safe: if test-cases exists and has commits, get committer; otherwise fallback to env.BUILD_USER_EMAIL or empty
                def committer = ''
                dir('test-cases') {
                    if (fileExists('.git')) {
                        // try to get the last commit author email; if repo empty, handle gracefully
                        try {
                            committer = sh(script: "git log -1 --pretty=format:'%ae' || true", returnStdout: true).trim()
                        } catch (err) {
                            committer = ''
                        }
                    }
                }

                // safer grep: only run if reports dir exists; use || true to avoid non-zero exit
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
                            failed++; details += "${name} — FAILED\n"
                        } else if (line.contains("<skipped") || line.contains("</skipped>")) {
                            skipped++; details += "${name} — SKIPPED\n"
                        } else {
                            passed++; details += "${name} — PASSED\n"
                        }
                    }
                } else {
                    details = "No test results found (no surefire XML files)."
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

                // if committer empty, you may set a default email or skip emailext
                if (committer) {
                    emailext(to: committer, subject: "Build #${env.BUILD_NUMBER} – Selenium Test Results", body: emailBody)
                } else {
                    // fallback: email to job owner or just print to console
                    echo "No committer email found; not sending email. Test summary:\n${emailBody}"
                }
            }
        }
    }
}
