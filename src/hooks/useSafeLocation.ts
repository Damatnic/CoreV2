import { useLocation as useRouterLocation } from 'react-router-dom';

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
 * Uses try-catch to handle cases where no Router context is available
 */
export const useSafeLocation = (): Location => {
  try {
    // Try to use the regular useLocation hook
    const location = useRouterLocation();
    return location;
  } catch (error) {
    // If useLocation throws (no Router context), return fallback
    // This can happen in tests or when components are rendered outside a Router
    return fallbackLocation;
  }
};
