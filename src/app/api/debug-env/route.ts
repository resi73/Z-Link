import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface DebugInfo {
  databaseUrlDefined: boolean;
  databaseUrlLength: number;
  databaseUrlPrefix: string | null;
  directUrlDefined: boolean;
  directUrlLength: number;
  directUrlPrefix: string | null;
  error: string | null;
  stack: string | null;
  connectionSuccess: boolean;
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  const debugInfo: DebugInfo = {
    databaseUrlDefined: !!dbUrl,
    databaseUrlLength: dbUrl ? dbUrl.length : 0,
    databaseUrlPrefix: dbUrl ? dbUrl.split('@')[0] : null,
    directUrlDefined: !!directUrl,
    directUrlLength: directUrl ? directUrl.length : 0,
    directUrlPrefix: directUrl ? directUrl.split('@')[0] : null,
    error: null,
    stack: null,
    connectionSuccess: false,
  };

  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    debugInfo.connectionSuccess = true;
    await prisma.$disconnect();
  } catch (err) {
    const errorObject = err instanceof Error ? err : new Error(String(err));
    debugInfo.error = errorObject.message;
    debugInfo.stack = errorObject.stack || null;
  }

  return NextResponse.json(debugInfo);
}
