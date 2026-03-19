import { v4 as uuid } from 'uuid';

export interface MemoryChunk {
  id: string;
  content: string;
  timestamp: string;
}

export class MemoryManager {
  private companyId: string;
  private ownerId: string;
  private ownerType: 'company' | 'employee' | 'department' | 'shared';

  constructor(companyId: string, ownerId: string, ownerType: 'company' | 'employee' | 'department' | 'shared') {
    this.companyId = companyId;
    this.ownerId = ownerId;
    this.ownerType = ownerType;
  }

  async add(content: string): Promise<void> {
    // Basic chunking logic on client before sending to server
    const chunks = this.chunkText(content, 1000, 100);
    
    for (let i = 0; i < chunks.length; i++) {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuid(),
          companyId: this.companyId,
          ownerId: this.ownerId,
          ownerType: this.ownerType,
          content: chunks[i],
          chunkIndex: i,
          totalChunks: chunks.length,
        }),
      });
    }
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      let end = start + chunkSize;
      chunks.push(text.slice(start, Math.min(end, text.length)));
      start = end - overlap;
      if (start < 0) start = 0;
      if (end >= text.length) break;
    }
    return chunks;
  }

  async retrieve(query: string, limit = 5): Promise<string[]> {
    const response = await fetch(`/api/memory/${this.companyId}/${this.ownerId}/${this.ownerType}`);
    if (!response.ok) return [];
    
    const allContent = await response.json();
    
    // Simple client-side filtering for relevant chunks
    const queryLower = query.toLowerCase();
    return allContent
      .filter((content: string) => content.toLowerCase().includes(queryLower))
      .slice(0, limit);
  }

  async getAll(): Promise<string[]> {
    const response = await fetch(`/api/memory/${this.companyId}/${this.ownerId}/${this.ownerType}`);
    if (!response.ok) return [];
    return await response.json();
  }
}

export function getSharedMemory(companyId: string): MemoryManager {
  return new MemoryManager(companyId, 'shared', 'shared');
}

export function getCompanyMemory(companyId: string): MemoryManager {
  return new MemoryManager(companyId, companyId, 'company');
}

export function getEmployeeMemory(companyId: string, employeeId: string): MemoryManager {
  return new MemoryManager(companyId, employeeId, 'employee');
}

export function getDepartmentMemory(companyId: string, departmentId: string): MemoryManager {
  return new MemoryManager(companyId, departmentId, 'department');
}