import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  const debugInfo = {
    databaseUrlDefined: !!dbUrl,
    databaseUrlLength: dbUrl ? dbUrl.length : 0,
    databaseUrlPrefix: dbUrl ? dbUrl.split('@')[0] : null,
    directUrlDefined: !!directUrl,
    directUrlLength: directUrl ? directUrl.length : 0,
    directUrlPrefix: directUrl ? directUrl.split('@')[0] : null,
    error: null as any,
    stack: null as any,
    connectionSuccess: false,
  };

  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    debugInfo.connectionSuccess = true;
    await prisma.$disconnect();
  } catch (err: any) {
    debugInfo.error = err?.message || String(err);
    debugInfo.stack = err?.stack || null;
  }

  return NextResponse.json(debugInfo);
}
