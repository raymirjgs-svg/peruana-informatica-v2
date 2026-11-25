cd /root/projects/peruana-informatica-v2
cat > /tmp/mk_tmp_admin.js <<'EOF'
const bcrypt = require('/app/node_modules/bcryptjs');
const mysql = require('/app/node_modules/mysql2/promise');
(async () => {
  const email = 'probe_tmp@peruanadeinformatica.com.pe';
  const pass = 'ProbeTmp!2026';
  const hash = await bcrypt.hash(pass, 10);
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await c.query("DELETE FROM users WHERE email=?", [email]);
  const [r] = await c.query(
    "INSERT INTO users (email, password_hash, first_name, last_name, role, auth_provider, is_blocked, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,NOW(),NOW())",
    [email, hash, 'Probe', 'Tmp', 'admin', 'local', 0]
  );
  console.log('admin temp creado id=', r.insertId, email);
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
EOF
docker exec -i peruana_backend node - < /tmp/mk_tmp_admin.js
