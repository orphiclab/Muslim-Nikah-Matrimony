import Image from 'next/image';

/**
 * Renders the correct Muslim avatar based on gender.
 * Falls back to initials-based circle if neither male nor female.
 */
interface ProfileAvatarProps {
  gender?: string | null;
  name?: string | null;
  className?: string;
  size?: number; // px, used for Image width/height
}

export function ProfileAvatar({ gender, name, className = 'w-full h-full', size = 200 }: ProfileAvatarProps) {
  const isMale   = gender?.toUpperCase() === 'MALE';
  const isFemale = gender?.toUpperCase() === 'FEMALE';

  if (isMale || isFemale) {
    const src = isMale ? '/avatar-male.png' : '/avatar-female.png';
    const alt = isMale ? 'Muslim male avatar' : 'Muslim female avatar';
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'cover' }}
        priority={false}
      />
    );
  }

  // Fallback: initial circle
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-2xl ${className}`}>
      {initial}
    </div>
  );
}
