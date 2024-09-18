import { v4 as uuid } from 'uuid'

export interface ICharacterMetadataType {
  key: string
}

/**
 * A content fragment is a piece of text with metadata. It is used to select
 * pieces of a block, or to insert, remove or replace text in a block.
 */
export interface IParagraphFragment<M extends ICharacterMetadataType> {
  text: string
  metadataList: M[]
}

/**
 * A content fragment with an offset.
 */
export interface IOffsetParagraphFragment<M extends ICharacterMetadataType> extends IParagraphFragment<M> {
  offset: number
}

/**
 * A block of text with metadata. Each block has a key, text and metadata.
 *
 * The key is used for React lists and must be unique.
 *
 * Each character in the text has a metadata object. The metadata is merged
 * into fragments during rendering.
 *
 * The text can contain newlines, paragraph separators and layout nodes.
 *
 * @template N The type of layout node.
 */
export interface IContentParagraph<M extends ICharacterMetadataType> extends IParagraphFragment<M> {
  key: string

  /**
   * The default metadata for characters, mainly used for the last char.
   */
  defaultMetadata?: M
}

/**
 * Utility functions for {@link IContentParagraph}.
 */
export class ContentParagraphUtil {
  /**
   * Creates an empty block with the given key.
   */
  static createEmpty<M extends ICharacterMetadataType>(key: string): IContentParagraph<M> {
    return {
      key,
      text: '',
      metadataList: [],
    }
  }

  /**
   * Inserts a fragment at the given offset.
   */
  static insert<M extends ICharacterMetadataType>(
    block: IContentParagraph<M>,
    offset: number,
    fragment: IParagraphFragment<M>,
    genKey: (() => string) = uuid,
  ) {
    return ContentParagraphUtil.replace(block, offset, offset, fragment, genKey)
  }

  /**
   * Removes a fragment from the given start to end.
   */
  static remove<M extends ICharacterMetadataType>(
    block: IContentParagraph<M>,
    start: number,
    end: number,
  ) {
    return ContentParagraphUtil.replace(block, start, end, {
      text: '',
      metadataList: [],
    })
  }

  /**
   * Replaces a fragment from the given start to end with the given fragment.
   *
   * @param block
   * @param start Start index, inclusive
   * @param end End index, exclusive
   * @param fragment
   * @param genKey Function to generate keys for metadata; defaults to uuid
   */
  static replace<M extends ICharacterMetadataType>(
    block: IContentParagraph<M>,
    start: number,
    end: number,
    fragment: IParagraphFragment<M>,
    genKey: (() => string) = uuid,
  ): IContentParagraph<M> {
    if (start < 0 || start > block.text.length) {
      throw new Error('Start index out of bounds')
    }

    // assert text and metadata lengths are equal
    if (fragment.text.length !== fragment.metadataList.length) {
      throw new Error('Text and metadata lengths must be equal')
    }

    return {
      ...block,
      text: block.text.substring(0, start) + fragment.text + block.text.substring(end),
      metadataList: block.metadataList
        .slice(0, start)
        .concat(fragment.metadataList.map(x => ({
          ...x,
          key: genKey(),
        })))
        .concat(block.metadataList.slice(end)),
    }
  }

  /**
   * Update metadata in the given range with the given function.
   *
   * @param block
   * @param start
   * @param end
   * @param f Update function
   */
  static updateMetadata<M extends ICharacterMetadataType>(
    block: IContentParagraph<M>,
    start: number,
    end: number,
    f: (metadata: M) => M,
  ): IContentParagraph<M> {
    const metadata = [ ...block.metadataList ]

    for (let i = start; i < end; i++) {
      metadata[i] = f(metadata[i])
    }

    return {
      ...block,
      metadataList: metadata,
    }
  }

  /**
   * Replace metadata in the given range, keeping old keys only.
   *
   * @param block
   * @param start
   * @param end
   * @param metadata
   */
  static setMetadata<M extends ICharacterMetadataType>(
    block: IContentParagraph<M>,
    start: number,
    end: number,
    metadata: Omit<M, 'key'>,
  ): IContentParagraph<M> {
    return ContentParagraphUtil.updateMetadata(block, start, end, m => ({
      ...metadata,
      key: m.key,
    } as M))
  }

  /**
   * Merge metadata into the given range, also merging styles, but keeping old keys.
   * This function does not merge nested objects.
   */
  static mergeMetadata<M extends ICharacterMetadataType>(
    block: IContentParagraph<M>,
    start: number,
    end: number,
    metadata: Partial<M>,
  ): IContentParagraph<M> {
    return ContentParagraphUtil.updateMetadata(block, start, end, old => ({
      ...old,
      ...metadata,
    }))
  }

  /**
   * Check if the given range matches the predicate.
   *
   * @param block
   * @param start
   * @param end
   * @param predicate
   */
  static matchRange<M extends ICharacterMetadataType>(
    block: IContentParagraph<M>,
    start: number,
    end: number,
    predicate: (metadata: M) => boolean,
  ): boolean {
    return block.metadataList.slice(start, end).every(predicate)
  }
}
