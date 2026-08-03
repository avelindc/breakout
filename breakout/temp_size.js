const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRaw`
    SELECT
      relname AS "table_name",
      pg_size_pretty(pg_total_relation_size(C.oid)) AS "total_size"
    FROM pg_class C
    LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
    WHERE nspname NOT IN ('pg_catalog', 'information_schema')
      AND C.relkind <> 'i'
      AND nspname !~ '^pg_toast'
    ORDER BY pg_total_relation_size(C.oid) DESC
    LIMIT 20;
  `;
  console.log(result);
}
main().finally(() => prisma.$disconnect());
