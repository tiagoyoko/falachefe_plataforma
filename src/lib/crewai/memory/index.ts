// Sistema de Memória - Exports principais
export { MemoryManager, getMemoryManager, initializeMemoryManager } from './memory-manager';
export { IndividualMemoryManager } from './individual-memory-manager';
export { SharedMemoryManager } from './shared-memory-manager';
export { memoryRedisConfig, getMemoryKey, getMemoryPattern } from './redis-config';

// Types
export type { MemoryManagerInterface, MemoryStats, CleanupResult } from './memory-manager';
export type { IndividualMemoryData } from './individual-memory-manager';
export type { SharedMemoryData } from './shared-memory-manager';
export type { MemoryRedisConfig } from './redis-config';

// Exemplo de uso
export { exampleUsage } from './example-usage';
