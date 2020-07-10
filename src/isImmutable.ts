/* eslint-disable */
// "fork" of https://github.com/facebook/immutable-js/blob/v4.0.0-rc.9/src/Predicates.js
// because tree-shaking does not seems to work as expected

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
export const IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
export const IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
export const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';
export const IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@';

export function isImmutable(maybeImmutable: unknown): boolean {
  return isCollection(maybeImmutable) || isRecord(maybeImmutable);
}

export function isCollection(maybeCollection: any): boolean {
  return !!(maybeCollection && maybeCollection[IS_ITERABLE_SENTINEL]);
}

export function isKeyed(maybeKeyed: any): boolean {
  return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
}

export function isIndexed(maybeIndexed: any): boolean {
  return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
}

export function isAssociative(maybeAssociative: any): boolean {
  return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
}

export function isOrdered(maybeOrdered: any): boolean {
  return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
}

export function isRecord(maybeRecord: any): boolean {
  return !!(maybeRecord && maybeRecord[IS_RECORD_SENTINEL]);
}

export function isValueObject(maybeValue: any): boolean {
  return !!(
    maybeValue &&
    typeof maybeValue.equals === 'function' &&
    typeof maybeValue.hashCode === 'function'
  );
}
