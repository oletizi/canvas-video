import type { APIRoute } from 'astro';
import { ConfigStorage } from '@/lib/config-storage';
import { StorageError } from '@/lib/storage';

const storage = new ConfigStorage();

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const filename = searchParams.get('filename');
    const action = searchParams.get('action');
    
    if (filename) {
      // Get specific config
      try {
        const config = await storage.loadConfig(filename);
        return new Response(JSON.stringify(config), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        const status = error instanceof StorageError && error.code === 'ITEM_NOT_FOUND' ? 404 : 500;
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }), {
          status,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } else if (action === 'info') {
      // Get storage info
      const info = await storage.getConfigStorageInfo();
      return new Response(JSON.stringify(info), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else if (action === 'export') {
      // Export all configs
      const exportData = await storage.exportAllConfigs();
      return new Response(exportData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="pixel-configs-export.json"'
        },
      });
    } else {
      // List all configs with metadata
      const configs = await storage.listConfigs();
      return new Response(JSON.stringify({ configs }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if request has content
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = await request.text();
    if (!text.trim()) {
      return new Response(JSON.stringify({ error: 'Request body is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { action, config, filename, data, overwrite } = body;
    
    if (action === 'save') {
      if (!config) {
        return new Response(JSON.stringify({ error: 'Missing config data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      await storage.saveConfig(config);
      
      return new Response(JSON.stringify({ 
        success: true, 
        filename: storage['sanitizeConfigName'](config.name) 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } else if (action === 'import') {
      if (!data) {
        return new Response(JSON.stringify({ error: 'Missing import data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const result = await storage.importAllConfigs(data, overwrite || false);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } else if (action === 'duplicate') {
      if (!filename || !data?.newName) {
        return new Response(JSON.stringify({ error: 'Missing filename or new name' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const newFilename = await storage.duplicateConfig(filename, data.newName);
      
      return new Response(JSON.stringify({ 
        success: true, 
        newFilename 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } else if (action === 'rename') {
      if (!filename || !data?.newName) {
        return new Response(JSON.stringify({ error: 'Missing filename or new name' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const newFilename = await storage.renameConfig(filename, data.newName);
      
      return new Response(JSON.stringify({ 
        success: true, 
        newFilename 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return new Response(JSON.stringify({ error: 'Missing filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await storage.delete(filename);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Delete Error:', error);
    const status = error instanceof StorageError && error.code === 'ITEM_NOT_FOUND' ? 404 : 500;
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to delete configuration' 
    }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};