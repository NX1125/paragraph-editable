import { ContentParagraphUtil, ICharacterMetadataType, IContentParagraph } from './ContentParagraph'

interface ICharacterMetadata extends ICharacterMetadataType {
  style?: any
  href?: string
}

function generateMetadata(
  keyOffset: number,
  length: number,
  body?: Partial<ICharacterMetadata>,
) {
  return Array.from({ length }, _ => ({
    ...body,
    key: (keyOffset++).toString(),
  })) as ICharacterMetadata[]
}

function keyGen(offset: number) {
  return () => `${offset++}`
}

it('should replace text', () => {
  const block: IContentParagraph<ICharacterMetadata> = {
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 13),
    ],
  }

  const newBlock = ContentParagraphUtil.replace(block, 0, 5, {
    text: 'Hi',
    metadataList: [
      ...generateMetadata(0, 2),
    ],
  }, keyGen(20))

  expect(newBlock).toEqual({
    key: '1',
    text: 'Hi, world!',
    metadataList: [
      ...generateMetadata(20, 2),
      ...generateMetadata(6, 8),
    ],
  })
})

it('should insert text', () => {
  const block: IContentParagraph<ICharacterMetadata> = {
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 13),
    ],
  }

  const newBlock = ContentParagraphUtil.insert(block, 7, {
    text: 'my ',
    metadataList: [
      ...generateMetadata(20, 3),
    ],
  }, keyGen(20))

  expect(newBlock).toEqual({
    key: '1',
    text: 'Hello, my world!',
    metadataList: [
      ...generateMetadata(1, 7),
      ...generateMetadata(20, 3),
      ...generateMetadata(8, 6),
    ],
  })
})

it('should remove text', () => {
  const block: IContentParagraph<ICharacterMetadata> = {
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 13),
    ],
  }

  const newBlock = ContentParagraphUtil.remove(block, 5, 12)

  expect(newBlock).toEqual({
    key: '1',
    text: 'Hello!',
    metadataList: [
      ...generateMetadata(1, 5),
      ...generateMetadata(13, 1),
    ],
  })
})

it('should update metadata', () => {
  const block: IContentParagraph<ICharacterMetadata> = {
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 13, { style: { color: 'red' } }),
    ],
  }

  const newBlock = ContentParagraphUtil.updateMetadata(block, 0, 5, m => ({
    ...m,
    style: { color: 'blue' },
  }))

  expect(newBlock).toEqual({
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 5, { style: { color: 'blue' } }),
      ...generateMetadata(6, 8, { style: { color: 'red' } }),
    ],
  })
})

it('should set metadata and preserve keys', () => {
  const block: IContentParagraph<ICharacterMetadata> = {
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 13, { style: { color: 'red' } }),
    ],
  }

  const newBlock = ContentParagraphUtil.setMetadata(block, 0, 5, {
    style: { color: 'blue' },
  })

  expect(newBlock).toEqual({
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 5, { style: { color: 'blue' } }),
      ...generateMetadata(6, 8, { style: { color: 'red' } }),
    ],
  })
})

it('should should merge metadata and preserve keys', () => {
  const block: IContentParagraph<ICharacterMetadata> = {
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 13, { style: { color: 'red' } }),
    ],
  }

  const newBlock = ContentParagraphUtil.mergeMetadata(block, 0, 5, {
    style: { fontWeight: 'bold' },
    href: 'https://example.com',
  })

  expect(newBlock).toEqual({
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 5, {
        style: { fontWeight: 'bold' },
        href: 'https://example.com',
      }),
      ...generateMetadata(6, 8, { style: { color: 'red' } }),
    ],
  })
})

it('should match with predicate', () => {
  const block: IContentParagraph<ICharacterMetadata> = {
    key: '1',
    text: 'Hello, world!',
    metadataList: [
      ...generateMetadata(1, 13, { style: { color: 'red' } }),
    ],
  }

  const result = ContentParagraphUtil.matchRange(block, 0, 5, m => m.style?.color === 'red')

  expect(result).toBe(true)
})
