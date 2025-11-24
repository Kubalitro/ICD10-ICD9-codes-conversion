
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const content = `DATABASE_URL=postgresql://neondb_owner:npg_2juX6QvRKyYI@ep-bold-wildflower-agz5aubj.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dO8AD8R+PoHL3l/4hRC0JJCvpFLvZ46LGJM0d6F7W2k=
NODE_ENV=development`;

fs.writeFileSync(envPath, content);
console.log('Fixed .env.local');
