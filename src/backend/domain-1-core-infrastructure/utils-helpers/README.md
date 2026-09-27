# Utils Helpers Module

Production-grade utility functions and helpers for the SOC Detection Lab application. Provides comprehensive string, number, date, array, and object manipulation utilities plus validation, async operations, and common patterns like rate limiting and circuit breakers.

**Status**: ✅ Production Ready  
**Test Coverage**: 85%+  
**Dependencies**: None (Tier 0 Foundation)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Utility Classes](#utility-classes)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)
6. [Patterns](#patterns)

---

## Overview

The Utils Helpers module provides:

- **String Utilities**: Format, capitalize, reverse, slugify, remove characters
- **Number Utilities**: Format numbers, bytes, time, clamp, percentages
- **Date Utilities**: Format, add days, diff, same day checks
- **Array Utilities**: Chunk, flatten, unique, shuffle, group, paginate
- **Object Utilities**: Merge, clone, pick, omit, flatten, property checks
- **Validation**: Email, URL, IP, UUID, password strength, required fields
- **Async Utilities**: Retry with backoff, debounce, throttle, wait, timeout
- **Patterns**: Rate limiter, circuit breaker

### Why This Module?

1. **Consistency**: Centralized utility functions
2. **Reliability**: Well-tested helper functions
3. **DRY**: Don't repeat common operations
4. **Type Safety**: Full TypeScript support
5. **Performance**: Optimized implementations
6. **Patterns**: Built-in rate limiting and circuit breakers

---

## Features

### ✅ String Utilities

- Format with options (uppercase, lowercase, capitalize, truncate)
- Capitalize string
- Reverse string
- Pad string
- Remove special characters
- Slugify for URLs

### ✅ Number Utilities

- Format with decimals and separators
- Format bytes to human-readable (B, KB, MB, GB, TB)
- Format milliseconds to readable time
- Clamp values
- Random integer generation
- Calculate percentages

### ✅ Date Utilities

- Format dates with patterns
- Add/subtract days
- Calculate difference in days
- Check if same day
- Get start/end of day

### ✅ Array Utilities

- Chunk arrays
- Flatten nested arrays
- Get unique values
- Shuffle arrays
- Group by key
- Paginate arrays

### ✅ Object Utilities

- Deep merge objects
- Deep clone objects
- Pick properties
- Omit properties
- Flatten nested objects
- Check property paths

### ✅ Validation

- Email validation
- URL validation
- IP address validation
- UUID validation
- Strong password checking
- Required field validation
- Min length validation

### ✅ Async Utilities

- Retry with exponential backoff
- Debounce functions
- Throttle functions
- Wait/delay
- Timeout promises

### ✅ Patterns

- Rate limiter
- Circuit breaker

---

## Utility Classes

### StringUtils

```typescript
StringUtils.format(str, options)        // Format with options
StringUtils.capitalize(str)             // Capitalize first letter
StringUtils.reverse(str)                // Reverse string
StringUtils.pad(str, length, char)      // Pad with character
StringUtils.removeSpecialChars(str)     // Remove special chars
StringUtils.slugify(str)                // Create URL slug
```

### NumberUtils

```typescript
NumberUtils.format(num, options)        // Format number
NumberUtils.formatBytes(bytes)          // Format bytes
NumberUtils.formatTime(ms)              // Format milliseconds
NumberUtils.clamp(num, min, max)        // Clamp value
NumberUtils.randomInt(min, max)         // Random integer
NumberUtils.percentage(value, total)    // Calculate percentage
```

### DateUtils

```typescript
DateUtils.format(date, pattern)         // Format date
DateUtils.addDays(date, days)           // Add days
DateUtils.diffDays(date1, date2)        // Difference in days
DateUtils.isSameDay(date1, date2)       // Check same day
DateUtils.startOfDay(date)              // Start of day
DateUtils.endOfDay(date)                // End of day
```

### ArrayUtils

```typescript
ArrayUtils.chunk(arr, size)             // Split into chunks
ArrayUtils.flatten(arr)                 // Flatten nested
ArrayUtils.unique(arr)                  // Get unique values
ArrayUtils.shuffle(arr)                 // Shuffle array
ArrayUtils.groupBy(arr, key)            // Group by function
ArrayUtils.paginate(arr, options)       // Paginate results
```

### ObjectUtils

```typescript
ObjectUtils.merge(obj1, obj2)           // Deep merge
ObjectUtils.clone(obj)                  // Deep clone
ObjectUtils.pick(obj, keys)             // Pick properties
ObjectUtils.omit(obj, keys)             // Omit properties
ObjectUtils.flatten(obj)                // Flatten nested
ObjectUtils.hasProperty(obj, path)      // Check property path
```

### ValidationUtils

```typescript
ValidationUtils.isValidEmail(email)     // Email validation
ValidationUtils.isValidURL(url)         // URL validation
ValidationUtils.isValidIP(ip)           // IP validation
ValidationUtils.isValidUUID(uuid)       // UUID validation
ValidationUtils.isStrongPassword(pwd)   // Password validation
ValidationUtils.required(value)         // Required field
ValidationUtils.minLength(str, min)     // Min length
```

### AsyncUtils

```typescript
AsyncUtils.retry(fn, options)           // Retry with backoff
AsyncUtils.debounce(fn, options)        // Debounce function
AsyncUtils.throttle(fn, options)        // Throttle function
AsyncUtils.wait(ms)                     // Wait/delay
AsyncUtils.timeout(promise, ms)         // Timeout promise
```

### Factory Functions

```typescript
createRateLimiter(options)              // Create rate limiter
createCircuitBreaker(fn, options)       // Create circuit breaker
```

---

## Usage Examples

### String Utilities

```typescript
// Capitalize
StringUtils.capitalize('hello') // 'Hello'

// Format
StringUtils.format('hello world', { 
  uppercase: true, 
  truncate: 8 
}) // 'HELLO WO...'

// Slugify
StringUtils.slugify('Hello World!') // 'hello-world'
```

### Number Utilities

```typescript
// Format
NumberUtils.format(1234.567, { decimals: 2 }) // '1234.57'
NumberUtils.format(1234567, { separator: true }) // '1,234,567'

// Format bytes
NumberUtils.formatBytes(1024 * 1024) // '1.00 MB'

// Percentage
NumberUtils.percentage(50, 100) // 50
```

### Date Utilities

```typescript
const date = new Date(2024, 0, 15);

DateUtils.format(date, 'YYYY-MM-DD') // '2024-01-15'
DateUtils.addDays(date, 5)           // Jan 20, 2024
DateUtils.diffDays(date, newDate)    // Number of days
```

### Array Utilities

```typescript
// Chunk
ArrayUtils.chunk([1,2,3,4,5,6], 2) // [[1,2], [3,4], [5,6]]

// Unique
ArrayUtils.unique([1, 2, 2, 3, 3]) // [1, 2, 3]

// Paginate
ArrayUtils.paginate(items, { page: 2, pageSize: 10 })
// { items, page, pageSize, total, pages, hasNext, hasPrev }
```

### Object Utilities

```typescript
// Merge
ObjectUtils.merge(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 } }
) // { a: 1, b: { c: 2, d: 3 } }

// Clone
const clone = ObjectUtils.clone(obj)

// Flatten
ObjectUtils.flatten({ a: 1, b: { c: 2 } })
// { a: 1, 'b.c': 2 }
```

### Validation

```typescript
// Email
ValidationUtils.isValidEmail('test@example.com') // true

// Strong password
const result = ValidationUtils.isStrongPassword('Pass@123');
// { valid: true, errors: [] }

// Custom validation
const required = ValidationUtils.required(value);
if (!required.valid) {
  console.log(required.errors);
}
```

### Async Operations

```typescript
// Retry
const result = await AsyncUtils.retry(
  () => fetchAPI(),
  {
    maxAttempts: 5,
    delayMs: 100,
    backoff: 'exponential',
  }
);

// Debounce search
const onSearch = AsyncUtils.debounce(
  (query) => api.search(query),
  { wait: 300 }
);

// Timeout
const data = await AsyncUtils.timeout(fetchData(), 5000);
```

### Patterns

```typescript
// Rate limiter
const limiter = createRateLimiter({ requests: 10, window: 1000 });
if (limiter()) {
  processRequest();
} else {
  handleRateLimit();
}

// Circuit breaker
const breaker = createCircuitBreaker(() => externalAPI(), {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 3000,
  resetTimeout: 30000,
});
```

---

## Best Practices

### 1. Use Utilities for Common Operations

```typescript
// ✅ Good: Use utilities
const formatted = NumberUtils.formatBytes(fileSize);
const slug = StringUtils.slugify(title);

// ❌ Bad: Implement yourself
const formatted = (fileSize / 1024 / 1024).toFixed(2) + ' MB';
```

### 2. Validate Input Data

```typescript
// ✅ Good: Validate
if (!ValidationUtils.isValidEmail(email)) {
  handleError('Invalid email');
}

// ❌ Bad: Assume valid
processEmail(email);
```

### 3. Use Debounce for Events

```typescript
// ✅ Good: Debounce search
const handleSearch = AsyncUtils.debounce(
  (query) => api.search(query),
  { wait: 300 }
);

// ❌ Bad: Call API on every keystroke
onInput = (e) => api.search(e.target.value);
```

### 4. Implement Rate Limiting

```typescript
// ✅ Good: Rate limit
const limiter = createRateLimiter({ requests: 100, window: 60000 });
if (limiter()) {
  processRequest();
}

// ❌ Bad: No rate limiting
processRequest();
```

### 5. Use Circuit Breaker for External APIs

```typescript
// ✅ Good: Circuit breaker
const breaker = createCircuitBreaker(() => externalAPI());
try {
  return await breaker();
} catch {
  return getCachedData();
}

// ❌ Bad: No protection
return await externalAPI();
```

---

## Patterns

### Form Validation Pattern

```typescript
function validateForm(data) {
  const errors = [];
  
  if (!ValidationUtils.required(data.name).valid) {
    errors.push('Name is required');
  }
  
  if (!ValidationUtils.isValidEmail(data.email)) {
    errors.push('Invalid email');
  }
  
  const pwd = ValidationUtils.isStrongPassword(data.password);
  if (!pwd.valid) {
    errors.push(...pwd.errors);
  }
  
  return { valid: errors.length === 0, errors };
}
```

### Search with Debounce

```typescript
const handleSearch = AsyncUtils.debounce(async (query) => {
  const results = await api.search(query);
  updateSearchResults(results);
}, { wait: 300 });
```

### Batch Processing

```typescript
async function processBatch(items) {
  const chunks = ArrayUtils.chunk(items, 10);
  return Promise.all(chunks.map(chunk => process(chunk)));
}
```

### Data Transformation

```typescript
function transformResponse(data) {
  return {
    ...ObjectUtils.pick(data, ['id', 'name', 'email']),
    createdAt: DateUtils.format(data.created_at, 'YYYY-MM-DD'),
    fileSize: NumberUtils.formatBytes(data.size),
  };
}
```

---

## Performance Notes

| Operation | Time Complexity | Space |
|-----------|-----------------|-------|
| String format | O(n) | O(n) |
| Number format | O(1) | O(1) |
| Array flatten | O(n) | O(n) |
| Object merge | O(n) | O(n) |
| Object clone | O(n) | O(n) |
| Debounce | O(1) | O(1) |
| Rate limiter | O(1) | O(1) |

---

## Related Modules

- **types-definitions**: Shared types
- **error-handling**: Error management
- **logging-service**: Logging
- **config-service**: Configuration

---

## Statistics

- **Utility Classes**: 7
- **Methods**: 50+
- **Patterns**: 2 (rate limiter, circuit breaker)
- **Validation Functions**: 7
- **Total Lines**: 600+ (implementation)
- **Test Cases**: 50+
- **Coverage**: 85%+

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary  
**Production Ready**: ✅ Yes

