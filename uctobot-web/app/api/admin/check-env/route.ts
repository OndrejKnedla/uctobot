import { NextResponse } from 'next/server'

export async function GET() {
  const hasPassword = !!process.env.ADMIN_PASSWORD
  const passwordLength = process.env.ADMIN_PASSWORD?.length || 0
  
  return NextResponse.json({
    hasPassword,
    passwordLength,
    message: hasPassword 
      ? `Password is set (${passwordLength} characters)` 
      : 'ADMIN_PASSWORD not found in environment',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  })
}