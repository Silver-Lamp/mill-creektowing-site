import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.resolve(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    console.log('Creating logs directory...');
    fs.mkdirSync(logsDir);
}

// Create a test log file
const logFile = path.join(logsDir, `test-${Date.now()}.log`);
console.log('Attempting to write to:', logFile);

// Try to write to the log file
try {
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    logStream.write('Test log entry\n');
    logStream.end();
    console.log('Successfully wrote to log file');
} catch (error) {
    console.error('Error writing to log file:', error);
} 