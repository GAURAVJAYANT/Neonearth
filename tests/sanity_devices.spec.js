const { test, devices } = require('@playwright/test');

console.log('Devices:', devices ? 'OK' : 'FAIL');

test.describe('Sanity Group', () => {
    console.log('Inside describe');
    const pixel5 = devices['Pixel 5'];
    console.log('Use Pixel 5:', pixel5 ? 'OK' : 'FAIL');
    test.use({ ...pixel5 });

    test('devices sanity check wrapped', async ({ page }) => {
        console.log('Devices check running inside describe');
    });
});
