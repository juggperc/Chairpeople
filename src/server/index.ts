import express from 'express';
import cors from 'cors';
import { streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { cronManager } from '../lib/cron/index';
import { getDb } from '../lib/db/index';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fetch from 'node-fetch';

const execPromise = promisify(exec);
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize DB and Cron
try {
  const db = getDb();
  console.log('Database initialized');
  
  const companies = db.prepare('SELECT id FROM companies').all() as { id: string }[];
  companies.forEach(company => {
    cronManager.loadJobs(company.id);
  });
  console.log('Cron manager initialized with existing jobs');
} catch (error) {
  console.error('Failed to initialize backend modules:', error);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- AI Chat Endpoint ---
app.post('/api/chat', async (req, res) => {
  const { messages, system, provider, model: modelId, apiKey, baseUrl: customBaseUrl } = req.body;
  
  console.log(`[Chat API] Request - Provider: ${provider}, Model: ${modelId}`);

  try {
    const key = apiKey;
    if (!key) {
      return res.status(401).json({ error: 'API key is required' });
    }

    let model;

    if (provider === 'opencode') {
      const id = (modelId && modelId !== 'opencode') ? modelId.toLowerCase() : 'glm-5';
      console.log(`[Chat API] Mapping opencode to ${id}`);
      
      if (id.includes('minimax')) {
        // MiniMax uses Anthropic-compatible protocol
        const anthropic = createAnthropic({
          apiKey: key,
          baseURL: 'https://opencode.ai/zen/go/v1',
        });
        model = anthropic(id);
      } else {
        // GLM and Kimi use OpenAI-compatible protocol
        const openai = createOpenAI({
          apiKey: key,
          baseURL: 'https://opencode.ai/zen/go/v1',
        });
        model = openai(id);
      }
    } else if (provider === 'openrouter') {
      const or = openrouter({ apiKey: key });
      model = or(modelId || 'anthropic/claude-3.5-sonnet');
    } else {
      // Custom / fallback
      const openai = createOpenAI({
        apiKey: key,
        baseURL: customBaseUrl || 'https://api.openai.com/v1',
      });
      model = openai(modelId);
    }

    console.log(`[Chat API] Starting stream for ${modelId}...`);

    const result = await streamText({
      model,
      system,
      messages,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let chunkCount = 0;
    for await (const textPart of result.textStream) {
      if (textPart) {
        chunkCount++;
        res.write(textPart);
      }
    }
    console.log(`[Chat API] Stream finished. Chunks: ${chunkCount}`);
    res.end();
  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({ error: error.message || 'AI request failed' });
    } else {
      res.end();
    }
  }
});

// --- Tools Execution (Sandbox) ---
app.post('/api/tools/execute', async (req, res) => {
  const { command, args = [], timeout = 30000 } = req.body;
  
  try {
    const fullCommand = `${command} ${args.join(' ')}`;
    const { stdout, stderr } = await execPromise(fullCommand, { timeout });
    
    res.json({
      success: !stderr,
      output: stdout,
      error: stderr,
      exitCode: stderr ? 1 : 0
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      output: error.stdout || '',
      error: error.message,
      exitCode: error.code || 1
    });
  }
});

// --- Web Search Endpoint ---
app.post('/api/tools/search', async (req, res) => {
  const { query } = req.body;
  // This would use a real search API like Serper or Google
  // For now, it's a placeholder returning mock results
  res.json({
    results: [
      { title: `Search result for ${query}`, snippet: `Information about ${query} found on the web.`, url: 'https://example.com' }
    ]
  });
});

// --- Skills Management ---
app.get('/api/skills/:companyId', (req, res) => {
  const db = getDb();
  const skills = db.prepare('SELECT * FROM skills WHERE company_id = ?').all(req.params.companyId);
  res.json(skills.map((s: any) => ({ ...s, tools: JSON.parse(s.tools || '[]') })));
});

app.post('/api/skills', (req, res) => {
  const { id, companyId, name, description, instructions, provider, tools, createdBy } = req.body;
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO skills (id, company_id, name, description, instructions, provider, tools, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, companyId, name, description, instructions, provider, JSON.stringify(tools || []), createdBy, now, now);
  res.json({ success: true });
});

// --- Memory Management ---
app.get('/api/memory/:companyId/:ownerId/:ownerType', (req, res) => {
  const { companyId, ownerId, ownerType } = req.params;
  const db = getDb();
  const rows = db.prepare(`
    SELECT content FROM memory 
    WHERE company_id = ? AND owner_id = ? AND owner_type = ?
    ORDER BY chunk_index ASC
  `).all(companyId, ownerId, ownerType);
  res.json(rows.map((r: any) => r.content));
});

app.post('/api/memory', (req, res) => {
  const { id, companyId, ownerId, ownerType, content, chunkIndex, totalChunks } = req.body;
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO memory (id, company_id, owner_id, owner_type, content, chunk_index, total_chunks, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, companyId, ownerId, ownerType, content, chunkIndex, totalChunks, now, now);
  res.json({ success: true });
});

// --- Cron Jobs ---
app.post('/api/cron', (req, res) => {
  const { companyId, employeeId, name, description, schedule, type, action } = req.body;
  const job = cronManager.createJob(companyId, employeeId, { name, description, schedule, type, action });
  res.json(job);
});

app.get('/api/cron/:companyId', (req, res) => {
  const db = getDb();
  const jobs = db.prepare('SELECT * FROM cron_jobs WHERE company_id = ?').all(req.params.companyId);
  res.json(jobs);
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
