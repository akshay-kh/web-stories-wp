/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaGallery from '../common/mediaGallery';
import {
  MediaGalleryContainer,
  MediaGalleryInnerContainer,
  MediaGalleryLoadingPill,
  MediaGalleryMessage,
} from '../common/styles';
import { PROVIDERS } from '../../../../../app/media/media3p/providerConfiguration';

const ROOT_MARGIN = 300;

const SHOW_LOADING_PILL_DELAY_MS = 1000;

function PaginatedMediaGallery({
  providerType,
  resources,
  searchTerm,
  selectedCategoryId,
  isMediaLoading,
  isMediaLoaded,
  hasMore,
  onInsert,
  setNextPage,
}) {
  // TODO(#1698): Ensure scrollbars auto-disappear in MacOS.
  // State and callback ref necessary to recalculate the padding of the list
  // given the scrollbar width.
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const refContainer = useRef();
  const refCallbackContainer = (element) => {
    refContainer.current = element;
    if (!element) {
      return;
    }
    setScrollbarWidth(element.offsetWidth - element.clientWidth);
  };

  // Recalculates padding so that it stays centered.
  // As of May 2020 this cannot be achieved without js (as the scrollbar-gutter
  // prop is not yet ready).
  useLayoutEffect(() => {
    if (!scrollbarWidth) {
      return;
    }
    const currentPaddingLeft = parseFloat(
      window
        .getComputedStyle(refContainer.current, null)
        .getPropertyValue('padding-left')
    );
    refContainer.current.style['padding-right'] =
      currentPaddingLeft - scrollbarWidth + 'px';
  }, [scrollbarWidth, refContainer]);

  const loadNextPageIfNeeded = useCallback(() => {
    const node = refContainer.current;
    if (!node || !hasMore || !isMediaLoaded || isMediaLoading) {
      return;
    }

    // Load the next page if we are "close" (by a length of ROOT_MARGIN) to the
    // bottom of of the container.
    const bottom =
      node.scrollHeight - node.scrollTop <= node.clientHeight + ROOT_MARGIN;
    if (bottom) {
      setNextPage();
      return;
    }

    // Load the next page if the page isn't full, ie. scrollbar is not visible.
    if (node.clientHeight === node.scrollHeight) {
      setNextPage();
      return;
    }
  }, [hasMore, isMediaLoaded, isMediaLoading, setNextPage]);

  // Scroll to the top when the searchTerm or selected category changes.
  useEffect(() => {
    refContainer.current?.scrollTo(0, 0);
  }, [searchTerm, selectedCategoryId]);

  // After scrolls or resize, see if we need the load the next page.
  const [handleScrollOrResize] = useDebouncedCallback(
    loadNextPageIfNeeded,
    500,
    [loadNextPageIfNeeded]
  );

  // After loading a next page, see if we need to load another,
  // ie. when the page of results isn't full.
  useLayoutEffect(() => {
    //eslint-disable-next-line @wordpress/react-no-unsafe-timeout
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function loadNextPageIfNeededAfterGalleryRendering() {
      // Wait for <Gallery> to finish its render layout cycles first.
      await sleep(200);

      loadNextPageIfNeeded();
    }
    loadNextPageIfNeededAfterGalleryRendering();
  }, [loadNextPageIfNeeded]);

  useEffect(() => {
    const node = refContainer.current;
    if (!node) {
      return undefined;
    }

    // When the user scrolls or resizes (debounced).
    node.addEventListener('scroll', handleScrollOrResize);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      node.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [handleScrollOrResize]);

  const mediaGallery =
    isMediaLoaded && resources.length === 0 ? (
      <MediaGalleryMessage>
        {__('No media found', 'web-stories')}
      </MediaGalleryMessage>
    ) : (
      <div style={{ marginBottom: 15 }}>
        <MediaGallery
          providerType={providerType}
          resources={resources}
          onInsert={onInsert}
        />
      </div>
    );

  const [showLoadingPill, setShowLoadingPill] = useState(false);

  useEffect(() => {
    if (isMediaLoading && hasMore) {
      const showLoadingTimeout = setTimeout(() => {
        setShowLoadingPill(isMediaLoading);
      }, SHOW_LOADING_PILL_DELAY_MS);
      return () => clearTimeout(showLoadingTimeout);
    }
    setShowLoadingPill(false);
    return undefined;
  }, [isMediaLoading, hasMore]);

  const attribution =
    providerType !== 'local' &&
    PROVIDERS[providerType].attributionComponent &&
    PROVIDERS[providerType].attributionComponent();
  return (
    <>
      <MediaGalleryContainer
        data-testid="media-gallery-container"
        ref={refCallbackContainer}
      >
        <MediaGalleryInnerContainer>{mediaGallery}</MediaGalleryInnerContainer>
      </MediaGalleryContainer>
      {showLoadingPill && (
        <MediaGalleryLoadingPill data-testid={'loading-pill'}>
          {__('Loading…', 'web-stories')}
        </MediaGalleryLoadingPill>
      )}
      {!showLoadingPill && attribution}
    </>
  );
}

PaginatedMediaGallery.propTypes = {
  providerType: PropTypes.string.isRequired,
  resources: PropTypes.arrayOf(PropTypes.object).isRequired,
  isMediaLoading: PropTypes.bool.isRequired,
  isMediaLoaded: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onInsert: PropTypes.func.isRequired,
  setNextPage: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  selectedCategoryId: PropTypes.string,
};

export default memo(PaginatedMediaGallery);
