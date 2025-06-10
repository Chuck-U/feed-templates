import { FeedProperty, FeedPlacement } from '../../types/feed.model'
import { singleInserts } from '../constants'
import { isNonEmptyArray } from '../../utils/checks'

export const getSingleItemsFromTemplate = ({
  template
}: {
  template: FeedProperty[]
}): FeedProperty[] | [] =>
  template.filter((feedItem) => singleInserts.includes(feedItem.feedType))

export const addSingleItemsAtPosition = ({
  feed,
  template
}: {
  feed
  template: FeedProperty[]
}): FeedPlacement[] => {
  const singleInsertItems = getSingleItemsFromTemplate({ template })
  if (!singleInsertItems.length) {
    return feed
  }
  const constructed = feed.reduce((acc, item, index) => {
    const singleItem = singleInsertItems.filter(
      (singleItem) => singleItem.positionStart === index
    )
    if (isNonEmptyArray(singleItem)) {
      return [
        ...acc,
        ...singleItem.map((item, i) => ({ ...item, feedPosition: index + i })),
        { ...item, feedPosition: acc.length }
      ]
    }
    return [...acc, item]
  }, [])
  return constructed
}

