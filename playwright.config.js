// @ts-check
const { defineConfig } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
  reporter: [
    ['monocart-reporter', {
      name: "Test Automation Dashboard",
      outputFile: './test-results/report.html',

      // Professional, consistent tag styling
      tags: {
        smoke: {
          style: 'background: #5c2b29; color: #fff; border-radius: 2px; padding: 2px 8px; font-size: 12px;'
        },
        sanity: {
          style: 'background: #2c5c29; color: #fff; border-radius: 2px; padding: 2px 8px; font-size: 12px;'
        },
        regression: {
          style: 'background: #174ea6; color: #fff; border-radius: 2px; padding: 2px 8px; font-size: 12px;'
        },
        e2e: {
          style: 'background: #5c4e29; color: #fff; border-radius: 2px; padding: 2px 8px; font-size: 12px;'
        }
      },

      // Columns configuration
      columns: [
        (row) => row.id, // index
        { name: 'Title', width: 500, formatter: (value, row) => row.title },
        { name: 'Status', width: 100, formatter: (value, row) => row.status },
        { name: 'Owner', width: 100, formatter: (value, row) => row.owner },
        {
          name: 'Output', width: 200, formatter: (value, row) => {
            if (row.output) return row.output;
            return '';
          }
        },
        { name: 'Duration', width: 100, formatter: (value, row) => row.duration },
        { name: 'Start Time', width: 150, formatter: (value, row) => row.startTime },
        { name: 'End Time', width: 150, formatter: (value, row) => row.endTime },
      ],

      // Pie chart included by default in the dashboard
      trend: true, // simplified trend chart

      visitor: (data, metadata) => {
        // 1. System Metadata
        const os = require('os');
        metadata.system = {
          'Platform': os.platform(),
          'Release': os.release(),
          'Architecture': os.arch(),
          'Hostname': os.hostname(),
          'User': os.userInfo().username,
          'Node Version': process.version,
        };

        // 2. Extract @owner from test title or annotations & Output (stdout)
        const processItem = (item) => {
          if (item.type === 'test') {
            // -- Owner Extraction --
            if (item.annotations && item.annotations.length > 0) {
              const ownerAnnotation = item.annotations.find(a => a.type === 'owner');
              if (ownerAnnotation) item.owner = ownerAnnotation.description;
            }
            if (!item.owner && item.title.includes('@owner:')) {
              const match = item.title.match(/@owner:(\w+)/);
              if (match) item.owner = match[1];
            }

            // -- Output (Stdout) Extraction --
            // Monocart/Playwright often stores stdOut in the item
            if (item.stdOut && item.stdOut.length > 0) {
              // Extract text from object or string
              const logs = item.stdOut.map(o => typeof o === 'string' ? o : o.text).join('\n');
              // Truncate to keep grid clean, show only first 100 chars
              item.output = logs.length > 100 ? logs.substring(0, 100) + '...' : logs;
            }
          }
          // Recursive traverse
          if (item.suite || item.tests) {
            if (item.items) item.items.forEach(processItem);
            if (item.suite) item.suite.forEach(processItem); // rare usage in some versions
          }
        };

        if (data.items) data.items.forEach(processItem);
      }
    }]
  ],
  use: {
    screenshot: 'only-on-failure',
    browserName: 'chromium',
    //browserName: 'firefox',
    headless: false, // ✅ Browser will open in headless mode
    viewport: null,
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
});