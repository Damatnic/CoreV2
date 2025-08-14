# CoreV2 Launch Fixes - Todo List

## CRITICAL PRIORITY - App Launch Blockers

### 1. Performance Monitoring Service Issues ✅ (Working on)
- **File**: `src/services/performanceMonitoringService.ts`
- **Issues**: 
  - Union types need type aliases
  - Properties should be marked readonly
  - Unnecessary type assertions
  - High cognitive complexity functions
  - Use RegExp.exec() instead of .match()
  - Deprecated .substr() method
- **Impact**: Core service failure affects entire application performance tracking

### 2. TypeScript Compilation Errors (1188 errors total)
- **Critical Files**:
  - `src/utils/envValidator.ts` - Environment validation broken
  - `src/main.tsx` - App entry point has issues
  - `src/routes/AppRoutes.tsx` - Routing failures
  - `src/components/auth/AuthGuard.tsx` - Authentication broken

### 3. Port Conflicts
- **Issue**: Port 8888 already in use (Netlify dev)
- **Current Workaround**: Using Vite dev server on port 3006
- **Action**: Need to configure proper development environment

## HIGH PRIORITY - Core Functionality

### 4. Type Definition Mismatches
- **Files**: Multiple test files and services
- **Issues**: Interface mismatches, missing properties, incompatible types
- **Impact**: Runtime errors, broken features

### 5. Service Integration Issues
- Cultural assessment services have type mismatches
- Crisis detection integration problems  
- Auth service integration issues

### 6. Test Failures
- Multiple test suites failing due to type errors
- Mock implementations not matching real interfaces

## MEDIUM PRIORITY - Code Quality

### 7. Unused Variables and Dead Code
- Multiple files with unused variables
- Some functions with unused parameters
- Need cleanup for better maintainability

### 8. Deprecated API Usage
- `substr()` method usage (deprecated)
- Some Intl API issues for locale formatting
- Need to update to modern APIs

## LOW PRIORITY - Optimizations

### 9. Performance Optimizations
- Large function complexity needs refactoring
- Bundle optimization opportunities
- Better tree-shaking potential

### 10. Accessibility Improvements
- Some accessibility service issues
- Screen reader service needs fixes

## IMMEDIATE ACTION PLAN

1. **Fix Performance Monitoring Service** (Current task)
2. **Fix Environment Validator** 
3. **Fix Main App Entry Point**
4. **Fix Authentication System**
5. **Fix Routing System**
6. **Run Basic Functionality Tests**

## SUCCESS CRITERIA

- [ ] Application launches without TypeScript errors
- [ ] All core services initialize properly
- [ ] Authentication flow works
- [ ] Basic routing functions
- [ ] No critical runtime errors in browser console
- [ ] Performance monitoring service operational

## NOTES

- Using Vite dev server on port 3006 temporarily
- Need to address environment configuration
- Priority is getting basic app functionality working
- Will address tests and optimizations after core app is stable
