import { afterEach } from 'vitest';
import prisma from '../src/lib/prisma.js';

afterEach(async () => {
  // $transaction ghim toàn bộ statement lên MỘT connection — bắt buộc,
  // vì SET FOREIGN_KEY_CHECKS là session-scoped mà Prisma dùng pool.
  await prisma.$transaction([
    prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0'),
    ...['WordAnswer', 'Synonym', 'TestResult', 'Word', 'DaySet'].map(
      (table) => prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``),
    ),
    prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1'),
  ]);
});
