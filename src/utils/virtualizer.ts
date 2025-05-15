/**
 * Virtualization utilities for optimizing long list rendering performance
 * 
 * These utilities help render only visible items in the viewport, reducing DOM nodes and
 * improving performance for large lists
 */

import React, { useRef, useState, useEffect, RefObject, CSSProperties, ReactNode } from 'react';
import { debounce } from 'lodash';
import { PERFORMANCE_CONSTANTS } from './performance';

/**
 * Interface for virtualized list configuration
 */
export interface VirtualizerOptions<T> {
  items: T[];                  // Array of items to virtualize
  itemHeight: number;          // Fixed height for each item in pixels
  overscan?: number;           // Number of items to render outside visible area
  scrollThreshold?: number;    // Debounce threshold for scroll events
  horizontal?: boolean;        // Whether list scrolls horizontally
  containerRef?: RefObject<HTMLDivElement>; // Optional reference to the container element
}

/**
 * Interface for the virtualized list state and handlers
 */
export interface VirtualizerResult<T> {
  virtualItems: Array<{
    index: number;
    item: T;
    position: number;
    visible: boolean;
  }>;
  containerRef: RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number) => void;
  totalHeight: number;
  isScrolling: boolean;
  startIndex: number;
  endIndex: number;
  containerStyles: CSSProperties;
}

/**
 * Custom hook to virtualize a list of items
 * 
 * @param options Virtualization configuration options
 * @returns VirtualizerResult object with virtualized items and handlers
 */
export function useVirtualizer<T>(
  options: VirtualizerOptions<T>
): VirtualizerResult<T> {
  const {
    items,
    itemHeight,
    overscan = 3,
    scrollThreshold = PERFORMANCE_CONSTANTS.SCROLL_THROTTLE_DELAY,
    horizontal = false,
    containerRef: externalContainerRef
  } = options;

  // Use provided container ref or create a new one
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate the range of visible items
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + viewportHeight) / itemHeight) + overscan
  );

  // Generate the array of virtual items
  const virtualItems = items
    .slice(startIndex, endIndex + 1)
    .map((item, i) => {
      const index = startIndex + i;
      const position = index * itemHeight;
      return {
        index,
        item,
        position,
        visible: index >= startIndex && index <= endIndex,
      };
    });

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial measurements
    setViewportHeight(horizontal ? container.offsetWidth : container.offsetHeight);

    let scrollingTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = debounce(() => {
      if (!container) return;
      const scrollPosition = horizontal ? container.scrollLeft : container.scrollTop;
      setScrollTop(scrollPosition);
      setIsScrolling(true);
      
      // Reset scrolling flag after delay
      clearTimeout(scrollingTimeout);
      scrollingTimeout = setTimeout(() => setIsScrolling(false), 150);
    }, scrollThreshold);
    
    // Also handle resize
    const handleResize = debounce(() => {
      if (!container) return;
      setViewportHeight(horizontal ? container.offsetWidth : container.offsetHeight);
    }, 200);
    
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(scrollingTimeout);
    };
  }, [horizontal, scrollThreshold, containerRef]);

  // Method to scroll to a specific item
  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const position = index * itemHeight;
      if (horizontal) {
        containerRef.current.scrollLeft = position;
      } else {
        containerRef.current.scrollTop = position;
      }
    }
  };

  // Generate styles for the container
  const containerStyles: CSSProperties = {
    position: 'relative',
    overflowY: horizontal ? 'hidden' : 'auto',
    overflowX: horizontal ? 'auto' : 'hidden',
    height: horizontal ? '100%' : undefined,
    width: horizontal ? undefined : '100%',
  };

  return {
    virtualItems,
    containerRef,
    scrollToIndex,
    totalHeight,
    isScrolling,
    startIndex,
    endIndex,
    containerStyles,
  };
}

/**
 * VirtualList component for easy implementation of virtualized lists
 */
interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  width?: number | string;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  horizontal?: boolean;
  className?: string;
  style?: CSSProperties;
  onScroll?: () => void;
  onItemsRendered?: (params: { startIndex: number; endIndex: number }) => void;
}

export function VirtualList<T>(props: VirtualListProps<T>): React.ReactElement {
  const {
    items,
    height = '100%',
    width = '100%',
    itemHeight,
    renderItem,
    overscan = 3,
    horizontal = false,
    className = '',
    style = {},
    onScroll,
    onItemsRendered,
  } = props;

  const {
    virtualItems,
    containerRef,
    startIndex,
    endIndex,
    totalHeight,
    isScrolling,
    containerStyles,
  } = useVirtualizer<T>({
    items,
    itemHeight,
    overscan,
    horizontal,
  });

  // Call onItemsRendered callback
  useEffect(() => {
    if (onItemsRendered) {
      onItemsRendered({ startIndex, endIndex });
    }
  }, [startIndex, endIndex, onItemsRendered]);

  // Call onScroll callback
  useEffect(() => {
    if (onScroll && isScrolling) {
      onScroll();
    }
  }, [isScrolling, onScroll]);

  const containerStyle: CSSProperties = {
    ...containerStyles,
    ...style,
    height,
    width,
  };

  const innerStyle: CSSProperties = {
    height: horizontal ? '100%' : totalHeight,
    width: horizontal ? totalHeight : '100%',
    position: 'relative',
  };

  // Create item elements using React.createElement instead of JSX
  const itemElements = virtualItems.map(({ item, index, position }) => {
    const itemStyle: CSSProperties = {
      position: 'absolute',
      top: horizontal ? 0 : position,
      left: horizontal ? position : 0,
      width: horizontal ? itemHeight : '100%',
      height: horizontal ? '100%' : itemHeight,
    };

    return React.createElement(
      'div',
      {
        key: index,
        style: itemStyle,
      },
      renderItem(item, index)
    );
  });

  // Create inner container
  const innerContainer = React.createElement(
    'div',
    { style: innerStyle },
    itemElements
  );

  // Create outer container
  return React.createElement(
    'div',
    {
      ref: containerRef,
      style: containerStyle,
      className: className,
    },
    innerContainer
  );
}

/**
 * Helper hook for building custom virtualized UI components
 */
export function useVirtualizedItems<T>(
  items: T[],
  scrollElementRef: RefObject<HTMLElement>,
  options: Omit<VirtualizerOptions<T>, 'items' | 'containerRef'>
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const { itemHeight, overscan = 3, horizontal = false } = options;

  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const measureHeight = () => {
      setClientHeight(horizontal ? element.clientWidth : element.clientHeight);
    };

    const handleScroll = debounce(() => {
      if (!element) return;
      setScrollTop(horizontal ? element.scrollLeft : element.scrollTop);
    }, options.scrollThreshold || PERFORMANCE_CONSTANTS.SCROLL_THROTTLE_DELAY);

    // Initial measurements
    measureHeight();
    setScrollTop(horizontal ? element.scrollLeft : element.scrollTop);

    // Listen for scroll events
    element.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', measureHeight);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measureHeight);
    };
  }, [scrollElementRef, horizontal, options.scrollThreshold]);

  // Calculate visible items
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + clientHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return {
    virtualItems: visibleItems.map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight,
    })),
    startIndex,
    endIndex,
    totalSize: items.length * itemHeight,
  };
} 