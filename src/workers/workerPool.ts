/**
 * Web Worker Pool
 * 
 * Manages multiple workers for parallel analysis with task queuing,
 * health monitoring, and automatic restart capabilities.
 * 
 * @module workers/workerPool
 */

/**
 * Task priority levels
 */
export type TaskPriority = 'high' | 'normal' | 'low';

/**
 * Worker task definition
 */
export interface WorkerTask<TInput = unknown, TOutput = unknown> {
  id: string;
  type: string;
  input: TInput;
  priority: TaskPriority;
  resolve: (value: TOutput) => void;
  reject: (reason: Error) => void;
  retryCount: number;
  maxRetries: number;
  timeout: number;
}

/**
 * Worker state
 */
interface WorkerState {
  worker: Worker;
  busy: boolean;
  taskId: string | null;
  healthCheckFailures: number;
  lastActivity: number;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  /** Number of workers to maintain */
  poolSize: number;
  /** Max tasks in queue before rejecting */
  maxQueueSize: number;
  /** Health check interval in ms */
  healthCheckInterval: number;
  /** Max health check failures before restart */
  maxHealthCheckFailures: number;
  /** Worker idle timeout in ms */
  idleTimeout: number;
  /** Default task timeout in ms */
  defaultTaskTimeout: number;
  /** Max retries for failed tasks */
  maxRetries: number;
}

const DEFAULT_CONFIG: WorkerPoolConfig = {
  poolSize: navigator.hardwareConcurrency || 4,
  maxQueueSize: 100,
  healthCheckInterval: 30000, // 30s
  maxHealthCheckFailures: 3,
  idleTimeout: 60000, // 1min
  defaultTaskTimeout: 30000, // 30s
  maxRetries: 2
};

/**
 * Worker pool for managing multiple analysis workers
 */
export class WorkerPool {
  private workers: WorkerState[] = [];
  private taskQueue: Array<WorkerTask<unknown, unknown>> = [];
  private config: WorkerPoolConfig;
  private healthCheckTimer: number | null = null;
  private workerScript: string;
  private isTerminated = false;
  
  constructor(workerScript: string, config: Partial<WorkerPoolConfig> = {}) {
    this.workerScript = workerScript;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }
  
  /**
   * Initialize the worker pool
   */
  private initialize(): void {
    for (let i = 0; i < this.config.poolSize; i++) {
      this.addWorker();
    }
    
    this.startHealthChecks();
  }
  
  /**
   * Add a new worker to the pool
   */
  private addWorker(): WorkerState {
    const worker = new Worker(this.workerScript, { type: 'module' });
    
    const state: WorkerState = {
      worker,
      busy: false,
      taskId: null,
      healthCheckFailures: 0,
      lastActivity: Date.now()
    };
    
    worker.onmessage = (event) => this.handleMessage(state, event);
    worker.onerror = (error) => this.handleError(state, error);
    
    this.workers.push(state);
    return state;
  }
  
  /**
   * Remove a worker from the pool
   */
  private removeWorker(state: WorkerState): void {
    const index = this.workers.indexOf(state);
    if (index > -1) {
      this.workers.splice(index, 1);
    }
    
    state.worker.terminate();
    
    // If there was a task assigned, requeue it
    if (state.taskId !== null) {
      const task = this.taskQueue.find(t => t.id === state.taskId);
      if (task) {
        this.taskQueue = this.taskQueue.filter(t => t.id !== state.taskId);
        this.execute(task);
      }
    }
  }
  
  /**
   * Handle message from worker
   */
  private handleMessage(state: WorkerState, event: MessageEvent): void {
    state.lastActivity = Date.now();
    state.healthCheckFailures = 0;
    
    const { taskId, result, error } = event.data;
    
    if (typeof taskId === 'string' && state.taskId === taskId) {
      state.busy = false;
      state.taskId = null;
      
      const task = this.taskQueue.find(t => t.id === taskId);
      if (task) {
        this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
        
        if (error !== undefined && error !== null) {
          if (task.retryCount < task.maxRetries) {
            task.retryCount++;
            this.execute(task);
          } else {
            task.reject(new Error(error));
          }
        } else {
          task.resolve(result);
        }
      }
      
      // Process next task
      this.processQueue();
    }
  }
  
  /**
   * Handle worker error
   */
  private handleError(state: WorkerState, error: ErrorEvent): void {
    console.error('Worker error:', error);
    
    // Remove and replace the worker
    this.removeWorker(state);
    this.addWorker();
  }
  
  /**
   * Execute a task on an available worker
   */
  private execute<TInput, TOutput>(task: WorkerTask<TInput, TOutput>): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      const enhancedTask: WorkerTask<TInput, TOutput> = {
        ...task,
        resolve,
        reject
      };
      
      // Find available worker
      const availableWorker = this.workers.find(w => !w.busy);
      
      if (availableWorker) {
        this.assignTask(availableWorker, enhancedTask);
      } else {
        // Add to queue
        if (this.taskQueue.length >= this.config.maxQueueSize) {
          reject(new Error('Task queue is full'));
          return;
        }
        
        this.taskQueue.push(enhancedTask as WorkerTask<unknown, unknown>);
        this.sortQueue();
      }
      
      // Set timeout
      setTimeout(() => {
        const stillQueued = this.taskQueue.find(t => t.id === task.id);
        if (stillQueued) {
          this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
          reject(new Error('Task timeout'));
        }
      }, task.timeout);
    });
  }
  
  /**
   * Assign a task to a worker
   */
  private assignTask<TInput, TOutput>(state: WorkerState, task: WorkerTask<TInput, TOutput>): void {
    state.busy = true;
    state.taskId = task.id;
    state.lastActivity = Date.now();
    
    state.worker.postMessage({
      taskId: task.id,
      type: task.type,
      input: task.input
    });
  }
  
  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;
    
    const task = this.taskQueue.shift();
    if (task) {
      this.assignTask(availableWorker, task);
    }
  }
  
  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityWeight = { high: 0, normal: 1, low: 2 };
    this.taskQueue.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
  }
  
  /**
   * Start health check interval
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = window.setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Perform health checks on all workers
   */
  private performHealthChecks(): void {
    const now = Date.now();
    
    for (const state of this.workers) {
      // Check for idle timeout
      if (!state.busy && now - state.lastActivity > this.config.idleTimeout) {
        // Worker is idle for too long, keep it but note it's healthy
        state.healthCheckFailures = 0;
      }
      
      // Check for stuck workers
      if (state.busy && now - state.lastActivity > this.config.defaultTaskTimeout * 2) {
        state.healthCheckFailures++;
        
        if (state.healthCheckFailures >= this.config.maxHealthCheckFailures) {
          // Restart the worker
          this.removeWorker(state);
          this.addWorker();
        }
      }
    }
    
    // Ensure we have the correct number of workers
    while (this.workers.length < this.config.poolSize) {
      this.addWorker();
    }
  }
  
  /**
   * Submit a task to the pool
   */
  submit<TInput, TOutput>(
    type: string,
    input: TInput,
    priority: TaskPriority = 'normal',
    options: { timeout?: number; maxRetries?: number } = {}
  ): Promise<TOutput> {
    if (this.isTerminated) {
      return Promise.reject(new Error('Worker pool is terminated'));
    }
    
    const task: WorkerTask<TInput, TOutput> = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      input,
      priority,
      resolve: () => {},
      reject: () => {},
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      timeout: options.timeout ?? this.config.defaultTaskTimeout
    };
    
    return this.execute(task);
  }
  
  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    queueLength: number;
    isHealthy: boolean;
  } {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      queueLength: this.taskQueue.length,
      isHealthy: !this.isTerminated && this.workers.length > 0
    };
  }
  
  /**
   * Terminate all workers
   */
  terminate(): void {
    this.isTerminated = true;
    
    if (this.healthCheckTimer !== null) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Reject all pending tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Worker pool terminated'));
    }
    this.taskQueue = [];
    
    // Terminate all workers
    for (const state of this.workers) {
      state.worker.terminate();
    }
    this.workers = [];
  }
}

/**
 * Global worker pool instance
 */
let globalPool: WorkerPool | null = null;

/**
 * Initialize the global worker pool
 */
export function initializeWorkerPool(workerScript: string, config?: Partial<WorkerPoolConfig>): WorkerPool {
  if (globalPool) {
    globalPool.terminate();
  }
  
  globalPool = new WorkerPool(workerScript, config);
  return globalPool;
}

/**
 * Get the global worker pool
 */
export function getWorkerPool(): WorkerPool | null {
  return globalPool;
}

/**
 * Terminate the global worker pool
 */
export function terminateWorkerPool(): void {
  if (globalPool) {
    globalPool.terminate();
    globalPool = null;
  }
}
