pipeline {
agent {
    docker {
        image 'selenium/standalone-chrome:latest'
        args '-u root:root -v /var/lib/jenkins/.m2:/root/.m2'
    }
}


    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/ibrahimiftikharr/test-cases.git'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'mvn test'
            }
        }

        stage('Publish Test Results') {
            steps {
                junit '**/target/surefire-reports/*.xml'
            }
        }
    }

    post {
        always {
            script {
                sh "git config --global --add safe.directory ${env.WORKSPACE}"
                def committer = sh(script: "git log -1 --pretty=format:'%ae'", returnStdout: true).trim()
                def raw = sh(script: "grep -h \"<testcase\" target/surefire-reports/*.xml || true", returnStdout: true).trim()

                int total = 0, passed = 0, failed = 0, skipped = 0
                def details = ""

                if(raw) {
                    raw.split('\n').each { line ->
                        total++
                        def name = (line =~ /name=\"([^\"]+)\"/)[0][1]
                        if(line.contains("<failure")) { failed++; details += "${name} — FAILED\n" }
                        else if(line.contains("<skipped") || line.contains("</skipped>")) { skipped++; details += "${name} — SKIPPED\n" }
                        else { passed++; details += "${name} — PASSED\n" }
                    }
                } else {
                    details = "No test results found."
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
                if(committer) {
                    emailext(to: committer, subject: "Build #${env.BUILD_NUMBER} Test Results", body: emailBody)
                }
            }
        }
    }
}
