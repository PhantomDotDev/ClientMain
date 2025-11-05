// api/modules.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// In production, use a proper database (Vercel KV, Supabase, etc.)
// This is a simple in-memory store for demonstration
const moduleStates = new Map<string, boolean>();

// Initialize default states
moduleStates.set('autoSprint', false);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers for web UI access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { module } = req.query;

  // GET: Check module state
  if (req.method === 'GET') {
    if (!module || typeof module !== 'string') {
      return res.status(400).json({ error: 'Module name required' });
    }

    const enabled = moduleStates.get(module) || false;
    return res.status(200).json({ 
      module, 
      enabled,
      timestamp: Date.now()
    });
  }

  // POST: Toggle module state
  if (req.method === 'POST') {
    const { module: moduleName, enabled } = req.body;

    if (!moduleName || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    moduleStates.set(moduleName, enabled);
    
    return res.status(200).json({ 
      module: moduleName, 
      enabled,
      message: `Module ${moduleName} ${enabled ? 'enabled' : 'disabled'}`,
      timestamp: Date.now()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// api/modules/list.ts - Get all module states
export async function listHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const modules = Array.from(moduleStates.entries()).map(([name, enabled]) => ({
    name,
    enabled
  }));

  return res.status(200).json({ 
    modules,
    timestamp: Date.now()
  });
}
