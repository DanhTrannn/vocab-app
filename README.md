# Vocab App

Web app cá nhân học từ vựng tiếng Anh theo ngày: nhập từ + từ đồng nghĩa, làm test (nhìn nghĩa → gõ từ), chấm điểm tự động, lưu lịch sử, nghe phát âm.

## Chạy toàn bộ dự án

Yêu cầu: Docker + Docker Compose.

    docker compose up -d --build

Mở http://localhost:3000

## Phát triển local

    # Terminal 1 — DB
    docker compose up -d db

    # Terminal 2 — API (cần api/.env, xem api/.env.example)
    cd api && npm install && npx prisma migrate dev && npm run dev

    # Terminal 3 — Web
    cd web && npm install && npm run dev

## Test

    cd api && npm test        # unit + integration (cần db service đang chạy)
    cd web && npm test

## Kiến trúc & spec

Xem `docs/superpowers/specs/2026-08-25-vocab-app-design.md`.
