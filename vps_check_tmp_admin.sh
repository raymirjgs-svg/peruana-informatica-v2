cd /root/projects/peruana-informatica-v2
cat > /tmp/check_admin_tmp.js <<'EOF'
const mysql = require('/app/node_modules/mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [rows] = await c.query("SELECT id, email, role FROM users WHERE email='probe_tmp@peruanadeinformatica.com.pe'");
  console.log(JSON.stringify(rows));
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
EOF
docker exec -i peruana_backend node - < /tmp/check_admin_tmp.js
