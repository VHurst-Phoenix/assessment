import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_DB_USER = process.env.SUPABASE_DB_USER;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_DB_PASSWORD || !SUPABASE_DB_USER || !SUPABASE_PROJECT_REF) {
  throw new Error('Set SUPABASE_DB_PASSWORD, SUPABASE_DB_USER, and SUPABASE_PROJECT_REF before running this script.');
}

const regions = [
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ca-central-1',
  'sa-east-1'
];

async function checkRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const cmd = `PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql -h ${host} -p 6543 -U ${SUPABASE_DB_USER} -d postgres -c "SELECT 1;" -t`;
  
  try {
    const { stdout } = await execAsync(cmd, { timeout: 3000 });
    return { region, success: true, output: stdout.trim() };
  } catch (err) {
    return { region, success: false, error: err.message };
  }
}

async function main() {
  console.log(`Scanning regional Supabase poolers for tenant ${SUPABASE_PROJECT_REF}...\n`);
  const results = await Promise.all(regions.map(r => checkRegion(r)));
  
  for (const res of results) {
    if (res.success) {
      console.log(`[+] SUCCESS in region: ${res.region}! Output: ${res.output}`);
    } else {
      console.log(`[-] Region ${res.region}: Error: ${res.error.replace(/\n/g, ' ')}`);
    }
  }
  console.log('\nScan complete.');
}

main();
