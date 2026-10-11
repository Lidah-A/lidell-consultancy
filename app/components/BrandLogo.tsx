export default function BrandLogo({ size = 40 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <title>Lidell Consultancy logo</title>
      <g stroke="var(--brand-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* two intersecting globes */}
        <circle cx="22" cy="32" r="14" opacity="0.95" />
        <circle cx="42" cy="32" r="14" opacity="0.95" />
        {/* subtle bridge across both globes */}
        <path d="M12 34 C22 22, 42 22, 52 34" stroke="var(--brand-500)" strokeWidth="3" fill="none" />
        {/* link arc below to suggest connection */}
        <path d="M14 38 C24 46, 40 46, 50 38" stroke="var(--brand-500)" strokeWidth="1.8" fill="none" opacity="0.9" />
      </g>
    </svg>
  )
}
