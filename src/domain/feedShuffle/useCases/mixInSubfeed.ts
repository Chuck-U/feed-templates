import { CenterFeedPlacement, FeedProperty } from '@/types/models'
import { isNonEmptyArray, isNumber } from '../../../utils/checks'

const hasRepeatOrPattern = (feedProperty: FeedProperty): boolean =>
  isNumber(feedProperty.inFeed?.repeatEvery) ||
  isNonEmptyArray(feedProperty.inFeed?.repeatPattern)

const useRepeatPattern = (
  repeatInterval: number,
  feedProperty: FeedProperty
) => {
  if (
    feedProperty?.inFeed &&
    isNonEmptyArray(feedProperty.inFeed?.repeatPattern) &&
    feedProperty.inFeed?.repeatPattern
  ) {
    const { repeatPattern } = feedProperty.inFeed
    const normalizedIndex = repeatInterval % repeatPattern?.length
    return repeatPattern[normalizedIndex]
  }
  return undefined
}

export const AddItemsToSubFeed = (
  feed: CenterFeedPlacement[],
  subFeeds: CenterFeedPlacement[][] | CenterFeedPlacement[] | [],
  feedProperty: FeedProperty,
  positionStart: number
) => {
  const normalizedSubFeeds = Array.isArray(subFeeds[0])
    ? (subFeeds as CenterFeedPlacement[][])
    : [subFeeds as CenterFeedPlacement[]]

  if (
    !isNonEmptyArray(normalizedSubFeeds) ||
    !hasRepeatOrPattern(feedProperty) ||
    !normalizedSubFeeds.some((subFeed) => isNonEmptyArray(subFeed))
  ) {
    return feed
  }

  const parentFeed: CenterFeedPlacement[] = feed
  const itemsToBeAdded = normalizedSubFeeds

  if (isNonEmptyArray(feedProperty.inFeed?.repeatPattern)) {
    const feedItems = addItemsWithRepeatPattern({
      feed: parentFeed,
      subFeeds: itemsToBeAdded,
      feedProperty
    })
      .filter(Boolean)
      .flat()
      .sort((a, b) => (a.feedPosition as number) - (b.feedPosition as number))
      .map((item, index) => {
        return { ...item, feedPosition: index + positionStart }
      }) as CenterFeedPlacement[]
    return feedItems
  }

  const feedItems = addItemsToSubFeedWithRepeatEvery({
    feed: parentFeed,
    subFeeds: itemsToBeAdded,
    feedProperty,
    positionStart
  })
    .filter(Boolean)
    .flat()
    .sort((a: CenterFeedPlacement, b: CenterFeedPlacement) => {
      return (a.feedPosition as number) - (b.feedPosition as number)
    })
    .map((item, index) => {
      return { ...item, feedPosition: index + positionStart }
    }) as CenterFeedPlacement[]
  return feedItems
}

export const addItemsWithRepeatPattern = ({
  feed,
  subFeeds,
  feedProperty
}: {
  feed: CenterFeedPlacement[]
  subFeeds: CenterFeedPlacement[][]
  feedProperty: FeedProperty
}) => {
  if (
    !isNonEmptyArray(feedProperty.inFeed?.repeatPattern) ||
    !isNonEmptyArray(subFeeds)
  ) {
    return feed
  }

  const parentFeed: CenterFeedPlacement[] = feed
  const itemsToBeAdded = subFeeds

  const { feedType } = feedProperty
  let repeatPatternIndex = 0
  let iterationIndex = 0
  let repeatPattern = useRepeatPattern(repeatPatternIndex, feedProperty)

  if (!repeatPattern || !isNumber(repeatPattern.repeatEvery)) {
    return feed
  }
  const modifiedParentFeed = parentFeed
    .sort((a, b) => {
      return a.feedPosition - b.feedPosition
    })
    .reduce((acc, item, i) => {
      repeatPattern = useRepeatPattern(repeatPatternIndex, feedProperty)

      if (
        repeatPattern &&
        iterationIndex > 0 &&
        ((iterationIndex as number) + 1) % repeatPattern.repeatEvery === 0 &&
        itemsToBeAdded.some((subFeed) => isNonEmptyArray(subFeed))
      ) {
        item.feedPosition = i

        const availableSubFeed = itemsToBeAdded.find((subFeed) =>
          isNonEmptyArray(subFeed)
        )
        if (availableSubFeed) {
          const itemsToInsert = availableSubFeed
            .splice(0, repeatPattern?.itemsToAdd as number)
            .map((item, positionIndex) => {
              return {
                ...item,
                feedPosition: i + positionIndex,
                placedInFeed: feedType
              }
            })

          repeatPatternIndex++
          iterationIndex = 0
          return [...acc, ...itemsToInsert, { ...item }]
        }
      }
      iterationIndex++
      return [...acc, { ...item, feedPosition: acc.length + 1 }]
    }, [])
  return modifiedParentFeed
}

const getNextAvailableSubFeedItem = (
  subFeeds: CenterFeedPlacement[][],
  currentIndex: number
): { item: CenterFeedPlacement; sourceIndex: number } | null => {
  for (let i = 0; i < subFeeds.length; i++) {
    const index = (currentIndex + i) % subFeeds.length
    if (isNonEmptyArray(subFeeds[index])) {
      const item = subFeeds[index].shift()
      if (item) {
        return { item, sourceIndex: index }
      }
    }
  }
  return null
}

export const addItemsToSubFeedWithRepeatEvery = ({
  feed,
  subFeeds,
  feedProperty,
  positionStart
}: {
  feed: CenterFeedPlacement[]
  subFeeds: CenterFeedPlacement[][]
  feedProperty: FeedProperty
  positionStart: number
}) => {
  const parentFeed: CenterFeedPlacement[] = [...feed]
  const { feedType } = feedProperty
  const itemsToBeAdded = subFeeds.map((subFeed) => [...subFeed])
  const totalSubFeedItems = itemsToBeAdded.reduce(
    (sum, subFeed) => sum + subFeed.length,
    0
  )
  const totalItems = isNumber(feedProperty.maxItems)
    ? (feedProperty.maxItems as number) + feed.length
    : totalSubFeedItems + feed.length

  let totalCentersAdded = 0
  let currentSubFeedIndex = 0
  const repeatEvery = feedProperty.inFeed?.repeatEvery as number
  const feedItems: (CenterFeedPlacement | undefined)[] = []

  for (let i = 0; i < totalItems; i++) {
    if (
      !isNonEmptyArray(parentFeed) &&
      !itemsToBeAdded.some((subFeed) => isNonEmptyArray(subFeed))
    ) {
      break
    }

    totalCentersAdded++
    if (
      (i + 1) % repeatEvery === 0 &&
      totalCentersAdded < totalItems &&
      itemsToBeAdded.some((subFeed) => isNonEmptyArray(subFeed))
    ) {
      const nextItem = getNextAvailableSubFeedItem(
        itemsToBeAdded,
        currentSubFeedIndex
      )
      if (nextItem) {
        feedItems.push({
          ...nextItem.item,
          feedPosition: i + positionStart || (i as number),
          placedInFeed: feedType
        })
        currentSubFeedIndex = (nextItem.sourceIndex + 1) % itemsToBeAdded.length
      } else if (parentFeed.length > 0) {
        feedItems.push({
          ...parentFeed.shift(),
          feedPosition: i + positionStart || (i as number)
        } as CenterFeedPlacement)
      }
    } else if (parentFeed.length > 0) {
      feedItems.push({
        ...parentFeed.shift(),
        feedPosition: i + positionStart || (i as number)
      } as CenterFeedPlacement)
    }
  }
  return feedItems
}
