import { useState } from 'react'

// Password input with an eye-icon toggle to reveal/hide the value.
// Drop-in replacement for <input type="password" ...> — accepts all the same
// props and forwards them to the underlying <input>.
export default function PasswordInput({
  value,
  onChange,
  className = 'form-control',
  disabled,
  required,
  placeholder,
  autoComplete = 'current-password',
  id,
  name,
  ...rest
}) {
  const [shown, setShown] = useState(false)

  return (
    <div className="position-relative">
      <input
        {...rest}
        id={id}
        name={name}
        type={shown ? 'text' : 'password'}
        className={className}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ paddingRight: '2.5rem', ...(rest.style || {}) }}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShown((s) => !s)}
        tabIndex={-1}
        aria-label={shown ? 'Hide password' : 'Show password'}
        title={shown ? 'Hide password' : 'Show password'}
      >
        <i className={`fas ${shown ? 'fa-eye-slash' : 'fa-eye'}`}></i>
      </button>
    </div>
  )
}
