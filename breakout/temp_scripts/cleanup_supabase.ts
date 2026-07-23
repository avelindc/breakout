import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function emptyBucket(bucketName: string) {
  console.log(`\n--- Emptying bucket: ${bucketName} ---`);
  
  // Recursively list and delete all files in the bucket
  let hasMore = true;
  let totalDeleted = 0;
  
  while (hasMore) {
    const { data: files, error } = await supabase.storage.from(bucketName).list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) {
      console.error(`Error listing files in ${bucketName}:`, error.message);
      break;
    }

    if (!files || files.length === 0) {
      console.log(`Bucket ${bucketName} is already empty.`);
      hasMore = false;
      break;
    }
    
    // We only want to delete actual files, but if there are folders, we need to list inside them.
    // For simplicity of a one-time script, we assume a shallow structure or we can recursively delete.
    // To properly delete everything, we must traverse folders.
    for (const file of files) {
      if (file.id === null) {
        // It's a folder, we need to list inside
        await deleteFolder(bucketName, file.name);
      } else {
        // It's a file
        const { error: delError } = await supabase.storage.from(bucketName).remove([file.name]);
        if (delError) {
          console.error(`Failed to delete ${file.name}:`, delError.message);
        } else {
          console.log(`Deleted ${file.name}`);
          totalDeleted++;
        }
      }
    }
    
    // Check if we need to continue (since we are deleting, the offset can stay 0)
    // If the list returned fewer than 100, we're likely done.
    if (files.length < 100) {
      hasMore = false;
    }
  }
  
  console.log(`Total deleted from ${bucketName}: ${totalDeleted} files.`);
}

async function deleteFolder(bucketName: string, folderPath: string) {
  const { data: files, error } = await supabase.storage.from(bucketName).list(folderPath, { limit: 1000 });
  if (error) {
    console.error(`Error listing folder ${folderPath}:`, error.message);
    return;
  }
  
  if (!files || files.length === 0) return;
  
  const filesToRemove = files.map(f => `${folderPath}/${f.name}`);
  
  const { error: delError } = await supabase.storage.from(bucketName).remove(filesToRemove);
  if (delError) {
    console.error(`Failed to delete folder contents of ${folderPath}:`, delError.message);
  } else {
    console.log(`Deleted ${filesToRemove.length} files from folder ${folderPath}`);
  }
}

async function main() {
  console.log("WARNING: THIS WILL DELETE ALL FILES FROM SUPABASE STORAGE.");
  console.log("Only run this if you have verified the migration to R2 is 100% successful.");
  console.log("Press Ctrl+C within 5 seconds to abort...");
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log("Starting cleanup...");
  
  await emptyBucket("assets");
  await emptyBucket("profiles");
  await emptyBucket("releases");
  
  console.log("\nCleanup Finished!");
}

main().catch(console.error);
