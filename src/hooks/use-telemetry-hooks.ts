// hooks/useTelemetryHooks.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '../contexts/telemetry-context';

// Hook to track page views automatically with React Router
export const usePageTracking = () => {
  const location = useLocation();
  const { trackPageView } = useTelemetry();
  const previousPath = useRef<string>('');

  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      trackPageView(location.pathname, document.title);
      previousPath.current = location.pathname;
    }
  }, [location.pathname, trackPageView]);
};

// Hook to track component mount/unmount
export const useComponentLifecycle = (componentName: string) => {
  const { track } = useTelemetry();

  useEffect(() => {
    track('component_mounted', { component: componentName });

    return () => {
      track('component_unmounted', { component: componentName });
    };
  }, [componentName, track]);
};

// Hook to track time spent on a component/page
export const useTimeTracking = (eventName: string, componentName?: string) => {
  const { track } = useTelemetry();
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const duration = Date.now() - startTime.current;
      track(eventName, {
        component: componentName,
        duration,
        startTime: startTime.current,
        endTime: Date.now(),
      });
    };
  }, [eventName, componentName, track]);
};

// Hook to track user interactions with elements
export const useInteractionTracking = (componentName: string) => {
  const { trackUserAction } = useTelemetry();

  const trackClick = useCallback((action: string, value?: any, metadata?: Record<string, any>) => {
    trackUserAction('click', componentName, value, { action, ...metadata });
  }, [trackUserAction, componentName]);

  const trackHover = useCallback((value?: any, metadata?: Record<string, any>) => {
    trackUserAction('hover', componentName, value, metadata);
  }, [trackUserAction, componentName]);

  const trackFocus = useCallback((value?: any, metadata?: Record<string, any>) => {
    trackUserAction('focus', componentName, value, metadata);
  }, [trackUserAction, componentName]);

  const trackInput = useCallback((value?: any, metadata?: Record<string, any>) => {
    trackUserAction('input', componentName, value, metadata);
  }, [trackUserAction, componentName]);

  const trackSubmit = useCallback((value?: any, metadata?: Record<string, any>) => {
    trackUserAction('submit', componentName, value, metadata);
  }, [trackUserAction, componentName]);

  return {
    trackClick,
    trackHover,
    trackFocus,
    trackInput,
    trackSubmit,
  };
};

// Hook to track form interactions
export const useFormTracking = (formName: string) => {
  const { trackUserAction, track } = useTelemetry();
  const formStartTime = useRef<number>(0);
  const fieldInteractions = useRef<Record<string, number>>({});

  const trackFormStart = useCallback(() => {
    formStartTime.current = Date.now();
    track('form_started', { formName });
  }, [track, formName]);

  const trackFieldFocus = useCallback((fieldName: string) => {
    if (!fieldInteractions.current[fieldName]) {
      fieldInteractions.current[fieldName] = 0;
    }
    fieldInteractions.current[fieldName]++;
    trackUserAction('field_focus', formName, fieldName, {
      interactionCount: fieldInteractions.current[fieldName],
    });
  }, [trackUserAction, formName]);

  const trackFieldBlur = useCallback((fieldName: string, value?: any) => {
    trackUserAction('field_blur', formName, { fieldName, value });
  }, [trackUserAction, formName]);

  const trackFormSubmit = useCallback((success: boolean, errors?: string[], values?: Record<string, any>) => {
    const duration = Date.now() - formStartTime.current;
    track('form_submitted', {
      formName,
      success,
      errors,
      duration,
      fieldInteractions: fieldInteractions.current,
      values: values ? Object.keys(values) : [], // Only track field names, not values for privacy
    });
  }, [track, formName]);

  const trackFormAbandonment = useCallback(() => {
    const duration = Date.now() - formStartTime.current;
    track('form_abandoned', {
      formName,
      duration,
      fieldInteractions: fieldInteractions.current,
    });
  }, [track, formName]);

  return {
    trackFormStart,
    trackFieldFocus,
    trackFieldBlur,
    trackFormSubmit,
    trackFormAbandonment,
  };
};

// Hook to track scroll behavior
export const useScrollTracking = (elementRef?: React.RefObject<HTMLElement>) => {
  const { track } = useTelemetry();
  const scrollDepth = useRef<number>(0);
  const maxScrollDepth = useRef<number>(0);

  useEffect(() => {
    const element = elementRef?.current || window;
    const targetElement = elementRef?.current || document.documentElement;

    const handleScroll = () => {
      const scrollTop = elementRef?.current?.scrollTop || window.pageYOffset;
      const scrollHeight = targetElement.scrollHeight - targetElement.clientHeight;
      const currentDepth = Math.round((scrollTop / scrollHeight) * 100);

      scrollDepth.current = currentDepth;
      if (currentDepth > maxScrollDepth.current) {
        maxScrollDepth.current = currentDepth;
      }

      // Track milestone scroll depths
      if ([25, 50, 75, 90, 100].includes(currentDepth) && currentDepth > maxScrollDepth.current - 5) {
        track('scroll_depth', {
          depth: currentDepth,
          element: elementRef ? 'custom' : 'window',
        });
      }
    };

    if (elementRef?.current) {
      elementRef.current.addEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (elementRef?.current) {
        elementRef.current.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }

      // Track final scroll depth on unmount
      track('scroll_session_end', {
        maxDepth: maxScrollDepth.current,
        finalDepth: scrollDepth.current,
        element: elementRef ? 'custom' : 'window',
      });
    };
  }, [track, elementRef]);

  return {
    currentScrollDepth: scrollDepth.current,
    maxScrollDepth: maxScrollDepth.current,
  };
};