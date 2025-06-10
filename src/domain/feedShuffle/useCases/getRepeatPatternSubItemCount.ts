import { InFeedProperties } from '../../types/feed.model'

export const getRepeatPatternSubItemCount = (
  repeatPattern: InFeedProperties['repeatPattern'],
  feedLength: number
): number => {
  let subItemCount = 0
  let repeatPatternInterval = 0
  if (
    repeatPattern &&
    repeatPattern.every((item) => item.repeatEvery > 0 && item.itemsToAdd > 0)
  ) {
    for (const pattern of repeatPattern) {
      repeatPatternInterval += pattern.repeatEvery
      subItemCount += pattern.itemsToAdd
    }
    return Math.floor(
      Math.floor(feedLength / repeatPatternInterval) * subItemCount
    )
  }
  return 0
}
