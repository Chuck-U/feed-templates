import {
    Center,
    CenterFeedPlacement,
    FeedOptions,
    FeedProperty,
    ScoringData,
    FeedItemEnum,
    FeedItems
  } from '@/types/models'
  import { getLocalBlockLengthFromFeedLayout } from '@/domain/feed/useCases/getLocalAdBlock'
  import { isNil, isNonEmptyArray, isNumber } from '@/utils/checks'
  import {
    addSingleItemsAtPosition,
    sortConstructedFeed
  } from './addSingleItemsAtPosition'
  import { singleInserts, MAX_CAROUSEL_FEED_ITEMS } from './constants'
  import {
    addAdsTypeAndZoneId,
    addLocalFeedTypeAndZoneId,
    addNearbyFeedTypeAndZoneId,
    addOrganicFeedTypeAndZoneId,
    addFeaturedFeedTypeAndZoneId
  } from '../center/useCases/addFeedTypeAndZoneId'
  import { createLocalCenters } from './useCases/createLocalCenters'
  import { removePriorityItemsFromCenters } from './useCases/dedupeCentersByPriority'
  import { AddItemsToSubFeed } from './useCases/AddItemsToSubFeed'
  import { addNearbyHeader } from './useCases/addNearbyHeader'
  import { getRepeatPatternSubItemCount } from './useCases/getRepeatPatternSubItemCount'
  
  export const subAndMainFeedHaveItems = (subFeed, mainFeed) => {
    return isNonEmptyArray(subFeed) && isNonEmptyArray(mainFeed)
  }
  
  export const addComponentsToFeed = ({
    feedLayout,
    localFeed,
    organicFeed,
    nearbyFeed,
    midFeedAds,
    carouselFeaturedCenters,
    scoringData
  }: {
    feedLayout: FeedProperty[]
    localFeed: CenterFeedPlacement[] | []
    organicFeed: CenterFeedPlacement[] | []
    nearbyFeed: CenterFeedPlacement[] | []
    midFeedAds: CenterFeedPlacement[] | []
    carouselFeaturedCenters: CenterFeedPlacement[]
    scoringData: ScoringData
  }) => {
    let localCenters: CenterFeedPlacement[] = localFeed
    let organicCenters: CenterFeedPlacement[] = organicFeed
    let adverts: CenterFeedPlacement[] = midFeedAds
    let featured: CenterFeedPlacement[] = carouselFeaturedCenters
    if (getLocalBlockLengthFromFeedLayout(feedLayout)) {
      localCenters = createLocalCenters({
        organicCenters: organicCenters,
        scoringData,
        localBlockCount: getLocalBlockLengthFromFeedLayout(feedLayout)
      })
      organicCenters = removePriorityItemsFromCenters({
        listWithPriority: localCenters,
        listToRemoveFrom: organicCenters
      }) as CenterFeedPlacement[]
    }
    adverts = removePriorityItemsFromCenters({
      listWithPriority: [...organicCenters, ...localCenters],
      listToRemoveFrom: adverts
    }) as CenterFeedPlacement[]
    featured = removePriorityItemsFromCenters({
      listWithPriority: [...organicCenters, ...localCenters],
      listToRemoveFrom: featured
    }) as CenterFeedPlacement[]
  
    const initialFeed = createInitialFeed({
      feedLayout,
      localFeed: localCenters,
      organicFeed: organicCenters,
      nearbyFeed,
      midFeedAds: adverts,
      carouselFeaturedCenters: featured
    })
  
    const constructedFeed = addSingleItemsAtPosition({
      feed: initialFeed as Partial<CenterFeedPlacement>[],
      template: feedLayout
    })
    if (nearbyFeed.length) {
      const nearbyConstructedFeed = addNearbyHeader({
        feed: constructedFeed
      })
      return sortConstructedFeed(nearbyConstructedFeed as CenterFeedPlacement[])
    }
  
    return sortConstructedFeed(constructedFeed as CenterFeedPlacement[])
  }
  
  export const createInitialFeed = ({
    feedLayout,
    localFeed = [],
    organicFeed = [],
    nearbyFeed = [],
    midFeedAds = [],
    carouselFeaturedCenters = []
  }: {
    feedLayout: FeedProperty[]
    localFeed: Center[] | []
    organicFeed: Center[] | []
    nearbyFeed: Center[] | []
    midFeedAds: Center[] | []
    carouselFeaturedCenters: Center[] | []
  }) => {
    const localItems = localFeed.map(addLocalFeedTypeAndZoneId)
    const midFeedAdsItems = midFeedAds.map(addAdsTypeAndZoneId)
    const organicItems = organicFeed.map(addOrganicFeedTypeAndZoneId)
    const nearbyItems = nearbyFeed.map(addNearbyFeedTypeAndZoneId)
    const featuredItems = carouselFeaturedCenters.map(
      addFeaturedFeedTypeAndZoneId
    )
    const feedItems = {
      localItems,
      midFeedAdsItems,
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
        if (item.feedType === FeedOptions.Explore) {
          return { ...item, feedPosition: lastCenterStartingIndex }
        }
        if (item.feedType === FeedOptions.Featured) {
          return {
            ...item,
            centers: carouselFeaturedCenters
              .map((center, index) => ({
                ...center,
                positionInItem: index + 1
              }))
              .slice(0, MAX_CAROUSEL_FEED_ITEMS),
            feedPosition: lastCenterStartingIndex
          }
        }
        if (!feedSourceHasItems(feedType, feedItems)) {
          return []
        }
        if (inFeed?.repeatEvery) {
          const feed = mapPositionToFeedItems(
            feedItems[FeedItemEnum[feedType]].splice(0, maxItems),
            lastCenterStartingIndex
          )
  
          let subFeeds: CenterFeedPlacement[][] = []
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
  
          let subFeeds: CenterFeedPlacement[][] = []
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
    feed: CenterFeedPlacement[],
    positionStart: number
  ) =>
    feed.map((item, index) => {
      return { ...item, feedPosition: positionStart + index }
    }) as CenterFeedPlacement[]
  
  const feedSourceHasItems = (
    feedType: FeedProperty['feedType'],
    feedItems: FeedItems
  ) => {
    return isNonEmptyArray(feedItems[FeedItemEnum[feedType]])
  }
  