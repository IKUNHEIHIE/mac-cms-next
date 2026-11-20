@echo off
setlocal
cd /d %~dp0..
call npm install
call npx prisma db push
call npx prisma db seed
echo [DONE] Setup complete. Run: npm run dev
endlocal
