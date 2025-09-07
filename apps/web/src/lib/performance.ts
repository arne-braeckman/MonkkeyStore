/**
 * Advanced performance benchmarking beyond basic timing
 * Provides comprehensive performance metrics and analysis
 */

export interface PerformanceBenchmark {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface BenchmarkSuite {
  name: string;
  benchmarks: PerformanceBenchmark[];
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
    median: number;
    percentile95: number;
    standardDeviation: number;
  };
}

export interface DatabaseBenchmarkResult {
  operation: string;
  table: string;
  recordCount?: number;
  duration: number;
  memoryUsed?: number;
  queryComplexity?: 'simple' | 'moderate' | 'complex';
}

/**
 * Performance benchmark collector and analyzer
 */
export class PerformanceBenchmarker {
  private static benchmarks: Map<string, PerformanceBenchmark[]> = new Map();
  private static memoryBaseline: number = 0;

  /**
   * Initialize memory baseline
   */
  static initializeBaseline(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      this.memoryBaseline = (performance as any).memory.usedJSHeapSize;
    }
  }

  /**
   * Record a performance benchmark
   */
  static recordBenchmark(
    suite: string,
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const benchmark: PerformanceBenchmark = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    };

    if (!this.benchmarks.has(suite)) {
      this.benchmarks.set(suite, []);
    }

    this.benchmarks.get(suite)!.push(benchmark);

    // Log if operation is slower than expected thresholds
    this.checkPerformanceThresholds(operation, duration);
  }

  /**
   * Check performance against expected thresholds
   */
  private static checkPerformanceThresholds(operation: string, duration: number): void {
    const thresholds: Record<string, number> = {
      'database_query': 50,
      'database_insert': 100,
      'database_update': 75,
      'database_delete': 50,
      'validation': 10,
      'sanitization': 5,
      'search': 200,
      'export': 1000,
      'bulk_operation': 5000
    };

    const operationType = this.getOperationType(operation);
    const threshold = thresholds[operationType];

    if (threshold && duration > threshold) {
      console.warn(`⚠️ Slow operation detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`);
    }
  }

  /**
   * Determine operation type from operation name
   */
  private static getOperationType(operation: string): string {
    if (operation.includes('query') || operation.includes('get') || operation.includes('list')) {
      return 'database_query';
    }
    if (operation.includes('insert') || operation.includes('create')) {
      return 'database_insert';
    }
    if (operation.includes('update') || operation.includes('patch')) {
      return 'database_update';
    }
    if (operation.includes('delete') || operation.includes('remove')) {
      return 'database_delete';
    }
    if (operation.includes('validate')) {
      return 'validation';
    }
    if (operation.includes('sanitize')) {
      return 'sanitization';
    }
    if (operation.includes('search')) {
      return 'search';
    }
    if (operation.includes('export')) {
      return 'export';
    }
    if (operation.includes('bulk')) {
      return 'bulk_operation';
    }
    return 'unknown';
  }

  /**
   * Analyze benchmarks for a suite
   */
  static analyzeBenchmarks(suite: string): BenchmarkSuite | null {
    const benchmarks = this.benchmarks.get(suite);
    if (!benchmarks || benchmarks.length === 0) {
      return null;
    }

    const durations = benchmarks.map(b => b.duration).sort((a, b) => a - b);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      name: suite,
      benchmarks: [...benchmarks],
      summary: {
        total: benchmarks.length,
        average: total / benchmarks.length,
        min: durations[0],
        max: durations[durations.length - 1],
        median: durations[Math.floor(durations.length / 2)],
        percentile95: durations[Math.floor(durations.length * 0.95)],
        standardDeviation: this.calculateStandardDeviation(durations)
      }
    };
  }

  /**
   * Calculate standard deviation
   */
  private static calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Generate performance report
   */
  static generateReport(): {
    suites: BenchmarkSuite[];
    overall: {
      totalOperations: number;
      slowOperations: number;
      averageResponseTime: number;
      recommendations: string[];
    };
  } {
    const suites: BenchmarkSuite[] = [];
    let totalOperations = 0;
    let slowOperations = 0;
    let totalDuration = 0;

    for (const suiteName of this.benchmarks.keys()) {
      const analysis = this.analyzeBenchmarks(suiteName);
      if (analysis) {
        suites.push(analysis);
        totalOperations += analysis.benchmarks.length;
        totalDuration += analysis.benchmarks.reduce((sum, b) => sum + b.duration, 0);
        slowOperations += analysis.benchmarks.filter(b => b.duration > 100).length;
      }
    }

    const recommendations: string[] = [];
    
    if (slowOperations > totalOperations * 0.1) {
      recommendations.push(`High number of slow operations (${slowOperations}/${totalOperations}). Consider query optimization.`);
    }
    
    const averageResponseTime = totalOperations > 0 ? totalDuration / totalOperations : 0;
    if (averageResponseTime > 75) {
      recommendations.push(`Average response time (${averageResponseTime.toFixed(2)}ms) exceeds target. Review database indexes and query patterns.`);
    }

    return {
      suites,
      overall: {
        totalOperations,
        slowOperations,
        averageResponseTime,
        recommendations
      }
    };
  }

  /**
   * Clear benchmarks for a suite or all suites
   */
  static clearBenchmarks(suite?: string): void {
    if (suite) {
      this.benchmarks.delete(suite);
    } else {
      this.benchmarks.clear();
    }
  }

  /**
   * Get memory usage information
   */
  static getMemoryUsage(): {
    current: number;
    peak: number;
    baseline: number;
    increase: number;
  } | null {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      current: memory.usedJSHeapSize,
      peak: memory.totalJSHeapSize,
      baseline: this.memoryBaseline,
      increase: memory.usedJSHeapSize - this.memoryBaseline
    };
  }
}

/**
 * Database-specific benchmarking utilities
 */
export class DatabaseBenchmarker {
  private static results: DatabaseBenchmarkResult[] = [];

  /**
   * Benchmark database operation with detailed metrics
   */
  static async benchmarkOperation<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>,
    complexity: 'simple' | 'moderate' | 'complex' = 'simple'
  ): Promise<{ result: T; benchmark: DatabaseBenchmarkResult }> {
    const memoryBefore = PerformanceBenchmarker.getMemoryUsage();
    const startTime = performance.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      const memoryAfter = PerformanceBenchmarker.getMemoryUsage();

      const benchmark: DatabaseBenchmarkResult = {
        operation,
        table,
        duration,
        queryComplexity: complexity,
        memoryUsed: memoryAfter && memoryBefore 
          ? memoryAfter.current - memoryBefore.current 
          : undefined
      };

      // Determine record count if result is an array
      if (Array.isArray(result)) {
        benchmark.recordCount = result.length;
      }

      this.results.push(benchmark);

      // Log if operation exceeds thresholds
      const thresholds = {
        simple: 50,
        moderate: 150,
        complex: 500
      };

      if (duration > thresholds[complexity]) {
        console.warn(`🐌 Slow ${complexity} query: ${operation} on ${table} took ${duration.toFixed(2)}ms`);
      }

      return { result, benchmark };

    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Database operation failed: ${operation} on ${table} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  /**
   * Get benchmark results with analysis
   */
  static getResults(): {
    results: DatabaseBenchmarkResult[];
    analysis: {
      byTable: Record<string, { count: number; avgDuration: number; slowest: number }>;
      byOperation: Record<string, { count: number; avgDuration: number; slowest: number }>;
      slowQueries: DatabaseBenchmarkResult[];
      memoryIntensive: DatabaseBenchmarkResult[];
    };
  } {
    const byTable: Record<string, { count: number; avgDuration: number; slowest: number }> = {};
    const byOperation: Record<string, { count: number; avgDuration: number; slowest: number }> = {};

    // Analyze by table
    for (const result of this.results) {
      if (!byTable[result.table]) {
        byTable[result.table] = { count: 0, avgDuration: 0, slowest: 0 };
      }
      byTable[result.table].count++;
      byTable[result.table].avgDuration = (byTable[result.table].avgDuration * (byTable[result.table].count - 1) + result.duration) / byTable[result.table].count;
      byTable[result.table].slowest = Math.max(byTable[result.table].slowest, result.duration);
    }

    // Analyze by operation
    for (const result of this.results) {
      if (!byOperation[result.operation]) {
        byOperation[result.operation] = { count: 0, avgDuration: 0, slowest: 0 };
      }
      byOperation[result.operation].count++;
      byOperation[result.operation].avgDuration = (byOperation[result.operation].avgDuration * (byOperation[result.operation].count - 1) + result.duration) / byOperation[result.operation].count;
      byOperation[result.operation].slowest = Math.max(byOperation[result.operation].slowest, result.duration);
    }

    const slowQueries = this.results.filter(r => r.duration > 100);
    const memoryIntensive = this.results.filter(r => r.memoryUsed && r.memoryUsed > 1000000); // > 1MB

    return {
      results: this.results,
      analysis: {
        byTable,
        byOperation,
        slowQueries,
        memoryIntensive
      }
    };
  }

  /**
   * Clear benchmark results
   */
  static clearResults(): void {
    this.results = [];
  }
}

/**
 * Load testing utilities
 */
export class LoadTester {
  /**
   * Run concurrent operation test
   */
  static async runConcurrentTest<T>(
    testName: string,
    operation: () => Promise<T>,
    concurrency: number = 10,
    iterations: number = 100
  ): Promise<{
    testName: string;
    concurrency: number;
    iterations: number;
    results: {
      totalDuration: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      successCount: number;
      errorCount: number;
      throughput: number; // operations per second
    };
  }> {
    console.log(`🚀 Starting load test: ${testName} (${concurrency} concurrent, ${iterations} total)`);
    
    const results: { duration: number; success: boolean }[] = [];
    const startTime = Date.now();

    // Run operations in batches of concurrent requests
    for (let i = 0; i < iterations; i += concurrency) {
      const batchSize = Math.min(concurrency, iterations - i);
      const promises = Array.from({ length: batchSize }, async () => {
        const opStart = performance.now();
        try {
          await operation();
          return { duration: performance.now() - opStart, success: true };
        } catch (error) {
          return { duration: performance.now() - opStart, success: false };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    const totalDuration = Date.now() - startTime;
    const durations = results.map(r => r.duration);
    const successCount = results.filter(r => r.success).length;

    return {
      testName,
      concurrency,
      iterations,
      results: {
        totalDuration,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successCount,
        errorCount: results.length - successCount,
        throughput: (successCount / totalDuration) * 1000 // ops per second
      }
    };
  }
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): void {
  PerformanceBenchmarker.initializeBaseline();
  
  // Set up periodic reporting (every 5 minutes in development)
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const report = PerformanceBenchmarker.generateReport();
      if (report.overall.totalOperations > 0) {
        console.log('📊 Performance Report:', {
          operations: report.overall.totalOperations,
          slow: report.overall.slowOperations,
          avgResponseTime: `${report.overall.averageResponseTime.toFixed(2)}ms`,
          recommendations: report.overall.recommendations
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Export singleton instances
export const performanceBenchmarker = PerformanceBenchmarker;
export const databaseBenchmarker = DatabaseBenchmarker;
export const loadTester = LoadTester;