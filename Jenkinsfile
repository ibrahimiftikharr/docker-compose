pipeline {
    agent any
    triggers { githubPush() }

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
                sh 'sleep 20'   // give your MERN app time to start
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
                    image 'markhobson/maven-chrome:jdk-11'
                    args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2 --network jobify-ci_default'
                }
            }
            steps {
                dir('tests') {
                    sh 'mvn -B test'
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
                // Simple & safe way to get the last committer email of the app repo
                def committer = sh(script: "git log -1 --pretty=format:%ae", returnStdout: true).trim()
                if (!committer || committer == '') {
                    committer = 'ibrahimiftikharr@hotmail.com'
                }

                // Count tests from Surefire reports (safe even if no reports exist)
                def reportFiles = findFiles(glob: 'tests/target/surefire-reports/*.xml')
                def total = 0
                def passed = 0
                def failed = 0
                def skipped = 0
                def details = ""

                if (reportFiles.length == 0) {
                    details = "No test reports were generated — tests probably didn’t run."
                } else {
                    reportFiles.each { file ->
                        def content = readFile(file.path)
                        content.findAll(~/<testcase[^>]*>/).each { tc ->
                            total++
                            def name = (tc =~ /name="([^"]+)"/)[0][1]
                            if (content =~ /<failure|<error/) {
                                failed++
                                details += "${name} — FAILED\n"
                            } else if (tc =~ /skipped=/ || content =~ /<skipped/) {
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
Jobify CI — Build #${env.BUILD_NUMBER}
Status      : ${currentBuild.currentResult}
Total Tests : ${total}
Passed      : ${passed}
Failed      : ${failed}
Skipped     : ${skipped}

${details}
Jenkins URL : ${env.BUILD_URL}
"""

                emailext(
                    to: committer,
                    subject: "Jobify CI #${env.BUILD_NUMBER} — ${currentBuild.currentResult}",
                    body: emailBody,
                    mimeType: 'text/plain'
                )

                // Clean workspace
                sh 'docker-compose down --remove-orphans || true'
            }
        }
    }
}
