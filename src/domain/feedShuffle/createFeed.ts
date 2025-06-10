import {
    FeedOptions,
    FeedProperty,
    FeedItemEnum,
    FeedItems,
    FeedPlacement,
    Item
  } from '../types/feed.model'
  import { getLocalBlockLengthFromFeedLayout } from '@/domain/feed/useCases/getLocalAdBlock'
  import { isNonEmptyArray, isNumber } from '../utils/checks'
  import {
    addSingleItemsAtPosition,
    sortConstructedFeed
  } from './useCases/addSingleItemsAtPosition'
  import { singleInserts, MAX_CAROUSEL_FEED_ITEMS } from './constants'

  import { createLocalCenters } from './useCases/createLocalCenters'
  import { removePriorityItemsFromCenters } from './useCases/dedupeCentersByPriority'
  import { AddItemsToSubFeed } from './useCases/mixInSubfeed'
  import { addNearbyHeader } from './useCases/addNearbyHeader'
  import { getRepeatPatternSubItemCount } from './useCases/getRepeatPatternSubItemCount'
  
  export const subAndMainFeedHaveItems = (subFeed, mainFeed) => {
    return isNonEmptyArray(subFeed) && isNonEmptyArray(mainFeed)
  }
  
  export const addComponentsToFeed = ({
    feedLayout,
    topFeed,
    organicFeed,
    featuredFeed,
    adverts,
  }: {
    feedLayout: FeedProperty[]
    topFeed: FeedPlacement[] | []
    organicFeed: FeedPlacement[] | []
    featuredFeed: FeedPlacement[] | []
    adverts: FeedPlacement[] | []
  }) => {
    let topItems: FeedPlacement[] = topFeed
    let organicItems: FeedPlacement[] = organicFeed
    let advertsItems: FeedPlacement[] = adverts
    let featuredItems: FeedPlacement[] = featuredFeed

    adverts = removePriorityItemsFromCenters({
      listWithPriority: [...organicItems, ...topItems],
      listToRemoveFrom: adverts
    }) as FeedPlacement[]
    featuredItems = removePriorityItemsFromCenters({
      listWithPriority: [...organicItems, ...topItems],
      listToRemoveFrom: featuredItems
    }) as FeedPlacement[]
  
    const initialFeed = createInitialFeed({
      feedLayout,
      topFeed: topItems,
      organicFeed: organicItems,
      featuredFeed: featuredItems,
      adverts: advertsItems,
      carouselFeaturedCenters: featuredItems
    })
  
    const constructedFeed = addSingleItemsAtPosition({
      feed: initialFeed as Partial<FeedPlacement>[],
      template: feedLayout
    })
    if (featuredFeed.length) {
      const nearbyConstructedFeed = addNearbyHeader({
        feed: constructedFeed
      })
      return sortConstructedFeed(nearbyConstructedFeed as FeedPlacement[])
    }
  
    return sortConstructedFeed(constructedFeed as FeedPlacement[])
  }
  
  export const createInitialFeed = ({
    feedLayout,
    topFeed = [],
    organicFeed = [],
    featuredFeed = [],
    adverts = [],
    carouselFeaturedCenters = []
  }: {
    feedLayout: FeedProperty[]
    topFeed: Item[] | []
    organicFeed: Item[] | []
    featuredFeed: Item[] | []
    adverts: Item[] | []
    carouselFeaturedCenters: Item[] | []
  }) => {
    const topItems = topFeed
    const advertItems = adverts
    const organicItems = organicFeed
    const nearbyItems = featuredFeed
    const featuredItems = carouselFeaturedCenters
    const feedItems = {
      topItems,
      advertItems,
      organicItems,
      nearbyItems,
      featuredItems
    }
  
    let lastCenterStartingIndex = 0
    let indexToBeiterated = 0
    const constructedFeed = feedLayout
      .filter((item) => !singleInserts.includes(item.feedType))
      .map((item: FeedProperty) => {
        lastCenterStartingIndex += indexToBeiterated
        indexToBeiterated = 0
        const { feedType, maxItems, inFeed } = item
        if (singleInserts.includes(feedType)) {
          return []
        }
        if (!feedSourceHasItems(feedType, feedItems)) {
          return []
        }
        if (inFeed?.repeatEvery) {
          const feed = mapPositionToFeedItems(
            feedItems[FeedItemEnum[feedType]].splice(0, maxItems),
            lastCenterStartingIndex
          )
  
          let subFeeds: FeedPlacement[][] = []
          let totalSubFeedLength = 0
  
          if (
            inFeed.inFeedSources &&
            isNonEmptyArray(inFeed.inFeedSources) &&
            isNumber(inFeed.repeatEvery) &&
            !isNaN(inFeed.repeatEvery)
          ) {
            subFeeds = inFeed.inFeedSources.map((source) => {
              if (!inFeed?.repeatEvery || !isNumber(inFeed.repeatEvery)) {
                throw new Error('repeatEvery is not a number')
              }
              const maxSubItems =
                source.maxItems || Math.floor(feed.length / inFeed.repeatEvery)
              const subFeed = feedItems[FeedItemEnum[source.feedSource]].splice(
                0,
                maxSubItems
              )
              totalSubFeedLength += subFeed.length
              return subFeed
            })
          } else if (inFeed.feedSource) {
            const subFeed = feedItems[FeedItemEnum[inFeed.feedSource]].splice(
              0,
              Math.floor(feed.length / inFeed?.repeatEvery)
            )
            subFeeds = [subFeed]
            totalSubFeedLength = subFeed.length
          }
  
          indexToBeiterated = feed.length + totalSubFeedLength
          return AddItemsToSubFeed(feed, subFeeds, item, lastCenterStartingIndex)
        }
        if (inFeed?.repeatPattern) {
          const feed = mapPositionToFeedItems(
            feedItems[FeedItemEnum[feedType]].splice(0, maxItems),
            lastCenterStartingIndex
          )
          const subFeedSpliceLength = getRepeatPatternSubItemCount(
            inFeed.repeatPattern,
            feed.length
          )
  
          let subFeeds: FeedPlacement[][] = []
          let totalSubFeedLength = 0
  
          if (inFeed.inFeedSources && isNonEmptyArray(inFeed.inFeedSources)) {
            subFeeds = inFeed.inFeedSources.map((source) => {
              const subFeed = feedItems[FeedItemEnum[source.feedSource]].splice(
                0,
                subFeedSpliceLength
              )
              totalSubFeedLength += subFeed.length
              return subFeed
            })
          } else if (inFeed.feedSource) {
            const subFeed = feedItems[FeedItemEnum[inFeed.feedSource]].splice(
              0,
              subFeedSpliceLength
            )
            subFeeds = [subFeed]
            totalSubFeedLength = subFeed.length
          }
  
          indexToBeiterated = feed.length + totalSubFeedLength
          return AddItemsToSubFeed(feed, subFeeds, item, lastCenterStartingIndex)
        }
        const feed = mapPositionToFeedItems(
          feedItems[FeedItemEnum[feedType]].splice(0, maxItems),
          lastCenterStartingIndex
        )
        lastCenterStartingIndex += feed.length
        return feed
      })
      .flat()
      .filter(Boolean)
      .sort((a, b) => {
        return (
          ((a as { feedPosition: number }).feedPosition as number) -
          ((b as { feedPosition: number }).feedPosition as number)
        )
      })
      .map((item, index) => {
        return { ...item, feedPosition: index }
      })
    return constructedFeed
  }
  
  export const mapPositionToFeedItems = (
    feed: FeedPlacement[],
    positionStart: number
  ) =>
    feed.map((item, index) => {
      return { ...item, feedPosition: positionStart + index }
    }) as FeedPlacement[]
  
  const feedSourceHasItems = (
    feedType: FeedProperty['feedType'],
    feedItems: FeedItems
  ) => {
    return isNonEmptyArray(feedItems[FeedItemEnum[feedType]])
  }
  