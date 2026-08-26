import { afterEach } from 'vitest';
import prisma from '../src/lib/prisma.js';

afterEach(async () => {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['WordAnswer', 'Synonym', 'TestResult', 'Word', 'DaySet']) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
});
