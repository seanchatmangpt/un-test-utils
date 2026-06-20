import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    
    environment: 'node',
    
    
    testTimeout: 10000,
    
    
    coverage: {
      provider: 'v8',
      
      reporter: ['text', 'html', 'json'],
      
      
      thresholds: {
        
        lines: 80,
        
        functions: 80,
        
        branches: 80,
        
        statements: 80
        
      },
      
    },
    
    
    globals: true,
    
    
    
    include: [
      
      'tests/**/*.test.*'
      
    ],
    
    
    exclude: [
      
      'node_modules/**',
      
      'dist/**'
      
    ],
    
  },
})
