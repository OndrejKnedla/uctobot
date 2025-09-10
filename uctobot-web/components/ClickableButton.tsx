"use client"

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'

interface ClickableButtonProps extends ButtonProps {
  onClick?: () => void
}

const ClickableButton: React.FC<ClickableButtonProps> = ({ onClick, ...props }) => {
  return <Button onClick={onClick} {...props} />
}

export default ClickableButton