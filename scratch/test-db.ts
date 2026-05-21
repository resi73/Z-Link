import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all rows from database...');
  try {
    const result = await prisma.shortUrl.findMany();
    console.log('Rows in db:', result);
  } catch (error) {
    console.error('Failed to query db:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
