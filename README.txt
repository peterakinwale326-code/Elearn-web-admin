1. Run sql/admin-migration.sql in phpMyAdmin.
2. npm install mysql2
3. Copy lib/ and app/ into the matching folders of elearn-web (merge, do not replace).
4. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env.local.
5. In lib/admin.js, point the getCurrentUser import at your existing session code.
6. Open /admin while signed in as an admin.
