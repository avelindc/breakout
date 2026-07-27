const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucketSize(bucketName) {
  let totalBytes = 0;
  let fileCount = 0;
  
  async function listAllFiles(path = '') {
    const { data, error } = await supabase.storage.from(bucketName).list(path, { limit: 1000 });
    if (error) {
      console.error(`Error listing ${bucketName}/${path}:`, error.message);
      return;
    }
    
    for (const item of data) {
      if (item.id === null) {
        // It's a folder
        await listAllFiles(path ? `${path}/${item.name}` : item.name);
      } else {
        // It's a file
        totalBytes += item.metadata.size;
        fileCount++;
      }
    }
  }

  await listAllFiles();
  const mb = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`Bucket '${bucketName}': ${fileCount} files, Total size: ${mb} MB`);
  return totalBytes;
}

async function main() {
  const buckets = ['releases', 'assets', 'profiles', 'catalogs', 'contracts', 'messages'];
  let total = 0;
  for (const b of buckets) {
    total += await checkBucketSize(b);
  }
  console.log(`\nGRAND TOTAL: ${(total / (1024 * 1024)).toFixed(2)} MB`);
}

main();
