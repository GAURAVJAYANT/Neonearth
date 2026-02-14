const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Sample Data (3 entries as requested)
const data = [
    { username: 'gaurav.jayant@groupbayport.com', password: 'Gaurav@123456' },
    { username: 'testuser2@example.com', password: 'Gaurav@123456' }, // Placeholder
    { username: 'testuser3@example.com', password: 'Gaurav@123456' }  // Placeholder
];

// Create Workbook
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);

xlsx.utils.book_append_sheet(wb, ws, "LoginData");

// Write File
const filePath = path.join(dataDir, 'login_data.xlsx');
xlsx.writeFile(wb, filePath);

console.log(`Excel file created at: ${filePath}`);
