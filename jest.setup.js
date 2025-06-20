import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase client
jest.mock('./src/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          ilike: jest.fn(() => ({
            single: jest.fn()
          })),
          not: jest.fn(() => ({
            single: jest.fn()
          })),
          single: jest.fn(),
          limit: jest.fn()
        })),
        not: jest.fn(() => ({
          single: jest.fn()
        })),
        ilike: jest.fn(() => ({
          single: jest.fn()
        })),
        or: jest.fn(() => ({
          limit: jest.fn()
        })),
        single: jest.fn(),
        limit: jest.fn()
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }))
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}