import { useContext } from 'react';
import { UNSAFE_LocationContext } from 'react-router-dom';

interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  key: string;
}

const fallbackLocation: Location = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

/**
 * Safe wrapper for useLocation that provides a fallback when no Router context exists
 * This uses the internal location context directly to avoid hook ordering issues
 */
export const useSafeLocation = (): Location => {
  const context = useContext(UNSAFE_LocationContext);
  
  // If we have a router context, return the location from it
  if (context && context.location) {
    return context.location;
  }
  
  // Return fallback location when no Router context is available
  return fallbackLocation;
};
