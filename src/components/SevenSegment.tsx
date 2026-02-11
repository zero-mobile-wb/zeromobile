interface SevenSegmentProps {
  value: string
  size?: number
  color?: string
}

export default function SevenSegment({ value, size = 200, color = '#ff0000' }: SevenSegmentProps) {
  const segments = {
    '0': [true, true, true, true, true, true, false],
    '1': [false, true, true, false, false, false, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, true, true, false, false, true],
    '4': [false, true, true, false, false, true, true],
    '5': [true, false, true, true, false, true, true],
    '6': [true, false, true, true, true, true, true],
    '7': [true, true, true, false, false, false, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, true, false, true, true],
  }

  const activeSegments = segments[value as keyof typeof segments] || segments['0']
  const inactiveColor = color === '#000000' ? '#e0e0e0' : '#220000'

  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 100 160">
      {/* Top - a */}
      <polygon
        points="20,10 30,0 70,0 80,10 70,20 30,20"
        fill={activeSegments[0] ? color : inactiveColor}
      />

      {/* Top Right - b */}
      <polygon
        points="80,10 90,20 90,70 80,80 70,70 70,20"
        fill={activeSegments[1] ? color : inactiveColor}
      />

      {/* Bottom Right - c */}
      <polygon
        points="80,80 90,90 90,140 80,150 70,140 70,90"
        fill={activeSegments[2] ? color : inactiveColor}
      />

      {/* Bottom - d */}
      <polygon
        points="20,150 30,160 70,160 80,150 70,140 30,140"
        fill={activeSegments[3] ? color : inactiveColor}
      />

      {/* Bottom Left - e */}
      <polygon
        points="10,90 20,80 30,90 30,140 20,150 10,140"
        fill={activeSegments[4] ? color : inactiveColor}
      />

      {/* Top Left - f */}
      <polygon
        points="10,20 20,10 30,20 30,70 20,80 10,70"
        fill={activeSegments[5] ? color : inactiveColor}
      />

      {/* Middle - g */}
      <polygon
        points="20,75 30,70 70,70 80,75 80,85 70,90 30,90 20,85"
        fill={activeSegments[6] ? color : inactiveColor}
      />
    </svg>
  )
}
