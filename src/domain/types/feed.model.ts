export enum FeedOptions {
    TOP = 'top',
    ORGANIC = 'organic',
    ADVERT = 'advert',
    NEARBY = 'nearby',
    CAROUSEL = 'carousel',
    ELEMENT = 'element',
    NEARBY_HEADER = 'nearbyHeader',
    FEATURED = 'featured'
  }
  

  export enum CarouselType {
    Insurance = 'insurance',
    TopLocations = 'topLocations',
    NationWide = 'nationWide',
    Featured = 'featured'
  }
  
  export type Header = {
    title: string
    location?: string
    term?: string
  }
  
  type RepeatPattern = {
    repeatEvery: number
    itemsToAdd: number
  }
  
  export type InFeedProperties = {
    feedSource?: FeedOptions
    repeatEvery?: number
    repeatPattern?: RepeatPattern[]
    maxItems?: number
    inFeedSources?: Array<{
      feedSource: FeedOptions
      maxItems?: number
    }>
  }
  
  export type FeedProperty = {
    feedType: FeedOptions
    positionStart?: number
    itemType?: string
    inFeed?: InFeedProperties
    maxItems?: number
    header?: Header
  }
  
  export type Feed = {
    [k in FeedOptions]: keyof typeof FeedOptions
  } & {
    [k: string]: keyof typeof FeedOptions
  }[]
  

export interface FeedPlacement {
    feedPosition: number
    feedType: FeedOptions
    item: Item
    placedInFeed: FeedOptions
}


  
  export enum FeedItemEnum {
    TOP = 'topItems',
    ORGANIC = 'organicItems',
    NEARBY = 'nearbyItems',
    ADVERT = 'advertItems',
    FEATURED = 'featuredItems'
  }
  
  export type FeedItems = {
    [K in FeedItemEnum]: Partial<FeedPlacement>[]
  }
  

  export interface Item {
    [k: string]: unknown
    id: number | string
  }