import { v4 as uuid } from 'uuid';
import type { Skill, Connector, ProviderType } from '@/types';
import { getDb } from '@/lib/db';

export class SkillRegistry {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  create(options: {
    name: string;
    description: string;
    instructions: string;
    provider: ProviderType;
    createdBy: string;
  }): Skill {
    const id = uuid();
    const now = new Date().toISOString();

    const skill: Skill = {
      id,
      companyId: this.companyId,
      name: options.name,
      description: options.description,
      instructions: options.instructions,
      provider: options.provider,
      createdBy: options.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO skills (id, company_id, name, description, instructions, provider, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, this.companyId, options.name, options.description, options.instructions, options.provider, options.createdBy, now, now);
    } catch (error) {
      console.error('Failed to create skill:', error);
    }

    return skill;
  }

  getAll(): Skill[] {
    try {
      const db = getDb();
      return db.prepare(`
        SELECT * FROM skills WHERE company_id = ? ORDER BY created_at DESC
      `).all(this.companyId) as Skill[];
    } catch (error) {
      console.error('Failed to get skills:', error);
      return [];
    }
  }

  getById(id: string): Skill | null {
    try {
      const db = getDb();
      const row = db.prepare('SELECT * FROM skills WHERE id = ? AND company_id = ?').get(id, this.companyId) as Skill | undefined;
      return row || null;
    } catch (error) {
      console.error('Failed to get skill:', error);
      return null;
    }
  }

  getByCreator(employeeId: string): Skill[] {
    try {
      const db = getDb();
      return db.prepare(`
        SELECT * FROM skills WHERE company_id = ? AND created_by = ? ORDER BY created_at DESC
      `).all(this.companyId, employeeId) as Skill[];
    } catch (error) {
      console.error('Failed to get skills by creator:', error);
      return [];
    }
  }

  update(id: string, updates: Partial<Omit<Skill, 'id' | 'companyId' | 'createdAt'>>): boolean {
    try {
      const db = getDb();
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
      if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
      if (updates.instructions !== undefined) { fields.push('instructions = ?'); values.push(updates.instructions); }
      if (updates.provider !== undefined) { fields.push('provider = ?'); values.push(updates.provider); }

      if (fields.length === 0) return false;

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id, this.companyId);

      const result = db.prepare(`
        UPDATE skills SET ${fields.join(', ')} WHERE id = ? AND company_id = ?
      `).run(...values);

      return result.changes > 0;
    } catch (error) {
      console.error('Failed to update skill:', error);
      return false;
    }
  }

  delete(id: string): boolean {
    try {
      const db = getDb();
      const result = db.prepare('DELETE FROM skills WHERE id = ? AND company_id = ?').run(id, this.companyId);
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to delete skill:', error);
      return false;
    }
  }
}

export class ConnectorRegistry {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  create(options: {
    name: string;
    type: string;
    config: Record<string, string>;
  }): Connector {
    const id = uuid();
    const now = new Date().toISOString();

    const connector: Connector = {
      id,
      companyId: this.companyId,
      name: options.name,
      type: options.type,
      config: options.config,
      enabled: true,
      createdAt: now,
    };

    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO connectors (id, company_id, name, type, config, enabled, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, this.companyId, options.name, options.type, JSON.stringify(options.config), 1, now);
    } catch (error) {
      console.error('Failed to create connector:', error);
    }

    return connector;
  }

  getAll(): Connector[] {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT * FROM connectors WHERE company_id = ? ORDER BY created_at DESC
      `).all(this.companyId) as Array<Connector & { config: string }>;
      
      return rows.map(row => ({
        ...row,
        config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
      }));
    } catch (error) {
      console.error('Failed to get connectors:', error);
      return [];
    }
  }

  getById(id: string): Connector | null {
    try {
      const db = getDb();
      const row = db.prepare('SELECT * FROM connectors WHERE id = ? AND company_id = ?').get(id, this.companyId) as (Connector & { config: string }) | undefined;
      if (!row) return null;
      return {
        ...row,
        config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
      };
    } catch (error) {
      console.error('Failed to get connector:', error);
      return null;
    }
  }

  getByType(type: string): Connector[] {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT * FROM connectors WHERE company_id = ? AND type = ? AND enabled = 1
      `).all(this.companyId, type) as Array<Connector & { config: string }>;
      
      return rows.map(row => ({
        ...row,
        config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
      }));
    } catch (error) {
      console.error('Failed to get connectors by type:', error);
      return [];
    }
  }

  update(id: string, updates: Partial<Omit<Connector, 'id' | 'companyId' | 'createdAt'>>): boolean {
    try {
      const db = getDb();
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
      if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
      if (updates.config !== undefined) { fields.push('config = ?'); values.push(JSON.stringify(updates.config)); }
      if (updates.enabled !== undefined) { fields.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }

      if (fields.length === 0) return false;

      values.push(id, this.companyId);

      const result = db.prepare(`
        UPDATE connectors SET ${fields.join(', ')} WHERE id = ? AND company_id = ?
      `).run(...values);

      return result.changes > 0;
    } catch (error) {
      console.error('Failed to update connector:', error);
      return false;
    }
  }

  delete(id: string): boolean {
    try {
      const db = getDb();
      const result = db.prepare('DELETE FROM connectors WHERE id = ? AND company_id = ?').run(id, this.companyId);
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to delete connector:', error);
      return false;
    }
  }

  enable(id: string): boolean {
    return this.update(id, { enabled: true });
  }

  disable(id: string): boolean {
    return this.update(id, { enabled: false });
  }
}

export function getSkillRegistry(companyId: string): SkillRegistry {
  return new SkillRegistry(companyId);
}

export function getConnectorRegistry(companyId: string): ConnectorRegistry {
  return new ConnectorRegistry(companyId);
}