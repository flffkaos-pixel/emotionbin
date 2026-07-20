import { writeFileSync } from 'fs';

// ===== CONFIG =====
const FB_API_KEY = 'AIzaSyB4hIzZJ_CmISg7za95mFXIyWxPjPzo0ig';
const FB_PROJECT_ID = 'emotionbin-2bafe';
const SB_URL = 'https://ufvqbjduffflcijtrkkn.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdnFiamR1ZmZmbGNpanRya2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNjM5NDcsImV4cCI6MjA5ODczOTk0N30.Yp2R_4HWxZiDcyHD91Bd03kf6S92qhLkwnw-B6FzkNc';
// =================

// Firestore Value -> plain JS
function firestoreValue(v) {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.doubleValue !== undefined) return Number(v.doubleValue);
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(firestoreValue);
  if (v.mapValue) return firestoreFields(v.mapValue.fields);
  return null;
}

function firestoreFields(fields) {
  const obj = {};
  for (const [key, val] of Object.entries(fields || {})) {
    obj[key] = firestoreValue(val);
  }
  return obj;
}

async function loadAllFirestoreDocs() {
  const docs = [];
  let pageToken = '';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT_ID}/databases/(default)/documents/publicPosts?pageSize=500&key=${FB_API_KEY}`;

  do {
    const url = baseUrl + (pageToken ? `&pageToken=${pageToken}` : '');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firestore API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    for (const doc of (data.documents || [])) {
      docs.push(firestoreFields(doc.fields));
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return docs;
}

async function insertToSupabase(docs) {
  let inserted = 0, errors = 0;
  for (const doc of docs) {
    const payload = {
      id: doc.id,
      content: doc.content || '',
      tags: doc.tags || [],
      weightBefore: doc.weightBefore || 30,
      weightAfter: doc.weightAfter || 5,
      weightDiff: doc.weightDiff || 25,
      timestamp: doc.timestamp || Date.now(),
      privacy: doc.privacy || 'public',
      trashType: doc.trashType || '캔',
      reactions: doc.reactions || {},
      comments: doc.comments || [],
    };

    const res = await fetch(`${SB_URL}/rest/v1/public_posts`, {
      method: 'POST',
      headers: {
        'apikey': SB_ANON_KEY,
        'Authorization': `Bearer ${SB_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 409) {
      inserted++;
    } else {
      const text = await res.text();
      console.error(`[ERR ${doc.id}] ${res.status}: ${text.slice(0, 200)}`);
      errors++;
    }
  }
  return { inserted, errors };
}

async function main() {
  console.log('Loading from Firebase Firestore...');
  const docs = await loadAllFirestoreDocs();
  console.log(`Found ${docs.length} documents`);

  if (docs.length === 0) {
    console.log('No data to migrate.');
    return;
  }

  console.log(`Inserting ${docs.length} documents into Supabase...`);
  const { inserted, errors } = await insertToSupabase(docs);
  console.log(`Done! Inserted: ${inserted}, Errors: ${errors}`);

  writeFileSync('migrated-data.json', JSON.stringify(docs, null, 2));
  console.log(`Backup saved to migrated-data.json`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
