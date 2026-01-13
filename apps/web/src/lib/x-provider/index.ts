import type { XProvider, XProviderType } from './interface';
import { MockXProvider, updateMockState, getMockState, setHeaderMatch } from './mock';
import { RapidAPIXProvider } from './rapidapi';

export type { XProvider, XProviderType };
export { MockXProvider, updateMockState, getMockState, setHeaderMatch } from './mock';
export { RapidAPIXProvider } from './rapidapi';

let providerInstance: XProvider | null = null;

/**
 * Get the configured X provider instance.
 * Uses singleton pattern to reuse the same instance.
 */
export function getXProvider(): XProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const provider = (process.env.X_PROVIDER || 'mock') as XProviderType;

  switch (provider) {
    case 'rapidapi':
      providerInstance = new RapidAPIXProvider();
      break;
    case 'mock':
    default:
      providerInstance = new MockXProvider();
      break;
  }

  return providerInstance;
}
