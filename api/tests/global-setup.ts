import { execSync } from 'node:child_process';

export default function globalSetup(): void {
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: 'mysql://root:root@localhost:3307/vocab_test' },
    stdio: 'inherit',
  });
}
