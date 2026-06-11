import { getStore } from '@netlify/blobs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_KEY = 'site-config';

function getDefaultConfig() {
  const path = join(__dirname, '../../data/default-config.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

function getAuthToken(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function verifyToken(token) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  return token === Buffer.from(`${secret}:adam-admin`).toString('base64');
}

async function readConfig() {
  try {
    const store = getStore('adam-services');
    const stored = await store.get(CONFIG_KEY, { type: 'json' });
    if (stored) return stored;
  } catch (_) {
    /* Netlify Blobs unavailable locally */
  }
  return getDefaultConfig();
}

async function writeConfig(config) {
  const store = getStore('adam-services');
  await store.setJSON(CONFIG_KEY, config);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      const config = await readConfig();
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      };
    }

    if (event.httpMethod === 'PUT') {
      const token = getAuthToken(event);
      if (!verifyToken(token)) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized' }),
        };
      }

      const config = JSON.parse(event.body);
      await writeConfig(config);

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    }

    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Server error' }),
    };
  }
};
