pipeline {
    agent any

    environment {
        APPSCAN_KEY_ID     = credentials('appscan-key-id')
        APPSCAN_KEY_SECRET = credentials('appscan-key-secret')
        APPSCAN_APP_ID     = credentials('appscan-app-id')
        APPSCAN_SERVER_URL = credentials('appscan-server-url')
        APPSCAN_CLIENT     = 'C:\\appscan\\SAClientUtil.8.0.1646\\bin\\appscan.bat'
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
                bat '"%APPSCAN_CLIENT%" api_login -u %APPSCAN_KEY_ID% -P %APPSCAN_KEY_SECRET% -service_url %APPSCAN_SERVER_URL% -acceptssl'
            }
        }

        stage('SAST Scan') {
            steps {
                bat '"%APPSCAN_CLIENT%" prepare -acceptssl'
                bat '"%APPSCAN_CLIENT%" queue_analysis -a %APPSCAN_APP_ID% -n "SAST-%BUILD_NUMBER%" -sao -acceptssl'
            }
        }

        stage('SCA Scan') {
            steps {
                bat '"%APPSCAN_CLIENT%" prepare_sca -acceptssl'
                bat '"%APPSCAN_CLIENT%" queue_analysis -a %APPSCAN_APP_ID% -n "SCA-%BUILD_NUMBER%" -oso -acceptssl'
            }
        }
        stage('Security Gate') {
            steps {
                script {
                    echo "Scans submitted successfully to AppScan 360!"
                    echo "Login to AppScan 360 to view results"
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished — build #${BUILD_NUMBER}"
        }
        failure {
            echo "Build FAILED — check AppScan results"
        }
        success {
            echo "Build PASSED — scans submitted to AppScan 360"
        }
    }
}