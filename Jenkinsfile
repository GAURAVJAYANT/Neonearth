pipeline {
    agent any

    environment {
        // Ensure CI env var is set so our custom reporter doesn't try to open the browser popup
        CI = 'true'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                // For Linux agents use 'sh', for Windows agents use 'bat' or 'powershell'
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }

        stage('Install Browsers') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npx playwright install --with-deps'
                    } else {
                        bat 'npx playwright install --with-deps'
                    }
                }
            }
        }

        stage('Run Playwright Tests') {
            steps {
                script {
                    // catchError allows the pipeline to continue to the Reporting stage even if tests fail
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        if (isUnix()) {
                            sh 'npx playwright test'
                        } else {
                            bat 'npx playwright test'
                        }
                    }
                }
            }
        }

        stage('Generate PDF Report') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'node generate-pdf-report.js'
                    } else {
                        bat 'node generate-pdf-report.js'
                    }
                }
            }
        }
    }

    post {
        always {
            // Archive the test results (HTML and PDF) so they are downloadable from the build page
            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
            
            // Optional: Publish HTML Report (Requires "HTML Publisher" plugin in Jenkins)
            // publishHTML([
            //     allowMissing: false,
            //     alwaysLinkToLastBuild: true,
            //     keepAll: true,
            //     reportDir: 'test-results',
            //     reportFiles: 'report.html',
            //     reportName: 'Playwright Test Report',
            //     reportTitles: 'Automation Dashboard'
            // ])
        }
    }
}
