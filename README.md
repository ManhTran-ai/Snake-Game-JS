# 8-BIT SNAKE — Rắn Săn Mồi

Game Rắn Săn Mồi phiên bản 8-bit, viết bằng **Vanilla JavaScript** + **CSS Grid + DOM** — không dùng Canvas, không dùng ảnh, không thư viện ngoài, không cần build.

> **Cách chạy:** bấm đúp vào file `index.html`. Game mở ngay trên trình duyệt — không cần server, không cần mạng.

## Cấu trúc

```
.
├── index.html   # Markup + toàn bộ CSS inline trong <style>
└── game.js      # Toàn bộ game (1 518 dòng) dạng classic script
```

`game.js` là classic script (không phải ES module) vì trình duyệt áp CORS cho `type="module"` và sẽ chặn khi mở bằng giao thức `file://`.

## Tính năng

- Bàn chơi 20×20 = 400 ô `<div>` render bằng CSS Grid, responsive.
- Nhịp di chuyển cố định bằng `requestAnimationFrame` + accumulator, không drift theo tần số quét.
- Chống lỗi quay đầu 180° bằng hàng đợi lệnh + cờ `isProcessingInput`.
- Kỷ lục lưu trong `localStorage`.
- Điều khiển bàn phím, hỗ trợ cả WASD và bàn phím ảo cho cảm ứng.
- 6 màn chơi với cơ chế riêng, tăng dần độ khó.
- UI retro tối giản: Times New Roman, đen/trắng/be, không gradient, không animation.

## 6 màn chơi

| Màn | Tên | Cơ chế |
|---|---|---|
| 1 | Classic Grassland | Đi xuyên biên (wrap-around), không tường |
| 2 | Brick Dungeon | 5 cụm gạch cố định chắn đường |
| 3 | Portal & Mystery Fruit | 3 cặp cổng dịch chuyển + mồi biến thể |
| 4 | Haunted Patrol | 3 ma tuần tra + sương mù bán kính 4 ô |
| 5 | Shrinking Matrix | Sân co lại mỗi 20 nhịp + mồi tự nhảy + tăng tốc theo điểm |
| 6 | Shadow Hunt | 2 ma chủ động đuổi, rắn có 3 máu, sân co nhanh |

## Điểm thưởng

| Loại mồi | Điểm | Hiệu ứng |
|---|---|---|
| Mồi thường | +10 | Rắn dài thêm 1 ô |
| Mồi tăng tốc | +20 | Tốc độ ×2 trong 5 giây |
| Mồi đảo chiều | +25 | Đảo ngược phím điều khiển trong 5 giây |

## Điều khiển

| Phím | Hành động |
|---|---|
| ↑ ↓ ← → / WASD | Di chuyển rắn |
| Space | Bắt đầu / Tạm dừng / Chơi lại |
| P | Tạm dừng |
| R | Chơi lại màn hiện tại |
| ESC | Về menu chọn màn |

## Thuật toán chính

| Thuật toán | Mô tả |
|---|---|
| Game loop | `requestAnimationFrame` + accumulator, nhịp đi ổn định |
| Chống quay đầu | Hàng đợi hướng đi + chỉ nhận lệnh mới khi lệnh cũ xử lý xong |
| AI tuần tra | Ma đi thẳng ngang/dọc, đảo chiều khi chạm biên |
| AI truy đuổi | Mỗi nhịp chọn ô lân cận có khoảng cách Manhattan nhỏ nhất về đầu rắn |
| Sương mù | Tính tập ô trong bán kính quanh đầu rắn, phủ tối phần còn lại |
| Sân co lại | Mỗi N nhịp thu 1 ô mỗi cạnh, dừng ở kích thước tối thiểu |

## Tác giả

[ManhTran-ai](https://github.com/ManhTran-ai)
