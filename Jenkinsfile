// ============================================================
// Jenkinsfile — AppScan SAST + SCA Pipeline
// Alternative to GitHub Actions for Jenkins users
// ============================================================

pipeline {
    agent any

    environment {
        APPSCAN_KEY_ID     = credentials('appscan-key-id')
        APPSCAN_KEY_SECRET = credentials('appscan-key-secret')
        APPSCAN_APP_ID     = credentials('appscan-app-id')
        NODEJS_HOME        = tool 'NodeJS-16'
        PATH               = "${NODEJS_HOME}/bin:${env.PATH}"
    }

    triggers {
        // Auto-trigger on SCM changes
        pollSCM('H/5 * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'npm ci'
                echo 'Build complete.'
            }
        }

        // ── SCA: Dependency Scanning ────────────────────────
        stage('SCA — Dependency Scan') {
            parallel {

                stage('npm audit') {
                    steps {
                        sh '''
                            npm audit --json > npm-audit.json || true
                            echo "=== npm audit summary ==="
                            npm audit --audit-level=high || true
                        '''
                        archiveArtifacts artifacts: 'npm-audit.json'
                    }
                }

                stage('AppScan SCA') {
                    steps {
                        sh '''
                            # Install AppScan CLI if not cached
                            if [ ! -f "$HOME/appscan/bin/appscan.sh" ]; then
                                curl -sSL https://cloud.appscan.com/api/v2/Tools/SAClientUtil/Linux \
                                     -o SAClientUtil.zip
                                unzip SAClientUtil.zip -d $HOME/appscan
                            fi

                            $HOME/appscan/bin/appscan.sh api_login \
                                -u "$APPSCAN_KEY_ID" \
                                -P "$APPSCAN_KEY_SECRET"

                            $HOME/appscan/bin/appscan.sh queue_analysis \
                                -a "$APPSCAN_APP_ID" \
                                -t sca \
                                -n "SCA-Jenkins-${BUILD_NUMBER}" \
                                -ot json \
                                -o sca-results.json
                        '''
                        archiveArtifacts artifacts: 'sca-results.json'
                    }
                }
            }
        }

        // ── SAST: Source Code Scanning ───────────────────────
        stage('SAST — Static Code Analysis') {
            steps {
                sh '''
                    $HOME/appscan/bin/appscan.sh api_login \
                        -u "$APPSCAN_KEY_ID" \
                        -P "$APPSCAN_KEY_SECRET"

                    # Package source for SAST
                    $HOME/appscan/bin/appscan.sh prepare \
                        -n "SAST-Jenkins-${BUILD_NUMBER}"

                    # Submit to AppScan on Cloud
                    $HOME/appscan/bin/appscan.sh queue_analysis \
                        -a "$APPSCAN_APP_ID" \
                        -t sast \
                        -n "SAST-Jenkins-${BUILD_NUMBER}" \
                        -ot json \
                        -o sast-results.json
                '''
                archiveArtifacts artifacts: 'sast-results.json'
            }
        }

        // ── Security Gate ─────────────────────────────────────
        stage('Security Gate') {
            steps {
                script {
                    def sast = readJSON file: 'sast-results.json'
                    def highCount = sast?.HighSeverityIssues ?: 0

                    echo "High Severity SAST Issues: ${highCount}"

                    if (highCount > 0) {
                        currentBuild.result = 'FAILURE'
                        error("Build FAILED — ${highCount} High/Critical SAST issues found!")
                    } else {
                        echo "Security Gate PASSED ✅"
                    }
                }
            }
        }
    }

    post {
        always {
            // Publish results in Jenkins dashboard
            publishHTML([
                reportDir: '.',
                reportFiles: 'sast-results.json',
                reportName: 'AppScan SAST Report'
            ])
        }
        failure {
            emailext(
                subject: "SECURITY GATE FAILED — Build #${BUILD_NUMBER}",
                body: "AppScan found Critical issues. Check: ${BUILD_URL}",
                to: 'security-team@yourcompany.com'
            )
        }
        success {
            echo "Pipeline complete. No critical security issues."
        }
    }
}
