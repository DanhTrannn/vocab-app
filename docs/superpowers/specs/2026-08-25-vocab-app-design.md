# Vocab App — Thiết kế ứng dụng học từ vựng tiếng Anh theo ngày

**Ngày:** 2026-08-25
**Trạng thái:** Đã duyệt thiết kế, chờ triển khai

## 1. Tổng quan

Web app cá nhân học từ vựng tiếng Anh theo ngày, không cần đăng nhập. Người dùng tạo các bộ từ vựng (tên mặc định là ngày khởi tạo), nhập từ tiếng Anh + nghĩa tiếng Việt + danh sách từ đồng nghĩa, làm bài test (app đưa ra nghĩa → người dùng gõ từ tiếng Anh và các từ đồng nghĩa), server chấm điểm và lưu lịch sử kết quả để xem lại. Hỗ trợ nghe phát âm của từ.

## 2. Yêu cầu chức năng

1. **Quản lý bộ từ theo ngày**: tạo bộ mới (tên mặc định = ngày tạo, định dạng `YYYY-MM-DD`, VD `2026-08-25`; nếu trùng tên trong ngày thì tự thêm hậu tố `(2)`, `(3)`...; được phép đổi tên sau), xoá bộ (cascade).
2. **Nhập từ thủ công**: mỗi từ gồm `english`, `meaning`, `synonyms[]`. Sửa/xoá từng từ.
3. **Làm test**: app hiển thị nghĩa tiếng Việt của từng từ (thứ tự random), người dùng gõ từ tiếng Anh + bao nhiêu synonym nhớ được (phân tách dấu phẩy). Điều kiện làm test: bộ có ít nhất 1 từ.
4. **Chấm điểm server-side** (chi tiết ở mục 7), lưu kết quả mỗi lần test kèm chi tiết đúng/sai từng từ.
5. **Xem lại kết quả**: điểm % tổng quát, bảng chi tiết từng từ, lịch sử các lần test.
6. **Phát âm**: nút 🔊 đọc từ tiếng Anh bằng Web Speech API (`speechSynthesis`, `lang: en-US`, rate 0.9). Trình duyệt không hỗ trợ → ẩn nút.

## 3. Kiến trúc & công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | React SPA — Vite + TypeScript, react-router, Tailwind CSS |
| Backend | Node.js + Express + TypeScript, Zod validate input |
| ORM | Prisma |
| Database | MySQL 8 |
| Hạ tầng | Docker Compose — 3 service |

```
vocab-app/
├── docker-compose.yml      # web (nginx, :3000) · api (:3001) · db (mysql, :3306)
├── web/                    # React SPA
├── api/
│   └── prisma/             # schema + migrations
└── docs/
```

- `api` chỉ start khi `db` healthy (`healthcheck` + `depends_on.condition`).
- Dữ liệu MySQL persist qua named volume.

## 4. Mô hình dữ liệu

```
DaySet        Word              Synonym         TestResult         WordAnswer
├─ id PK      ├─ id PK          ├─ id PK        ├─ id PK           ├─ id PK
├─ name       ├─ daySetId FK    ├─ wordId FK    ├─ daySetId FK     ├─ testResultId FK
├─ createdAt  ├─ english (unique trong cùng DaySet)
              ├─ meaning        └─ text         ├─ takenAt         ├─ wordId FK
└─ (cascade delete)                              ├─ scorePercent    ├─ mainCorrect BOOL
                                                 └─                 ├─ synonymsCorrect INT
                                                                    └─ synonymsTotal INT
```

Ràng buộc:
- `Word.english` unique trong phạm vi một `DaySet` (trùng → HTTP 409).
- Xoá `DaySet` cascade xoá Words, Synonyms, TestResults, WordAnswers.

## 5. REST API

Prefix: `/api`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/day-sets` | Danh sách bộ từ (+ số từ, điểm lần test gần nhất) |
| POST | `/day-sets` | Tạo bộ; body `{ name? }`, mặc định = hôm nay |
| PATCH | `/day-sets/:id` | Đổi tên |
| DELETE | `/day-sets/:id` | Xoá bộ (cascade) |
| POST | `/day-sets/:id/words` | Thêm từ: `{ english, meaning, synonyms[] }` |
| PUT | `/words/:id` | Sửa từ |
| DELETE | `/words/:id` | Xoá từ |
| GET | `/day-sets/:id/quiz` | Đề test: `{ wordId, meaning }[]` random, **không kèm đáp án** |
| POST | `/day-sets/:id/tests` | Nộp bài: `{ answers: [{ wordId, english, synonyms[] }] }` → server chấm, lưu, trả kết quả chi tiết |
| GET | `/day-sets/:id/results` | Lịch sử lần test của bộ |
| GET | `/results/:id` | Chi tiết 1 lần test (đúng/sai từng từ + đáp án) |

Chấm điểm và lưu kết quả chỉ diễn ra ở server — client không tự tính điểm.

## 6. Giao diện & luồng

4 màn hình (react-router):

1. **Trang chủ** — danh sách DaySet (tên, số từ, điểm gần nhất); nút "+ Tạo bộ mới" (tên điền sẵn hôm nay); hành động mỗi bộ: *Xem từ · Làm test · Kết quả*.
2. **Chi tiết ngày** — bảng từ (english | meaning | synonyms | 🔊 | sửa | xoá); form thêm từ (synonyms phân tách dấu phẩy).
3. **Làm test** — từng câu một: hiện nghĩa + nút 🔊; ô nhập từ chính; ô nhập synonyms (dấu phẩy); điều hướng Trước/Sau; progress bar; nộp bài.
4. **Kết quả** — điểm % tổng; bảng từng từ (đúng/sai từ chính, synonyms x/y, đáp án đúng); lịch sử các lần test.

## 7. Công thức chấm điểm

Với mỗi từ:
- Tổng điểm từ = 1 + `synonyms.length`
- Điểm đạt = (gõ đúng từ chính ? 1 : 0) + số synonym khớp
- So khớp: `trim()` + lowercase, mỗi synonym đếm tối đa 1 lần
- Điểm từ = đạt / tổng

Điểm bài test = trung bình cộng điểm các từ × 100% (làm tròn 1 chữ số thập phân).

Ví dụ: `happy` có 3 synonyms, gõ đúng từ chính + 2/3 synonym → (1+2)/4 = 75%.

## 8. Xử lý lỗi

- **API**: Zod → 400 kèm thông báo trường lỗi; trùng từ → 409; không tồn tại → 404; middleware lỗi tập trung trả JSON `{ error: string }`; log stderr.
- **Web**: thông báo lỗi trên form/toast; khoá nút khi đang gửi; empty state ("Chưa có từ nào — hãy thêm từ trước khi làm test"); chặn vào màn test khi bộ rỗng.

## 9. Testing

- **API** (Vitest):
  - Unit test hàm chấm điểm: case chuẩn, 0 synonym, gõ sai hết, trùng lặp synonym, hoa/thường, khoảng trắng thừa, thiếu đáp án.
  - Integration test endpoint (supertest) trên MySQL test DB riêng.
- **Web** (Vitest + React Testing Library): luồng trả lời câu hỏi, hiển thị kết quả đúng công thức.
- Smoke test thủ công: `docker compose up --build` → tạo bộ, thêm từ, làm test, xem kết quả.

## 10. Ngoài phạm vi (YAGNI)

- Đăng nhập/nhiều người dùng
- Import CSV, nhắc học spaced repetition, thống kê dài hạn
- TTS ngoài (Google Cloud TTS...) — dùng Web Speech API, thay sau nếu cần
- Mobile/desktop app
