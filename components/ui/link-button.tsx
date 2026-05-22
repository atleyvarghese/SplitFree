import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'

type Props = React.ComponentPropsWithoutRef<typeof Link> &
  VariantProps<typeof buttonVariants>

export function LinkButton({ variant = 'default', size = 'default', className, ...props }: Props) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
