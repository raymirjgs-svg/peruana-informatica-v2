cd /root/projects/peruana-informatica-v2
cat > /tmp/del_tmp_admin.js <<'EOF'
const mysql = require('/app/node_modules/mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [r] = await c.query("DELETE FROM users WHERE email='probe_tmp@peruanadeinformatica.com.pe'");
  console.log('borrados:', r.affectedRows);
  const [chk] = await c.query("SELECT COUNT(*) n FROM users WHERE email='probe_tmp@peruanadeinformatica.com.pe'");
  console.log('restantes:', chk[0].n);
  const [admins] = await c.query("SELECT email, role FROM users WHERE role IN ('admin','super-admin')");
  console.log('admins reales:', JSON.stringify(admins));
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
EOF
docker exec -i peruana_backend node - < /tmp/del_tmp_admin.js

echo "=== ERRORES 5xx EN LOGS (ultimos 5 min) ==="
docker logs --since 10m peruana_frontend 2>&1 | grep -iE "error|unhandled|failed" | head -10 || echo "sin errores en frontend"
docker logs --since 10m peruana_backend 2>&1 | grep -E " 5[0-9][0-9] " | head -10 || echo "sin 5xx en backend"

echo "=== ESTADO FINAL ==="
docker ps --filter name=peruana_ --format '{{.Names}} | {{.Status}}'
