// api/modules.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage (use Vercel KV or database in production)
const moduleStates = new Map<string, any>();

// Initialize with default modules
const defaultModules = [
  // Combat
  { name: 'Aura', category: 'Combat', enabled: false, settings: [] },
  { name: 'AimAssist', category: 'Combat', enabled: false, settings: [] },
  { name: 'TriggerBot', category: 'Combat', enabled: false, settings: [] },
  { name: 'Velocity', category: 'Combat', enabled: false, settings: [] },
  { name: 'NoMiss', category: 'Combat', enabled: false, settings: [] },
  { name: 'wTap', category: 'Combat', enabled: false, settings: [] },
  { name: 'NoKbJump', category: 'Combat', enabled: false, settings: [] },
  { name: 'Reach', category: 'Combat', enabled: false, settings: [] },
  { name: 'CrystalAura', category: 'Combat', enabled: false, settings: [] },
  { name: 'BackTrack', category: 'Combat', enabled: false, settings: [] },
  { name: 'AutoTotem', category: 'Combat', enabled: false, settings: [] },
  { name: 'AutoAncor', category: 'Combat', enabled: false, settings: [] },
  
  // Movement
  { name: 'Flight', category: 'Movement', enabled: false, settings: [] },
  { name: 'Sprint', category: 'Movement', enabled: false, settings: [] },
  
  // Player
  { name: 'Scaffold', category: 'Player', enabled: false, settings: [] },
  { name: 'FastUse', category: 'Player', enabled: false, settings: [] },
  { name: 'NoFall', category: 'Player', enabled: false, settings: [] },
  
  // Misc
  { name: 'AutoGG', category: 'Misc', enabled: false, settings: [] },
  { name: 'CivBreak', category: 'Misc', enabled: false, settings: [] },
  { name: 'Panic', category: 'Misc', enabled: false, settings: [] },
  { name: 'Rocket', category: 'Misc', enabled: false, settings: [] },
  { name: 'Teams', category: 'Misc', enabled: false, settings: [] },
  { name: 'TestModuul', category: 'Misc', enabled: false, settings: [] },
  
  // Visual
  { name: 'GUI', category: 'Visual', enabled: false, settings: [] },
  { name: 'HUD', category: 'Visual', enabled: true, settings: [] },
  { name: 'ESP', category: 'Visual', enabled: false, settings: [] },
  { name: 'Particles', category: 'Visual', enabled: false, settings: [] },
  { name: 'TargetHUD', category: 'Visual', enabled: false, settings: [] },
  { name: 'Interface', category: 'Visual', enabled: false, settings: [] },
];

// Initialize default modules
defaultModules.forEach(mod => {
  moduleStates.set(mod.name.toLowerCase(), mod);
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET single module state
  if (req.method === 'GET' && req.query.module) {
    const moduleName = (req.query.module as string).toLowerCase();
    const module = moduleStates.get(moduleName);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    return res.status(200).json({
      module: module.name,
      enabled: module.enabled,
      category: module.category,
      settings: module.settings,
      timestamp: Date.now()
    });
  }

  // GET all modules (for list endpoint)
  if (req.method === 'GET') {
    const modules = Array.from(moduleStates.values());
    return res.status(200).json({
      modules,
      timestamp: Date.now()
    });
  }

  // POST toggle module
  if (req.method === 'POST') {
    const { module: moduleName, enabled, settings } = req.body;

    if (!moduleName) {
      return res.status(400).json({ error: 'Module name required' });
    }

    const module = moduleStates.get(moduleName.toLowerCase());
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Update state
    if (typeof enabled === 'boolean') {
      module.enabled = enabled;
    }
    
    if (settings) {
      module.settings = settings;
    }

    moduleStates.set(moduleName.toLowerCase(), module);

    return res.status(200).json({
      module: module.name,
      enabled: module.enabled,
      category: module.category,
      settings: module.settings,
      message: `Module ${module.name} ${module.enabled ? 'enabled' : 'disabled'}`,
      timestamp: Date.now()
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// api/modules/list.ts
export async function listHandler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const modules = Array.from(moduleStates.values());
  return res.status(200).json({
    modules,
    timestamp: Date.now()
  });
}

// api/modules/sync.ts - Receive module list from Java client
export async function syncHandler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { modules } = req.body;
  
  if (!modules || !Array.isArray(modules)) {
    return res.status(400).json({ error: 'Invalid modules array' });
  }

  // Update module states with Java client data
  modules.forEach(mod => {
    const existing = moduleStates.get(mod.name.toLowerCase());
    if (existing) {
      // Preserve enabled state, update everything else
      moduleStates.set(mod.name.toLowerCase(), {
        ...mod,
        enabled: existing.enabled // Keep current toggle state
      });
    } else {
      moduleStates.set(mod.name.toLowerCase(), mod);
    }
  });

  return res.status(200).json({
    message: 'Modules synced',
    count: modules.length,
    timestamp: Date.now()
  });
}
