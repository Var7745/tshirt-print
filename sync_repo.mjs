import fs from 'fs';
import path from 'path';

const TOKEN = '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';
const OWNER = 'Var7745';
const REPO = 'tshirt-print';
const BRANCH = 'main';
const PROJECT_DIR = 'C:/Users/goudv/.gemini/antigravity/scratch/batch-tees-platform';

async function gh(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Antigravity-Git-Sync',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API Error ${res.status} on ${endpoint}: ${errorText}`);
  }
  return res.json();
}

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    
    // Skip ignored folders & files
    if (
      relPath.startsWith('node_modules') || 
      relPath.startsWith('.next') || 
      relPath.startsWith('.git') ||
      relPath.startsWith('scratch') ||
      relPath.startsWith('data') ||
      relPath.endsWith('.tsbuildinfo') ||
      relPath.includes('.DS_Store')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

async function run() {
  console.log(`Starting sync of JK Empress / T-Shirt Print platform to ${OWNER}/${REPO} on branch ${BRANCH}...`);
  
  // 1. Get latest commit SHA on main
  const refData = await gh(`/git/ref/heads/${BRANCH}`);
  const latestCommitSha = refData.object.sha;
  console.log(`Latest commit on ${BRANCH}: ${latestCommitSha}`);

  // 2. Collect files to upload
  const files = getAllFiles(PROJECT_DIR);
  console.log(`Found ${files.length} total repository files to sync.`);

  // 3. Create blobs for each file
  const treeItems = [];
  let index = 0;
  for (const file of files) {
    index++;
    const fileBuffer = fs.readFileSync(file.fullPath);
    const base64Content = fileBuffer.toString('base64');
    
    const blobData = await gh('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: base64Content,
        encoding: 'base64'
      })
    });

    treeItems.push({
      path: file.relPath,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha
    });

    if (index % 10 === 0 || index === files.length) {
      console.log(`Uploaded ${index}/${files.length} blobs (latest: ${file.relPath})`);
    }
  }

  // 4. Create new tree
  console.log(`Creating Git Tree with ${treeItems.length} items...`);
  const treeData = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: latestCommitSha,
      tree: treeItems
    })
  });
  console.log(`Created tree: ${treeData.sha}`);

  // 5. Create commit
  console.log('Creating commit...');
  const commitData = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Initial project upload: complete source code, admin panel, secure API routes, Netlify serverless config & audit report',
      tree: treeData.sha,
      parents: [latestCommitSha]
    })
  });
  console.log(`Created commit: ${commitData.sha}`);

  // 6. Update reference on main
  console.log(`Updating ref heads/${BRANCH}...`);
  const updateRef = await gh(`/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: commitData.sha,
      force: true
    })
  });
  console.log(`Successfully updated ${BRANCH} to ${commitData.sha}!`);
  console.log(`Commit URL: https://github.com/${OWNER}/${REPO}/commit/${commitData.sha}`);
}

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
