import Image from 'next/image';

interface JobmoraLogoProps {
  className?: string;
  size?: number;
}

export function JobmoraLogo({ className, size = 32 }: JobmoraLogoProps) {
  return (
    <Image
      src="/jobmora-logo.svg"
      alt="Jobmora"
      width={size}
      height={size}
      className={className}
    />
  );
}
