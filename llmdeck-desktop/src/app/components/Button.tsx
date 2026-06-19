import { cx } from '~/utils'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import React from 'react'

export interface Props {
  text: string
  className?: string
  color?: 'primary' | 'flat'
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  onClick?: () => void
  isLoading?: boolean
  size?: 'small' | 'normal' | 'tiny'
  icon?: ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const size = props.size || 'normal'
  const type = props.type || 'button'
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        size === 'normal' && 'text-base font-medium px-6 py-[5px] rounded-full',
        size === 'small' && 'text-sm px-4 py-1 rounded-xl',
        size === 'tiny' && 'text-xs px-3 py-[3px] rounded-lg',
        props.color === 'primary' ? 'text-white bg-primary-blue' : 'text-primary-text bg-secondary',
        props.className,
      )}
      onClick={props.onClick}
    >
      {props.isLoading ? (
        <span
          className={cx(
            'block rounded-full border-2 border-current border-t-transparent animate-spin',
            size === 'normal' ? 'h-5 w-5' : 'h-3 w-3',
          )}
        />
      ) : (
        <div className="flex flex-row items-center gap-1 min-w-max">
          {props.icon}
          <span>{props.text}</span>
        </div>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
