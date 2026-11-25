cd /root/projects/peruana-informatica-v2
cat > /tmp/describe_users.js <<'EOF'
const mysql = require('/app/node_modules/mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [cols] = await c.query('SHOW COLUMNS FROM users');
  console.log(cols.map(x => x.Field).join(','));
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
EOF
docker exec -i peruana_backend node - < /tmp/describe_users.js
