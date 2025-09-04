import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: '100px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          D
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}