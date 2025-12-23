import { cn } from '@/lib/utils'
import React from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'outline' | 'accent' | 'destructive'
}

const Button = ({
  children,
  className,
  disabled,
  size = 'sm',
  variant = 'default',
  ...props
}: ButtonProps) => {

  return (
    <TouchableOpacity
      disabled={disabled}
      className={cn('border-2 flex flex-row items-center gap-2',
        size === 'xs' ? 'text-xs rounded-xl px-3 py-1' :
          size === 'sm' ? 'text-xs rounded-xl px-4 py-1.5' :
            size === 'md' ? 'text-xs rounded-xl px-4.5 py-2' :
              size === 'lg' ? 'text-lg rounded-xl px-5 py-3' :
                size === 'xl' ? 'text-xl rounded-2xl px-6 py-4' :
                  'text-md rounded-xl',
        variant === 'default' ? 'bg-primary hover:bg-primary/80 text-primary-foreground border-transparent' :
          variant === 'outline' ? 'bg-muted/60 dark:bg-muted/60 hover:bg-neutral-200 border-neutral-400/20 dark:border-secondary/40 text-foreground' :
            variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-transparent' :
              variant === 'accent' ? 'bg-red-300 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-accent-foreground border-red-400/80 dark:border-red-900' :
                '',
        disabled ? 'bg-muted/70 dark:bg-muted/90 border-muted dark:border-secondary/30 text-neutral-400 dark:text-neutral-500' : 'hover:bg-accent/10',
        className)}
      {...props}
    >
      {children}
    </TouchableOpacity>
  )
}

export default Button