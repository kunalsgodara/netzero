export default function CompanyLogo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      
      <polygon
        points="50,4 92,27 92,73 50,96 8,73 8,27"
        fill="#0d9488"
        stroke="#0f766e"
        strokeWidth="2"
      />
      
      <polygon
        points="50,4 8,27 29,50 50,27"
        fill="#14b8a6"
      />
      
      <polygon
        points="50,4 92,27 71,50 50,27"
        fill="#0d9488"
      />
      
      <polygon
        points="8,27 8,73 29,50"
        fill="#0f766e"
      />
      
      <polygon
        points="92,27 92,73 71,50"
        fill="#0a6660"
      />
      
      <polygon
        points="8,73 50,96 29,50"
        fill="#0d9488"
      />
      
      <polygon
        points="92,73 50,96 71,50"
        fill="#14b8a6"
      />
      
      <polygon
        points="29,50 50,27 71,50 50,73"
        fill="#2dd4bf"
      />
      
      <line x1="50" y1="4"  x2="29" y2="50" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="50" y1="4"  x2="71" y2="50" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="8"  y1="27" x2="71" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1="92" y1="27" x2="29" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1="8"  y1="73" x2="71" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1="92" y1="73" x2="29" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      
    </svg>
  )
}
