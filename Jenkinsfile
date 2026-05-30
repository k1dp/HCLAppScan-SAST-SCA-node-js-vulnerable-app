pipeline {
    agent any

    environment {
        APPSCAN_KEY_ID     = credentials('appscan-key-id')
        APPSCAN_KEY_SECRET = credentials('appscan-key-secret')
        APPSCAN_APP_ID     = credentials('appscan-app-id')
        APPSCAN_SERVER_URL = credentials('appscan-server-url')
        // Path where SAClientUtil is installed on Jenkins machine
        APPSCAN_CLIENT     = 'C:\\appscan\\SAClientUtil\\bin\\appscan.bat'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Code checked out successfully"
            }
        }

        stage('Build') {
            steps {
                bat 'npm install'
                echo "Build complete"
            }
        }

        stage('AppScan Login') {
            steps {
                bat """
                    ${APPSCAN_CLIENT} api_login ^
                        -u %APPSCAN_KEY_ID% ^
                        -P %APPSCAN_KEY_SECRET% ^
                        -s %APPSCAN_SERVER_URL%
                """
            }
        }

        stage('SAST Scan') {
            steps {
                bat """
                    ${APPSCAN_CLIENT} prepare
                    ${APPSCAN_CLIENT} queue_analysis ^
                        -a %APPSCAN_APP_ID% ^
                        -t sast ^
                        -n "SAST-${BUILD_NUMBER}" ^
                        -s %APPSCAN_SERVER_URL% ^
                        -ot json ^
                        -o sast-results.json
                """
                archiveArtifacts artifacts: 'sast-results.json'
            }
        }

        stage('SCA Scan') {
            steps {
                bat """
                    ${APPSCAN_CLIENT} queue_analysis ^
                        -a %APPSCAN_APP_ID% ^
                        -t sca ^
                        -n "SCA-${BUILD_NUMBER}" ^
                        -s %APPSCAN_SERVER_URL% ^
                        -ot json ^
                        -o sca-results.json
                """
                archiveArtifacts artifacts: 'sca-results.json'
            }
        }

        stage('Security Gate') {
            steps {
                script {
                    def sast = readJSON file: 'sast-results.json'
                    def highCount = sast?.HighSeverityIssues ?: 0
                    def criticalCount = sast?.CriticalSeverityIssues ?: 0

                    echo "Critical Issues : ${criticalCount}"
                    echo "High Issues     : ${highCount}"

                    if (criticalCount > 0 || highCount > 0) {
                        currentBuild.result = 'FAILURE'
                        error("SECURITY GATE FAILED — Critical: ${criticalCount}, High: ${highCount}")
                    } else {
                        echo "Security Gate PASSED ✅"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished — build #${BUILD_NUMBER}"
            archiveArtifacts artifacts: '*.json', allowEmptyArchive: true
        }
        failure {
            echo "Build FAILED — check AppScan results"
            // Add email notification if mail plugin is configured
            // mail to: 'security@yourcompany.com',
            //      subject: "AppScan FAILED - Build #${BUILD_NUMBER}",
            //      body: "Check results at ${BUILD_URL}"
        }
        success {
            echo "Build PASSED — no critical security issues found"
        }
    }
}