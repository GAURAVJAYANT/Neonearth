
const { exec } = require('child_process');
const os = require('os');
const path = require('path');

class OpenReportReporter {
    async onEnd(result) {
        // Only open if we are in an environment that likely supports it (not CI)
        if (process.env.CI) {
            return;
        }

        console.log('Time to open the report automatically...');

        const reportPath = path.resolve('./test-results/report.html');

        let command;
        if (os.platform() === 'win32') {
            // Windows: use 'start'
            // We wrap path in quotes to handle spaces, and provide a dummy title "" for start command
            command = `start "" "${reportPath}"`;
        } else if (os.platform() === 'darwin') {
            // macOS
            command = `open "${reportPath}"`;
        } else {
            // Linux (xdg-open)
            command = `xdg-open "${reportPath}"`;
        }

        exec(command, (error) => {
            if (error) {
                console.error(`Failed to open report: ${error.message}`);
            } else {
                console.log(`Report opened: ${reportPath}`);
            }
        });
    }
}

module.exports = OpenReportReporter;
