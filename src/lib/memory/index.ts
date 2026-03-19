import { v4 as uuid } from 'uuid';
import type { Memory } from '@/types';
import { useSettingsStore } from '@/stores/settings';
import { getDb } from '@/lib/db';

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 50;

export interface MemoryChunk {
  id: string;
  content: string;
  timestamp: string;
}

export class MemoryManager {
  private companyId: string;
  private ownerId: string;
  private ownerType: Memory['ownerType'];
  private chunks: MemoryChunk[] = [];

  constructor(companyId: string, ownerId: string, ownerType: Memory['ownerType']) {
    this.companyId = companyId;
    this.ownerId = ownerId;
    this.ownerType = ownerType;
    this.loadChunks();
  }

  private loadChunks(): void {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT id, content, created_at as timestamp 
        FROM memory 
        WHERE company_id = ? AND owner_id = ? AND owner_type = ?
        ORDER BY chunk_index ASC
      `).all(this.companyId, this.ownerId, this.ownerType) as Array<{ id: string; content: string; timestamp: string }>;
      
      this.chunks = rows.map(row => ({
        id: row.id,
        content: row.content,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error('Failed to load memory chunks:', error);
      this.chunks = [];
    }
  }

  private saveChunk(content: string): MemoryChunk {
    const id = uuid();
    const timestamp = new Date().toISOString();
    
    try {
      const db = getDb();
      const chunkCount = this.chunks.length;
      db.prepare(`
        INSERT INTO memory (id, company_id, owner_id, owner_type, content, chunk_index, total_chunks, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, this.companyId, this.ownerId, this.ownerType, content, chunkCount, chunkCount + 1, timestamp, timestamp);
    } catch (error) {
      console.error('Failed to save memory chunk:', error);
    }

    return { id, content, timestamp };
  }

  add(content: string): void {
    const { chunkSize, chunkOverlap } = useSettingsStore.getState().webSearch;
    const size = chunkSize || DEFAULT_CHUNK_SIZE;
    const overlap = chunkOverlap || DEFAULT_CHUNK_OVERLAP;
    
    if (content.length <= size) {
      this.chunks.push(this.saveChunk(content));
      return;
    }

    const textChunks = this.chunkText(content, size, overlap);
    for (const chunk of textChunks) {
      this.chunks.push(this.saveChunk(chunk));
    }
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      if (end > text.length) {
        end = text.length;
      } else {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize / 2) {
          end = lastSpace;
        }
      }
      
      chunks.push(text.slice(start, end));
      start = end - overlap;
      if (start < 0) start = 0;
    }
    
    return chunks;
  }

  retrieve(query: string, limit = 5): string[] {
    const queryLower = query.toLowerCase();
    const scored = this.chunks.map(chunk => {
      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      
      const queryWords = queryLower.split(/\s+/);
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 1;
          const regex = new RegExp(word, 'gi');
          const matches = contentLower.match(regex);
          score += (matches?.length || 0) * 0.5;
        }
      }
      
      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.chunk.content);
  }

  getAll(): string[] {
    return this.chunks.map(c => c.content);
  }

  clear(): void {
    try {
      const db = getDb();
      db.prepare(`
        DELETE FROM memory 
        WHERE company_id = ? AND owner_id = ? AND owner_type = ?
      `).run(this.companyId, this.ownerId, this.ownerType);
      this.chunks = [];
    } catch (error) {
      console.error('Failed to clear memory:', error);
    }
  }

  size(): number {
    return this.chunks.length;
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