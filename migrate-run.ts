import { exec } from 'child_process';

const command = `npm run typeorm migration:run ./src/database/migrations/1732638245984-testing.ts`;

(() => exec(command, (error, stdout, stderr) => {
  if (error !== null) {
    console.error(stderr);
  }
  console.log(stdout);
}))();
