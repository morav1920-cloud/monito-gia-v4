export function MonitoLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Monito gIA"
    >
      {/* orejas */}
      <circle cx="11" cy="27" r="9" fill="#84A59D" />
      <circle cx="53" cy="27" r="9" fill="#84A59D" />
      <circle cx="11" cy="27" r="4.5" fill="#F5CAC3" />
      <circle cx="53" cy="27" r="4.5" fill="#F5CAC3" />
      {/* cabeza */}
      <circle cx="32" cy="32" r="24" fill="#563E79" />
      {/* cara */}
      <ellipse cx="32" cy="39" rx="16" ry="14" fill="#F7EDE2" />
      {/* ojos */}
      <circle cx="25.5" cy="33" r="3.4" fill="#3F2B5C" />
      <circle cx="38.5" cy="33" r="3.4" fill="#3F2B5C" />
      <circle cx="26.6" cy="31.8" r="1.1" fill="#FDF8F1" />
      <circle cx="39.6" cy="31.8" r="1.1" fill="#FDF8F1" />
      {/* sonrisa */}
      <path
        d="M26 44 q6 5 12 0"
        stroke="#3F2B5C"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* chispa gIA */}
      <path
        d="M47 7 l1.7 3.6 3.6 1.7 -3.6 1.7 -1.7 3.6 -1.7 -3.6 -3.6 -1.7 3.6 -1.7 z"
        fill="#FFCE80"
      />
    </svg>
  );
}
