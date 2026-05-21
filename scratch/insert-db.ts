import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inserting a test record into Supabase...');
  try {
    const result = await prisma.shortUrl.create({
      data: {
        originalUrl: 'https://google.com',
        shortCode: 'test12',
        title: 'Google Test'
      }
    });
    console.log('Successfully inserted! Record:', result);
  } catch (error) {
    console.error('Insert failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
