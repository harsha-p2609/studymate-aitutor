// ============================================================
// components/ui/Button.jsx
// Reusable primary button with loading spinner
// ============================================================

const Button = ({
  children,
  isLoading = false,
  disabled = false,
  type = "button",
  onClick,
  id,
  className = "",
}) => {
  return (
    <button
      id={id}
      type={type}
      className={`btn-primary ${className}`}
      disabled={isLoading || disabled}
      onClick={onClick}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
