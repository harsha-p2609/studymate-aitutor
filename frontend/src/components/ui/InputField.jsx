// ============================================================
// components/ui/InputField.jsx
// Reusable input field with icon, label, password toggle,
// and error message display
// ============================================================

import { useState } from "react";

// ── Eye / Eye-Off SVG Icons ──────────────────────────────────
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/**
 * InputField component
 * @param {string}   id          - Unique element ID (required for accessibility)
 * @param {string}   label       - Field label text
 * @param {string}   type        - Input type: text | email | password
 * @param {string}   placeholder - Placeholder text
 * @param {ReactNode} icon       - Leading icon SVG
 * @param {string}   error       - Error message to display below input
 * @param {string}   labelAction - Optional right-side link component
 * @param {object}   register    - react-hook-form register object
 * @param {object}   rest        - Any other input props
 */
const InputField = ({
  id,
  label,
  type = "text",
  placeholder,
  icon,
  error,
  labelAction,
  register,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="field-group">
      {/* Label Row */}
      {(label || labelAction) && (
        <div className="field-label-row">
          {label && (
            <label htmlFor={id} className="field-label">
              {label}
            </label>
          )}
          {labelAction && labelAction}
        </div>
      )}

      {/* Input Wrapper */}
      <div className="input-wrapper">
        {/* Leading Icon */}
        {icon && (
          <span className="input-icon" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Input Element */}
        <input
          id={id}
          type={resolvedType}
          placeholder={placeholder}
          className={`input-field ${error ? "input-error" : ""}`}
          style={!icon ? { paddingLeft: "16px" } : undefined}
          autoComplete={isPassword ? "current-password" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          {...(register || {})}
          {...rest}
        />

        {/* Password Toggle Button */}
        {isPassword && (
          <button
            type="button"
            className="input-toggle-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
