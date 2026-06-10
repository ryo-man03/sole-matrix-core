type CandidateFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  inputMode?: "numeric";
  multiline?: boolean;
  required?: boolean;
};

export function CandidateField({
  id,
  label,
  value,
  placeholder,
  onChange,
  error,
  helper,
  inputMode,
  multiline = false,
  required = false,
}: CandidateFieldProps) {
  const describedBy = [
    helper ? `${id}-helper` : undefined,
    error ? `${id}-error` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="candidate-field">
      <label className="candidate-label" htmlFor={id}>
        {label}
        {required ? <span className="candidate-required">必須</span> : null}
      </label>
      {multiline ? (
        <textarea
          aria-describedby={describedBy || undefined}
          className="candidate-textarea"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          value={value}
        />
      ) : (
        <input
          aria-describedby={describedBy || undefined}
          className="candidate-input"
          id={id}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      )}
      {helper ? (
        <p className="candidate-field-helper" id={`${id}-helper`}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p className="candidate-field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
