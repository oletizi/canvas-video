import type { APIRoute } from 'astro';
import { ConfigStorage } from '@/lib/config-storage';
import { StorageError } from '@/lib/storage';

const storage = new ConfigStorage();

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const action = searchParams.get('action');
    
    if (action === 'list') {
      // List all backups
      const backups = await storage.listConfigBackups();
      return new Response(JSON.stringify({ backups }), {
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
    console.error('Backup API Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
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

    const { action, backupName, backupFilename, overwrite } = body;
    
    if (action === 'create') {
      // Create new backup
      const filename = await storage.createConfigBackup(backupName);
      
      return new Response(JSON.stringify({ 
        success: true, 
        filename 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } else if (action === 'restore') {
      if (!backupFilename) {
        return new Response(JSON.stringify({ error: 'Missing backup filename' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Restore from backup
      const result = await storage.restoreConfigBackup(backupFilename, overwrite || false);
      
      return new Response(JSON.stringify(result), {
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
    console.error('Backup API Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process backup request' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const backupFilename = searchParams.get('filename');
    
    if (!backupFilename) {
      return new Response(JSON.stringify({ error: 'Missing backup filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await storage.deleteConfigBackup(backupFilename);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Delete Backup Error:', error);
    const status = error instanceof StorageError && error.code === 'ITEM_NOT_FOUND' ? 404 : 500;
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to delete backup' 
    }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};