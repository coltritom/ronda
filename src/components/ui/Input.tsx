/*
  Input reutilizable con label y mensaje de error integrados.
  Uso: <Input label="Email" type="email" error={errors.email} />
*/
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-body text-sm font-medium text-humo">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-[10px] border-[1.5px] bg-noche
            px-3.5 py-2.5 font-body text-[15px] text-humo
            placeholder:text-niebla
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${error ? 'border-error focus:ring-error/30' : 'border-niebla/20'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="font-body text-xs text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
