import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const vcDir = dirname(fileURLToPath(import.meta.url));

const jobs = [
  {
    name: 'Рафаэль',
    html: join(vcDir, 'Rafael_vc_pdf.html'),
    output: join(vcDir, 'Rafael_vc.pdf'),
  },
  {
    name: 'Аделя',
    html: join(vcDir, 'Adelya_vc_pdf.html'),
    output: join(vcDir, 'Adelya_vc.pdf'),
  },
].map((job) => ({
  ...job,
  url: pathToFileURL(job.html).href,
}));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Installing Playwright Chromium if needed...');
run('npx', ['-y', 'playwright@latest', 'install', 'chromium']);

console.log('Generating festival VC PDFs...');
for (const job of jobs) {
  run('npx', [
    '-y',
    'playwright@latest',
    'pdf',
    '--paper-format',
    'A4',
    '--viewport-size',
    '1240,1754',
    '--wait-for-timeout',
    '1000',
    job.url,
    job.output,
  ]);
}
