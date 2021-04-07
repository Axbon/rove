import fs from 'fs';
import path from 'path';
import { create } from '../src/apis';

test('create migration', async () => {
  const file = await create({
    migrationDir: 'tests/tmp',
    migrationName: 'science-alert',
  });

  const filenameWithoutTs = file.split('-').slice(1).join('-');
  const filepath = path.join(process.cwd(), `tests/tmp/${file}`);
  const exists = fs.existsSync(filepath);

  expect(filenameWithoutTs).toBe('science-alert.sql');
  expect(exists).toBe(true);

  //Cleanup
  if (exists) {
    fs.unlinkSync(filepath);
  }
});

test('create migration error handling', async () => {
  await expect(
    create({
      migrationDir: 'tests/none-existing-path',
      migrationName: 'to-create-is-to-conquer',
    })
  ).rejects.toThrow();
});
