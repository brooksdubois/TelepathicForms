import { For, createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';

import { cx } from '../utils/cx';

const labs = [
  { href: '/form-demo', label: 'Form Demo' },
  { href: '/text-field', label: 'TextField Lab' },
  { href: '/select', label: 'Select Lab' },
  { href: '/multi-select', label: 'MultiSelect Lab' },
  { href: '/checkbox', label: 'Checkbox Lab' },
  { href: '/radio-group', label: 'RadioGroup Lab' },
  { href: '/switch', label: 'Switch Lab' },
  { href: '/textarea', label: 'TextArea Lab' },
  { href: '/date', label: 'DatePicker Lab' },
  { href: '/slider', label: 'Slider Lab' },
  { href: '/date-range', label: 'Date Range Lab' },
];

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const navItemClass =
  'rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-slate-700 transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600 hover:scale-105 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200';

const PlaygroundNav: Component<{ currentPath: string; class?: string }> = (props) => {
  const activePath = () => normalizePath(props.currentPath);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);
  const [startX, setStartX] = createSignal(0);
  const [dragOffset, setDragOffset] = createSignal(0);
  const [startIndex, setStartIndex] = createSignal(0);
  
  const itemsPerPage = 7;
  const maxIndex = labs.length - itemsPerPage;
  let containerRef: HTMLDivElement | undefined;

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDragStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setStartIndex(currentIndex());
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging()) return;
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - startX();
    
    // Calculate drag offset in pixels
    setDragOffset(diff);
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent) => {
    if (!isDragging()) return;
    e.preventDefault();
    
    const itemWidth = containerRef ? containerRef.clientWidth / itemsPerPage : 0;
    const dragDistance = dragOffset();
    
    // Calculate how many items to move based on drag distance
    const itemsMoved = Math.round(dragDistance / itemWidth);
    const newIndex = Math.max(0, Math.min(startIndex() - itemsMoved, maxIndex));
    
    setCurrentIndex(newIndex);
    setIsDragging(false);
    setDragOffset(0);
  };

  // Add global event listeners for drag
  onCleanup(() => {
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    document.removeEventListener('touchcancel', handleDragEnd);
  });

  // Setup drag event listeners
  const setupDragListeners = () => {
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('touchcancel', handleDragEnd);
  };

  // Calculate transform with smooth dragging
  const getTransformValue = () => {
    if (!containerRef) return `translateX(-${currentIndex() * (100 / itemsPerPage)}%)`;
    
    const itemWidth = containerRef.clientWidth / itemsPerPage;
    const baseTransform = -currentIndex() * itemWidth;
    
    if (isDragging()) {
      // During drag, show smooth movement based on drag offset
      return `translateX(${baseTransform + dragOffset()}px)`;
    } else {
      // After drag, snap to the correct position with CSS transition
      return `translateX(-${currentIndex() * (100 / itemsPerPage)}%)`;
    }
  };

  return (
    <div class={cx('flex items-center gap-1', props.class)}>
      {/* Left Arrow */}
      <button
        onClick={prevSlide}
        disabled={currentIndex() === 0}
        class={cx(
          'flex-shrink-0 w-8 h-8 rounded-full',
          'flex items-center justify-center',
          'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50',
          'transition-all duration-200',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600',
          'dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
          'z-10'
        )}
        aria-label="Previous items"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Slider Container */}
      <div 
        ref={containerRef}
        class="overflow-hidden flex-1 select-none"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseEnter={() => setupDragListeners()}
        style={{ 
          cursor: isDragging() ? 'grabbing' : 'grab',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        <div
          class="flex items-center gap-2"
          classList={{
            'transition-transform duration-300 ease-out': !isDragging(),
          }}
          style={{ 
            transform: getTransformValue(),
            WebkitTransform: getTransformValue(),
            pointerEvents: isDragging() ? 'none' : 'auto',
            willChange: 'transform',
          }}
        >
          <For each={labs}>
            {(item, index) => (
              <div 
                class="flex-shrink-0" 
                style={{ 
                  width: `calc(${100 / itemsPerPage}% - 4px)`,
                  WebkitFlexShrink: 0
                }}
              >
                {normalizePath(item.href) === activePath() ? (
                  <span
                    aria-current="page"
                    class={cx(
                      'block w-full text-center truncate',
                      'rounded-full border border-emerald-300/70 bg-emerald-500/10 px-3 py-1.5',
                      'text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-300',
                      'transition-all duration-200'
                    )}
                  >
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    class={cx(navItemClass, 'block w-full text-center truncate')}
                    title={item.label}
                    draggable={false}
                  >
                    {item.label}
                  </a>
                )}
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Right Arrow */}
      <button
        onClick={nextSlide}
        disabled={currentIndex() >= maxIndex}
        class={cx(
          'flex-shrink-0 w-8 h-8 rounded-full',
          'flex items-center justify-center',
          'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50',
          'transition-all duration-200',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600',
          'dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
          'z-10'
        )}
        aria-label="Next items"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default PlaygroundNav;