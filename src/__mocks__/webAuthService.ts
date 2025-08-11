// Mock for webAuthService to prevent Jest import errors
export const WebAuthSession = {
  makeRedirectUri: jest.fn(() => 'mock://redirect'),
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  useAutoDiscovery: jest.fn(() => ({ authorizationEndpoint: 'mock://auth', tokenEndpoint: 'mock://token' })),
  exchangeCodeAsync: jest.fn(),
  ResponseType: {
    Token: 'token',
    Code: 'code'
  }
};