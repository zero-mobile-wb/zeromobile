declare module 'react-seven-segment-display' {
  import { FC } from 'react'

  interface SevenSegmentDisplayProps {
    value: string
    digitCount?: number
    digitHeight?: number
    digitWidth?: number
    digitSpacing?: number
    segmentThickness?: number
    segmentSpacing?: number
    segmentActiveColor?: string
    segmentInactiveColor?: string
    backgroundColor?: string
  }

  const SevenSegmentDisplay: FC<SevenSegmentDisplayProps>
  export default SevenSegmentDisplay
}
