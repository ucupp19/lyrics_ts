import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

function runStartAll() {
  // Spawn the npm run start-all command
  const childProcess = spawn('npm', ['run', 'start-all'], {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  // Pipe stdout and stderr to the main process
  childProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  childProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  // Handle child process exit
  childProcess.on('exit', (code, signal) => {
    console.log(`Child process exited with code ${code} and signal ${signal}`);
    process.exit(code === null ? 0 : code);
  });

  // Handle termination signals to kill child process properly
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`Received ${signal}, terminating child process...`);
      childProcess.kill(signal);
      process.exit();
    });
  });
}

runStartAll();
