'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestEmailPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const sendTestEmail = async () => {
    setLoading(true)
    setStatus('Sending email...')
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'realok.2001@gmail.com'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStatus('✅ Email sent successfully!')
      } else {
        setStatus(`❌ Email failed: ${data.error}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Test Email</h1>
        
        <Button 
          onClick={sendTestEmail} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Sending...' : 'Send Test Email to realok.2001@gmail.com'}
        </Button>
        
        {status && (
          <div className="p-4 bg-gray-100 rounded">
            {status}
          </div>
        )}
      </div>
    </div>
  )
}