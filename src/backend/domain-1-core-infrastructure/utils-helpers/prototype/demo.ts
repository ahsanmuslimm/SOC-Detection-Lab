/**
 * Utils Helpers - Demo/Prototype
 * Demonstrates utility functions for common tasks
 */

import {
  StringUtils,
  NumberUtils,
  DateUtils,
  ArrayUtils,
  ObjectUtils,
  ValidationUtils,
  AsyncUtils,
  createRateLimiter,
  createCircuitBreaker,
} from '../src/main';

console.log('=== Utils Helpers - Demonstration ===\n');

// ============================================================
// 1. String Utilities
// ============================================================
console.log('1. String Utilities');
console.log('-------------------');

const stringExamples = `
// Capitalize
StringUtils.capitalize('hello world') → 'Hello world'

// Format with options
StringUtils.format('hello world', { 
  uppercase: true, 
  truncate: 8 
}) → 'HELLO WO...'

// Reverse
StringUtils.reverse('hello') → 'olleh'

// Remove special characters
StringUtils.removeSpecialChars('hello@world!') → 'helloworld'

// Slugify (for URLs)
StringUtils.slugify('Hello World!') → 'hello-world'

// Pad string
StringUtils.pad('hello', 10) → 'hello     '
`;

console.log(stringExamples);
console.log();

// ============================================================
// 2. Number Utilities
// ============================================================
console.log('2. Number Utilities');
console.log('-------------------');

const numberExamples = `
// Format number
NumberUtils.format(1234.567, { decimals: 2 }) → '1234.57'
NumberUtils.format(1234567, { separator: true }) → '1,234,567'
NumberUtils.format(99, { prefix: '$', suffix: '.00' }) → '$99.00'

// Format bytes
NumberUtils.formatBytes(1024 * 1024) → '1.00 MB'
NumberUtils.formatBytes(5 * 1024 * 1024 * 1024) → '5.00 GB'

// Format time
NumberUtils.formatTime(1000) → '1.00s'
NumberUtils.formatTime(60000) → '1.00min'
NumberUtils.formatTime(3600000) → '1.00h'

// Clamp value
NumberUtils.clamp(150, 0, 100) → 100
NumberUtils.clamp(-10, 0, 100) → 0

// Random integer
NumberUtils.randomInt(1, 10) → 7 (random between 1-10)

// Percentage
NumberUtils.percentage(50, 100) → 50
NumberUtils.percentage(25, 100) → 25
`;

console.log(numberExamples);
console.log();

// ============================================================
// 3. Date Utilities
// ============================================================
console.log('3. Date Utilities');
console.log('-----------------');

const dateExamples = `
// Format date
const date = new Date(2024, 0, 15);
DateUtils.format(date, 'YYYY-MM-DD') → '2024-01-15'
DateUtils.format(date, 'YYYY-MM-DD HH:mm:ss') → '2024-01-15 00:00:00'

// Add days
DateUtils.addDays(new Date(2024, 0, 1), 5) → Jan 6, 2024

// Difference in days
DateUtils.diffDays(new Date(2024, 0, 1), new Date(2024, 0, 11)) → 10

// Same day check
DateUtils.isSameDay(new Date(2024, 0, 1, 10), new Date(2024, 0, 1, 15)) → true

// Start/end of day
DateUtils.startOfDay(date) → 2024-01-15 00:00:00
DateUtils.endOfDay(date) → 2024-01-15 23:59:59
`;

console.log(dateExamples);
console.log();

// ============================================================
// 4. Array Utilities
// ============================================================
console.log('4. Array Utilities');
console.log('------------------');

const arrayExamples = `
// Chunk array
ArrayUtils.chunk([1,2,3,4,5,6], 2) → [[1,2], [3,4], [5,6]]

// Flatten
ArrayUtils.flatten([1, [2, [3, 4]], 5]) → [1, 2, 3, 4, 5]

// Unique values
ArrayUtils.unique([1, 2, 2, 3, 3, 3]) → [1, 2, 3]

// Shuffle
ArrayUtils.shuffle([1, 2, 3, 4, 5]) → [3, 1, 5, 2, 4] (random)

// Group by
ArrayUtils.groupBy(
  [{category: 'A', value: 1}, {category: 'A', value: 2}],
  item => item.category
) → { A: [{...}, {...}] }

// Paginate
ArrayUtils.paginate([1..25], {page: 2, pageSize: 10}) → {
  items: [11, 12, ..., 20],
  page: 2,
  pageSize: 10,
  total: 25,
  pages: 3,
  hasNext: true,
  hasPrev: true
}
`;

console.log(arrayExamples);
console.log();

// ============================================================
// 5. Object Utilities
// ============================================================
console.log('5. Object Utilities');
console.log('-------------------');

const objectExamples = `
// Deep merge
ObjectUtils.merge(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 } }
) → { a: 1, b: { c: 2, d: 3 } }

// Deep clone
const obj = { a: 1, b: { c: 2 } };
const clone = ObjectUtils.clone(obj);
// clone is completely independent from obj

// Pick properties
ObjectUtils.pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) → { a: 1, c: 3 }

// Omit properties
ObjectUtils.omit({ a: 1, b: 2, c: 3 }, ['b']) → { a: 1, c: 3 }

// Flatten object
ObjectUtils.flatten({ a: 1, b: { c: 2, d: { e: 3 } } }) → {
  a: 1,
  'b.c': 2,
  'b.d.e': 3
}

// Has property path
ObjectUtils.hasProperty({ a: { b: { c: 1 } } }, 'a.b.c') → true
`;

console.log(objectExamples);
console.log();

// ============================================================
// 6. Validation Utilities
// ============================================================
console.log('6. Validation Utilities');
console.log('----------------------');

const validationExamples = `
// Validate email
ValidationUtils.isValidEmail('test@example.com') → true
ValidationUtils.isValidEmail('invalid.email') → false

// Validate URL
ValidationUtils.isValidURL('https://example.com') → true
ValidationUtils.isValidURL('not a url') → false

// Validate IP address
ValidationUtils.isValidIP('192.168.1.1') → true
ValidationUtils.isValidIP('invalid.ip') → false

// Validate UUID
const uuid = '550e8400-e29b-41d4-a716-446655440000';
ValidationUtils.isValidUUID(uuid) → true

// Validate strong password
const result = ValidationUtils.isStrongPassword('WeakPass');
// result.valid = false
// result.errors = [
//   'Password must be at least 8 characters',
//   'Password must contain special character'
// ]

// Validate required
ValidationUtils.required('value') → { valid: true, errors: [] }
ValidationUtils.required('') → { valid: false, errors: ['Field is required'] }

// Validate min length
ValidationUtils.minLength('hello', 3) → { valid: true, errors: [] }
`;

console.log(validationExamples);
console.log();

// ============================================================
// 7. Async Utilities
// ============================================================
console.log('7. Async Utilities');
console.log('------------------');

const asyncExamples = `
// Retry with exponential backoff
async function fetchWithRetry() {
  return AsyncUtils.retry(
    () => fetch('https://api.example.com'),
    {
      maxAttempts: 5,
      delayMs: 100,
      backoff: 'exponential',
      backoffMultiplier: 2
    }
  );
}

// Debounce (for input/search)
const onSearch = AsyncUtils.debounce(
  (query) => api.search(query),
  { wait: 300 }
);
// Called 300ms after user stops typing

// Throttle (for scroll/resize)
const onScroll = AsyncUtils.throttle(
  () => updateLayout(),
  { wait: 100 }
);
// Called at most every 100ms

// Wait
await AsyncUtils.wait(1000); // Wait 1 second

// Timeout promise
const result = await AsyncUtils.timeout(
  fetchData(),
  5000 // Timeout after 5 seconds
);
`;

console.log(asyncExamples);
console.log();

// ============================================================
// 8. Rate Limiter
// ============================================================
console.log('8. Rate Limiter');
console.log('---------------');

const rateLimiterExample = `
// Create rate limiter (3 requests per 1000ms)
const limiter = createRateLimiter({ requests: 3, window: 1000 });

function handleRequest() {
  if (limiter()) {
    // Process request
    processRequest();
  } else {
    // Rate limit exceeded
    sendError(429);
  }
}

// Usage in request handler
app.post('/api/data', (req, res) => {
  if (!limiter()) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  // Process request
});
`;

console.log(rateLimiterExample);
console.log();

// ============================================================
// 9. Circuit Breaker
// ============================================================
console.log('9. Circuit Breaker');
console.log('------------------');

const circuitBreakerExample = `
// Create circuit breaker
const breaker = createCircuitBreaker(
  () => callExternalAPI(),
  {
    failureThreshold: 5,     // Open after 5 failures
    successThreshold: 2,     // Close after 2 successes in half-open
    timeout: 3000,           // 3 second timeout per call
    resetTimeout: 30000      // Try again after 30 seconds
  }
);

// Usage
async function safeAPICall() {
  try {
    return await breaker();
  } catch (err) {
    if (err.message === 'Circuit breaker is open') {
      // Circuit is open - return cached data
      return getCachedData();
    }
    throw err;
  }
}

// States:
// - CLOSED: Normal operation
// - OPEN: Stop calling, return error
// - HALF-OPEN: Try again after reset timeout
`;

console.log(circuitBreakerExample);
console.log();

// ============================================================
// 10. Real-World Patterns
// ============================================================
console.log('10. Real-World Patterns');
console.log('----------------------');

const patterns = `
// Pattern 1: Form validation
function validateForm(data) {
  const errors = [];
  
  if (!ValidationUtils.required(data.name).valid) {
    errors.push('Name is required');
  }
  
  if (!ValidationUtils.isValidEmail(data.email)) {
    errors.push('Invalid email');
  }
  
  const passwordCheck = ValidationUtils.isStrongPassword(data.password);
  if (!passwordCheck.valid) {
    errors.push(...passwordCheck.errors);
  }
  
  return { valid: errors.length === 0, errors };
}

// Pattern 2: Data transformation
function transformResponse(data) {
  return {
    ...ObjectUtils.pick(data, ['id', 'name', 'email']),
    createdAt: DateUtils.format(data.created_at, 'YYYY-MM-DD'),
    fileSize: NumberUtils.formatBytes(data.size),
  };
}

// Pattern 3: Batch processing
function processBatch(items) {
  const chunks = ArrayUtils.chunk(items, 10);
  return Promise.all(chunks.map(chunk => processItems(chunk)));
}

// Pattern 4: Search with debounce
const handleSearch = AsyncUtils.debounce(async (query) => {
  const results = await api.search(query);
  updateUI(results);
}, { wait: 300 });

// Pattern 5: Pagination with filtering
function getFilteredPage(items, filter, page, pageSize) {
  const filtered = items.filter(filter);
  return ArrayUtils.paginate(filtered, { page, pageSize });
}
`;

console.log(patterns);
console.log();

// ============================================================
// 11. Feature Summary
// ============================================================
console.log('11. Feature Summary');
console.log('-------------------');

const features = {
  'String Utils': ['Format', 'Capitalize', 'Reverse', 'Slugify', 'Remove special chars'],
  'Number Utils': ['Format', 'Format bytes', 'Format time', 'Clamp', 'Random', 'Percentage'],
  'Date Utils': ['Format', 'Add days', 'Diff days', 'Same day', 'Start/End of day'],
  'Array Utils': ['Chunk', 'Flatten', 'Unique', 'Shuffle', 'Group by', 'Paginate'],
  'Object Utils': ['Merge', 'Clone', 'Pick', 'Omit', 'Flatten', 'Has property'],
  'Validation': ['Email', 'URL', 'IP', 'UUID', 'Strong password', 'Required', 'Min length'],
  'Async Utils': ['Retry', 'Debounce', 'Throttle', 'Wait', 'Timeout'],
  'Patterns': ['Rate limiter', 'Circuit breaker'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log('\nTotal utility functions: 50+');
console.log('Patterns covered: 5+');
console.log('Use cases: Form validation, data transformation, async handling, API integration');
