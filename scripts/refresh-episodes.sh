#!/bin/bash
# สคริปต์สำหรับรันรีเฟรชลิงก์วิดีโออัตโนมัติทุกวัน
# ตั้งค่าใน .env.local ก่อนรัน (เช่น SCRAPE_MOVIE_ID, SCRAPE_REFRESH=expired)

export $(cat .env.local | grep -v '^#' | xargs) 2>/dev/null || true

npm run scrape
