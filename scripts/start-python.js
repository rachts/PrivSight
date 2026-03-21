const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const pythonPath = path.join(__dirname, '../python');

console.log('Starting Python backend from:', pythonPath);

const pythonProcess = spawn('python', ['-m', 'server'], {
  cwd: pythonPath,
  stdio: 'inherit'
});

pythonProcess.on('error', (err) => {
  console.error('Failed to start python process:', err);
});

pythonProcess.on('exit', (code) => {
  console.log(`Python process exited with code ${code}`);
});

process.on('SIGTERM', () => {
    pythonProcess.kill();
});
process.on('SIGINT', () => {
    pythonProcess.kill();
});
