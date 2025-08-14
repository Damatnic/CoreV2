/**
 * @jest-environment jsdom
 */

import {
  ImageFormat,
  OptimizedImage,
  ImageOptimizationConfig,
  defaultImageConfig,
  ImageOptimizer,
  imageOptimizer,
} from './imageOptimization';

describe('imageOptimization', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let mockIntersectionObserver: jest.MockedClass<typeof IntersectionObserver>;
  let mockConnection: any;

  beforeEach(() => {
    // Mock canvas
    mockContext = {
      fillStyle: '',
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      fillRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: [255, 128, 64, 255], // RGBA values
      })),
    } as unknown;

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockContext),
      toDataURL: jest.fn(() => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q=='),
    } as unknown;

    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = jest.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement(tagName);
    });

    // Mock IntersectionObserver
    mockIntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as unknown;
    (global as unknown).IntersectionObserver = mockIntersectionObserver;

    // Mock navigator.connection
    mockConnection = {
      downlink: 5,
      addEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
      configurable: true,
    });

    // Mock window properties
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com' },
      writable: true,
    });

    // Mock performance
    Object.defineProperty(performance, 'memory', {
      value: { usedJSHeapSize: 1024 * 1024 },
      writable: true,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore document.createElement
    jest.restoreAllMocks();
  });

  describe('Default Configuration', () => {
    test('should have correct default breakpoints', () => {
      expect(defaultImageConfig.breakpoints).toEqual({
        thumbnail: { width: 320, height: 180 },
        small: { width: 480, height: 270 },
        medium: { width: 720, height: 405 },
        large: { width: 1280, height: 720 },
      });
    });

    test('should have appropriate quality settings', () => {
      expect(defaultImageConfig.quality).toEqual({
        webp: 85,
        jpeg: 80,
        png: 95,
      });
    });

    test('should have reasonable lazy loading offset', () => {
      expect(defaultImageConfig.lazyLoadingOffset).toBe(100);
    });

    test('should have 24-hour cache expiry', () => {
      expect(defaultImageConfig.cacheExpiry).toBe(86400000); // 24 hours in ms
    });

    test('should have proper connection thresholds', () => {
      expect(defaultImageConfig.connectionThresholds).toEqual({
        slow: 1,
        medium: 5,
        fast: Infinity,
      });
    });
  });

  describe('ImageOptimizer Class', () => {
    let optimizer: ImageOptimizer;

    beforeEach(() => {
      optimizer = new ImageOptimizer();
    });

    describe('Constructor and Initialization', () => {
      test('should initialize with default config', () => {
        expect(optimizer).toBeInstanceOf(ImageOptimizer);
      });

      test('should accept custom config', () => {
        const customConfig: Partial<ImageOptimizationConfig> = {
          lazyLoadingOffset: 100,
          quality: { webp: 85, jpeg: 80, png: 95 },
        };
        
        const customOptimizer = new ImageOptimizer(customConfig);
        expect(customOptimizer).toBeInstanceOf(ImageOptimizer);
      });

      test('should initialize IntersectionObserver when available', () => {
        expect(mockIntersectionObserver).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            rootMargin: '100px',
          })
        );
      });

      test('should handle missing IntersectionObserver', () => {
        delete (global as unknown).IntersectionObserver;
        
        expect(() => {
          new ImageOptimizer();
        }).not.toThrow();
      });

      test('should initialize connection detection', () => {
        expect(mockConnection.addEventListener).toHaveBeenCalledWith(
          'change',
          expect.any(Function)
        );
      });

      test('should handle missing navigator.connection', () => {
        delete (navigator as unknown).connection;
        
        expect(() => {
          new ImageOptimizer();
        }).not.toThrow();
      });
    });

    describe('Connection Detection', () => {
      test('should detect slow connection', () => {
        mockConnection.downlink = 0.5;
        const slowOptimizer = new ImageOptimizer();
        
        // Access private property through type assertion
        expect((slowOptimizer as unknown).connectionType).toBe('slow');
      });

      test('should detect medium connection', () => {
        mockConnection.downlink = 3;
        const mediumOptimizer = new ImageOptimizer();
        
        expect((mediumOptimizer as unknown).connectionType).toBe('medium');
      });

      test('should detect fast connection', () => {
        mockConnection.downlink = 10;
        const fastOptimizer = new ImageOptimizer();
        
        expect((fastOptimizer as unknown).connectionType).toBe('fast');
      });

      test('should update connection type on change', () => {
        mockConnection.downlink = 0.5;
        const optimizer = new ImageOptimizer();
        
        // Simulate connection change
        const changeHandler = mockConnection.addEventListener.mock.calls[0][1];
        mockConnection.downlink = 10;
        changeHandler();
        
        expect((optimizer as unknown).connectionType).toBe('fast');
      });
    });

    describe('generateOptimizedImages', () => {
      test('should generate optimized image configuration', () => {
        const result = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });

        expect(result).toMatchObject({
          id: expect.any(String),
          originalUrl: 'https://example.com/test.jpg',
          formats: expect.any(Array),
          aspectRatio: 16 / 9,
          placeholder: expect.stringContaining('data:image/jpeg'),
          alt: 'Test image',
          loading: 'lazy',
          priority: 5,
        });
      });

      test('should generate formats for all breakpoints', () => {
        const result = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });

        expect(result.formats).toHaveLength(8); // 4 breakpoints × 2 formats each
        
        // Check WebP formats
        const webpFormats = result.formats.filter(f => f.format === 'webp');
        expect(webpFormats).toHaveLength(4);
        
        // Check JPEG formats
        const jpegFormats = result.formats.filter(f => f.format === 'jpeg');
        expect(jpegFormats).toHaveLength(4);
      });

      test('should generate correct URLs with query parameters', () => {
        const result = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });

        const format = result.formats[0];
        const url = new URL(format.url);
        
        expect(url.searchParams.get('w')).toBeTruthy();
        expect(url.searchParams.get('h')).toBeTruthy();
        expect(url.searchParams.get('f')).toBeTruthy();
        expect(url.searchParams.get('q')).toBeTruthy();
        expect(url.searchParams.get('fit')).toBe('cover');
        expect(url.searchParams.get('auto')).toBe('compress');
      });

      test('should use cache for repeated requests', () => {
        const options = { alt: 'Test image' };
        
        const result1 = optimizer.generateOptimizedImages('https://example.com/test.jpg', options);
        const result2 = optimizer.generateOptimizedImages('https://example.com/test.jpg', options);

        expect(result1).toBe(result2); // Same object reference from cache
      });

      test('should handle custom priority and loading', () => {
        const result = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
          priority: 9,
          loading: 'eager',
        });

        expect(result.priority).toBe(9);
        expect(result.loading).toBe('eager');
      });

      test('should generate unique IDs for different images', () => {
        const result1 = optimizer.generateOptimizedImages('https://example.com/image1.jpg', {
          alt: 'Image 1',
        });
        const result2 = optimizer.generateOptimizedImages('https://example.com/image2.jpg', {
          alt: 'Image 2',
        });

        expect(result1.id).not.toBe(result2.id);
      });
    });

    describe('getOptimalFormat', () => {
      test('should prefer WebP when supported', () => {
        // Mock WebP support
        mockCanvas.toDataURL = jest.fn((type) => {
          if (type === 'image/webp') {
            return 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
          }
          return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==';
        });

        const optimizedImage = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });
        
        const optimalFormat = optimizer.getOptimalFormat(optimizedImage);
        expect(optimalFormat.format).toBe('webp');
      });

      test('should fallback to JPEG when WebP not supported', () => {
        // Mock WebP not supported
        mockCanvas.toDataURL = jest.fn(() => 
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q=='
        );

        const optimizedImage = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });
        
        const optimalFormat = optimizer.getOptimalFormat(optimizedImage);
        expect(optimalFormat.format).toBe('jpeg');
      });

      test('should choose size based on connection speed', () => {
        const optimizedImage = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });

        // Test slow connection
        (optimizer as unknown).connectionType = 'slow';
        const slowFormat = optimizer.getOptimalFormat(optimizedImage);
        expect(slowFormat.width).toBe(320); // thumbnail size

        // Test medium connection
        (optimizer as unknown).connectionType = 'medium';
        const mediumFormat = optimizer.getOptimalFormat(optimizedImage);
        expect(mediumFormat.width).toBe(480); // small size

        // Test fast connection
        (optimizer as unknown).connectionType = 'fast';
        const fastFormat = optimizer.getOptimalFormat(optimizedImage);
        expect(fastFormat.width).toBe(720); // medium size
      });
    });

    describe('preloadCriticalImages', () => {
      test('should preload high priority images', () => {
        const images = [
          optimizer.generateOptimizedImages('https://example.com/image1.jpg', {
            alt: 'Image 1',
            priority: 9,
          }),
          optimizer.generateOptimizedImages('https://example.com/image2.jpg', {
            alt: 'Image 2',
            priority: 5,
          }),
          optimizer.generateOptimizedImages('https://example.com/image3.jpg', {
            alt: 'Image 3',
            loading: 'eager',
          }),
        ];

        const mockLink = {
          rel: '',
          as: '',
          href: '',
        } as HTMLLinkElement;
        const mockAppendChild = jest.fn();
        
        document.createElement = jest.fn((tagName) => {
          if (tagName === 'link') {
            return mockLink;
          }
          return mockCanvas;
        });
        
        Object.defineProperty(document, 'head', {
          value: { appendChild: mockAppendChild },
          writable: true,
        });

        optimizer.preloadCriticalImages(images);

        expect(mockAppendChild).toHaveBeenCalledTimes(2); // Only high priority and eager loading
      });

      test('should limit preloads to first 3 critical images', () => {
        const images = Array.from({ length: 5 }, (_, i) =>
          optimizer.generateOptimizedImages(`https://example.com/image${i}.jpg`, {
            alt: `Image ${i}`,
            priority: 9,
          })
        );

        const mockAppendChild = jest.fn();
        Object.defineProperty(document, 'head', {
          value: { appendChild: mockAppendChild },
          writable: true,
        });

        optimizer.preloadCriticalImages(images);

        expect(mockAppendChild).toHaveBeenCalledTimes(3);
      });
    });

    describe('setupLazyLoading', () => {
      test('should observe element with IntersectionObserver', () => {
        const mockImg = document.createElement('img') as HTMLImageElement;
        const mockObserve = jest.fn();
        
        (optimizer as unknown).intersectionObserver = {
          observe: mockObserve,
        };

        optimizer.setupLazyLoading(mockImg);

        expect(mockImg.loading).toBe('lazy');
        expect(mockObserve).toHaveBeenCalledWith(mockImg);
      });

      test('should fallback without IntersectionObserver', () => {
        (optimizer as unknown).intersectionObserver = null;
        
        const mockImg = document.createElement('img') as HTMLImageElement;
        const loadOptimizedImageSpy = jest.spyOn(
          optimizer as unknown,
          'loadOptimizedImage'
        );

        optimizer.setupLazyLoading(mockImg);

        expect(loadOptimizedImageSpy).toHaveBeenCalledWith(mockImg);
      });
    });

    describe('generateSrcSet', () => {
      test('should generate proper srcset for WebP', () => {
        const optimizedImage = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });

        const srcSet = optimizer.generateSrcSet(optimizedImage, 'webp');

        expect(srcSet).toContain('320w');
        expect(srcSet).toContain('480w');
        expect(srcSet).toContain('720w');
        expect(srcSet).toContain('1280w');
        expect(srcSet.split(',').length).toBe(4);
      });

      test('should generate proper srcset for JPEG', () => {
        const optimizedImage = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });

        const srcSet = optimizer.generateSrcSet(optimizedImage, 'jpeg');

        expect(srcSet).toContain('320w');
        expect(srcSet).toContain('480w');
        expect(srcSet).toContain('720w');
        expect(srcSet).toContain('1280w');
        expect(srcSet.split(',').length).toBe(4);
      });
    });

    describe('generateSizes', () => {
      test('should generate responsive sizes attribute', () => {
        const sizes = optimizer.generateSizes();

        expect(sizes).toContain('(max-width: 480px) 320px');
        expect(sizes).toContain('(max-width: 768px) 480px');
        expect(sizes).toContain('(max-width: 1024px) 720px');
        expect(sizes).toContain('1280px');
        expect(sizes.split(',').length).toBe(4);
      });
    });

    describe('clearCache', () => {
      test('should clear internal cache', () => {
        optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });

        expect((optimizer as unknown).cache.size).toBeGreaterThan(0);

        optimizer.clearCache();

        expect((optimizer as unknown).cache.size).toBe(0);
      });
    });

    describe('Private Methods', () => {
      test('should generate proper image ID', () => {
        const url = 'https://example.com/test-image.jpg';
        const id = (optimizer as unknown).generateImageId(url);

        expect(typeof id).toBe('string');
        expect(id.length).toBe(16);
        expect(id).toMatch(/^[a-zA-Z0-9]+$/);
      });

      test('should generate blur placeholder', () => {
        const placeholder = (optimizer as unknown).generatePlaceholder('https://example.com/test.jpg');

        expect(placeholder).toContain('data:image/jpeg;base64,');
        expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 40, 23);
      });

      test('should handle canvas context creation failure', () => {
        mockCanvas.getContext = jest.fn(() => null);

        const placeholder = (optimizer as unknown).generatePlaceholder('https://example.com/test.jpg');

        expect(placeholder).toContain('data:image/jpeg;base64,');
      });

      test('should load optimized image with error handling', async () => {
        const mockImg = {
          dataset: { imageId: 'test-id' },
          classList: { add: jest.fn() },
          src: '',
        } as unknown;

        const optimizedImage = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });
        
        // Add to cache with known ID
        (optimizer as unknown).cache.set('test-id', optimizedImage);

        // Mock Image constructor
        const mockImage = {
          onload: null as unknown,
          onerror: null as unknown,
          src: '',
        };
        (global as unknown).Image = jest.fn(() => mockImage);

        (optimizer as unknown).loadOptimizedImage(mockImg);

        // Simulate successful load
        mockImage.onload();

        expect(mockImg.src).toBeTruthy();
        expect(mockImg.classList.add).toHaveBeenCalledWith('loaded');
      });

      test('should handle image load error with fallback', () => {
        const mockImg = {
          dataset: { imageId: 'test-id' },
          classList: { add: jest.fn() },
          src: '',
        } as unknown;

        const optimizedImage = optimizer.generateOptimizedImages('https://example.com/test.jpg', {
          alt: 'Test image',
        });
        
        (optimizer as unknown).cache.set('test-id', optimizedImage);

        const mockImage = {
          onload: null as unknown,
          onerror: null as unknown,
          src: '',
        };
        (global as unknown).Image = jest.fn(() => mockImage);

        (optimizer as unknown).loadOptimizedImage(mockImg);

        // Simulate load error
        mockImage.onerror();

        expect(mockImg.src).toBeTruthy(); // Should use fallback
        expect(mockImg.classList.add).toHaveBeenCalledWith('loaded');
      });
    });
  });

  describe('Singleton Instance', () => {
    test('should export a singleton instance', () => {
      expect(imageOptimizer).toBeInstanceOf(ImageOptimizer);
    });

    test('should be the same instance when imported multiple times', () => {
      const { imageOptimizer: secondImport } = require('./imageOptimization');
      expect(imageOptimizer).toBe(secondImport);
    });
  });

  describe('TypeScript Interfaces', () => {
    test('should have proper ImageFormat interface', () => {
      const format: ImageFormat = {
        url: 'https://example.com/image.webp',
        format: 'webp',
        width: 800,
        height: 600,
        quality: 85,
      };

      expect(format.url).toBe('https://example.com/image.webp');
      expect(format.format).toBe('webp');
      expect(format.width).toBe(800);
      expect(format.height).toBe(600);
      expect(format.quality).toBe(85);
    });

    test('should have proper OptimizedImage interface', () => {
      const optimizedImage: OptimizedImage = {
        id: 'test-id',
        originalUrl: 'https://example.com/original.jpg',
        formats: [],
        aspectRatio: 16 / 9,
        placeholder: 'data:image/jpeg;base64,abc',
        alt: 'Test image',
        loading: 'lazy',
        priority: 5,
      };

      expect(optimizedImage.id).toBe('test-id');
      expect(optimizedImage.aspectRatio).toBeCloseTo(1.778, 3);
      expect(optimizedImage.loading).toBe('lazy');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid URLs gracefully', () => {
      expect(() => {
        imageOptimizer.generateOptimizedImages('not-a-url', { alt: 'Test' });
      }).not.toThrow();
    });

    test('should handle empty alt text', () => {
      const result = imageOptimizer.generateOptimizedImages('https://example.com/test.jpg', {
        alt: '',
      });

      expect(result.alt).toBe('');
    });

    test('should handle missing image data in cache', () => {
      const mockImg = {
        dataset: { imageId: 'nonexistent' },
        classList: { add: jest.fn() },
      } as unknown;

      expect(() => {
        (imageOptimizer as unknown).loadOptimizedImage(mockImg);
      }).not.toThrow();
    });

    test('should handle missing dataset', () => {
      const mockImg = {
        dataset: {},
        classList: { add: jest.fn() },
      } as unknown;

      expect(() => {
        (imageOptimizer as unknown).loadOptimizedImage(mockImg);
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should cache expensive operations', () => {
      const startTime = performance.now();
      
      // Generate same image multiple times
      for (let i = 0; i < 100; i++) {
        imageOptimizer.generateOptimizedImages('https://example.com/same-image.jpg', {
          alt: 'Test image',
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should be fast due to caching
      expect(duration).toBeLessThan(50);
    });

    test('should generate IDs efficiently', () => {
      const startTime = performance.now();
      
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        const id = (imageOptimizer as unknown).generateImageId(`https://example.com/image-${i}.jpg`);
        ids.add(id);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(ids.size).toBe(1000); // All unique
    });

    test('should not leak memory with cache', () => {
      const initialCacheSize = (imageOptimizer as unknown).cache.size;
      
      // Generate many images
      for (let i = 0; i < 1000; i++) {
        imageOptimizer.generateOptimizedImages(`https://example.com/image-${i}.jpg`, {
          alt: 'Test image',
        });
      }
      
      expect((imageOptimizer as unknown).cache.size).toBe(initialCacheSize + 1000);
      
      imageOptimizer.clearCache();
      expect((imageOptimizer as unknown).cache.size).toBe(0);
    });
  });

  describe('Browser Compatibility', () => {
    test('should handle missing canvas support', () => {
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'canvas') {
          return null;
        }
        return document.createElement(tagName);
      }) as unknown;

      expect(() => {
        new ImageOptimizer();
      }).not.toThrow();
    });

    test('should detect WebP support correctly', () => {
      // Mock WebP support
      mockCanvas.toDataURL = jest.fn((type) => {
        if (type === 'image/webp') {
          return 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
        }
        return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==';
      });

      const supportsWebP = (imageOptimizer as unknown).supportsWebP();
      expect(supportsWebP).toBe(true);

      // Mock no WebP support
      mockCanvas.toDataURL = jest.fn(() => 
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q=='
      );

      const doesNotSupportWebP = (imageOptimizer as unknown).supportsWebP();
      expect(doesNotSupportWebP).toBe(false);
    });
  });

  describe('Real-world Integration', () => {
    test('should work with typical image component pattern', () => {
      // Simulate typical usage
      const imageUrl = 'https://cdn.example.com/photos/beach-sunset.jpg';
      const optimizedImage = imageOptimizer.generateOptimizedImages(imageUrl, {
        alt: 'Beautiful beach sunset with orange and pink sky',
        priority: 8,
        loading: 'eager',
      });

      expect(optimizedImage.alt).toBe('Beautiful beach sunset with orange and pink sky');
      expect(optimizedImage.priority).toBe(8);
      expect(optimizedImage.loading).toBe('eager');
      expect(optimizedImage.formats.length).toBeGreaterThan(0);

      // Generate responsive attributes
      const webpSrcSet = imageOptimizer.generateSrcSet(optimizedImage, 'webp');
      const jpegSrcSet = imageOptimizer.generateSrcSet(optimizedImage, 'jpeg');
      const sizes = imageOptimizer.generateSizes();

      expect(webpSrcSet).toBeTruthy();
      expect(jpegSrcSet).toBeTruthy();
      expect(sizes).toBeTruthy();

      // Get optimal format
      const optimalFormat = imageOptimizer.getOptimalFormat(optimizedImage);
      expect(optimalFormat).toBeTruthy();
      expect(optimalFormat.url).toContain(imageUrl);
    });

    test('should handle video thumbnail optimization', () => {
      const videoThumbnail = 'https://video.example.com/thumbnail/abc123.jpg';
      const optimizedImage = imageOptimizer.generateOptimizedImages(videoThumbnail, {
        alt: 'Video thumbnail for wellness meditation session',
        priority: 6,
        loading: 'lazy',
      });

      expect(optimizedImage.aspectRatio).toBe(16 / 9); // Video aspect ratio
      expect(optimizedImage.formats).toHaveLength(8); // All breakpoints and formats
      
      // Should have proper video-optimized dimensions
      const thumbnailFormats = optimizedImage.formats.filter(f => f.width === 320);
      expect(thumbnailFormats.length).toBe(2); // WebP and JPEG
      expect(thumbnailFormats[0].height).toBe(180); // 16:9 ratio
    });
  });
});