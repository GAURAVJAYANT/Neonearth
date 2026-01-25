const { spawn } = require('child_process');

async function globalTeardown() {
    console.log('\n🎉 Tests completed! Opening Allure report...\n');

    // Spawn Allure server process in detached mode so it stays alive
    const allureProcess = spawn('npx', ['allure', 'serve', 'allure-results'], {
        detached: true,
        stdio: 'ignore',
        shell: true,
    });

    // Unref so the parent process can exit while Allure server runs
    allureProcess.unref();

    console.log('✅ Allure report server is starting...');
    console.log('📊 Your browser should open automatically with the report.\n');
}

module.exports = globalTeardown;
