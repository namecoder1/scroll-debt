import { cn } from '@/lib/utils'
import React from 'react'
import { TouchableOpacity } from 'react-native'

const Button = ({
  onPress,
  children,
  className,
  disabled,
  size = 'sm',
  variant = 'default'
}: {
  onPress: () => void,
  children: React.ReactNode,
  className?: string,
  disabled?: boolean,
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  variant?: 'default' | 'outline' | 'accent' | 'destructive'
}) => {

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={cn('border-2 flex flex-row items-center gap-2',
        size === 'xs' ? 'text-xs rounded-xl px-3 py-1' :
          size === 'sm' ? 'text-xs rounded-xl px-4 py-1.5' :
            size === 'md' ? 'text-xs rounded-xl px-4.5 py-2' :
              size === 'lg' ? 'text-lg rounded-xl px-5 py-3' :
                size === 'xl' ? 'text-xl rounded-2xl px-6 py-4' :
                  'text-md rounded-xl',
        variant === 'default' ? 'bg-primary hover:bg-primary/80 text-primary-foreground border-transparent' :
          variant === 'outline' ? 'bg-neutral-300 dark:bg-neutral-900 hover:bg-neutral-200 border-neutral-400/70 dark:border-neutral-800 text-foreground' :
            variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-transparent' :
              variant === 'accent' ? 'bg-red-300 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-accent-foreground border-red-400/80 dark:border-red-900' :
                '',
        disabled ? 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500' : 'hover:bg-accent/10',
        className)}
    >
      {children}
    </TouchableOpacity>
  )
}

export default Button