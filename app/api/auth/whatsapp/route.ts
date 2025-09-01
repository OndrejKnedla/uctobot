import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

// WhatsApp registration/login endpoint
export async function POST(request: Request) {
  try {
    const { phone, otp, name, companyName } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // If OTP is provided, verify it
    if (otp) {
      const user = await prisma.user.findUnique({
        where: { whatsappPhone: phone }
      })

      if (!user || user.whatsappOtp !== otp) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 401 }
        )
      }

      // Check if OTP is expired
      if (user.whatsappOtpExpiry && user.whatsappOtpExpiry < new Date()) {
        return NextResponse.json(
          { error: 'OTP expired' },
          { status: 401 }
        )
      }

      // Mark user as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          whatsappVerified: true,
          whatsappOtp: null,
          whatsappOtpExpiry: null,
          lastWhatsappActivity: new Date()
        }
      })

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, phone: user.whatsappPhone },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.whatsappPhone,
          companyName: user.companyName
        }
      })
    }

    // Generate OTP for new registration or login
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { whatsappPhone: phone }
    })

    if (user) {
      // Update existing user with new OTP
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          whatsappOtp: generatedOtp,
          whatsappOtpExpiry: otpExpiry
        }
      })
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          whatsappPhone: phone,
          name: name || 'Uživatel',
          companyName: companyName,
          whatsappOtp: generatedOtp,
          whatsappOtpExpiry: otpExpiry
        }
      })

      // Create trial subscription for new user
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'MONTHLY',
          status: 'TRIAL',
          price: 299,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      })
    }

    // TODO: Send OTP via WhatsApp using Twilio or WhatsApp Business API
    console.log(`OTP for ${phone}: ${generatedOtp}`)

    return NextResponse.json({
      success: true,
      message: 'OTP sent to WhatsApp',
      // In development, return OTP directly
      ...(process.env.NODE_ENV === 'development' && { otp: generatedOtp })
    })
  } catch (error) {
    console.error('WhatsApp auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}