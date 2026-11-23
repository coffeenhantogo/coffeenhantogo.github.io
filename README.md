# Coffee Nhẫn To Go – Website

Website bán hàng của **Coffee Nhẫn To Go** (cà phê pha phin mang đi, cà phê hạt, cà phê rang xay).
Là trang tĩnh HTML/CSS/JS, không cần máy chủ, chạy trên **GitHub Pages** tại **https://khoitran206.github.io/**.

- 351 Minh Phụng, P. Minh Phụng, TP.HCM · 26B/4 Lạc Long Quân, P. Bình Thới, TP.HCM
- Hotline/Zalo: 0909.637.168 · Email: coffeenhantogo978@gmail.com

## Các trang

| Trang | File |
|---|---|
| Trang chủ | `index.html` |
| Thực đơn đồ uống (chọn size, độ ngọt, đá) | `thuc-don.html` |
| Cà phê hạt & rang xay (lọc, tìm, sắp xếp) | `san-pham.html` |
| Chi tiết sản phẩm | `san-pham-chi-tiet.html?id=...` |
| Giỏ hàng | `gio-hang.html` |
| Đặt hàng (thanh toán) | `thanh-toan.html` |
| Đặt hàng thành công | `dat-hang-thanh-cong.html?ma=...` |
| Đơn hàng của tôi | `don-hang.html` |
| Bài viết / chi tiết bài viết | `bai-viet.html`, `bai-viet-chi-tiet.html?slug=...` |
| Về chúng tôi · Liên hệ · Chính sách | `ve-chung-toi.html`, `lien-he.html`, `chinh-sach.html` |
| Nguồn ảnh (ghi công bắt buộc) | `credits.html` |

## Đơn hàng được gửi về đâu?

Khi khách bấm **Xác nhận đặt hàng**, đơn được gửi tới **coffeenhantogo978@gmail.com** qua dịch vụ miễn phí
[FormSubmit](https://formsubmit.co). Khách cũng có nút **Gửi đơn qua Zalo**.

> **Lần đầu tiên** có đơn (hoặc lời nhắn liên hệ), FormSubmit gửi một email **“Activate Form”** tới Gmail của quán.
> Mở email đó và bấm **Activate** một lần – từ đó các đơn sau sẽ tự về hộp thư. (Kiểm tra cả mục Spam/Quảng cáo.)

Khi mở file trực tiếp trên máy (không qua web), đơn **không** gửi email – trang sẽ báo “chế độ xem thử”.

## Sửa sản phẩm, giá, bài viết

Tất cả dữ liệu nằm trong **`assets/js/data.js`**:

- `price: null` → hiển thị “Liên hệ”. Muốn hiện giá: `price: 29000` (đơn vị VND).
- Giá theo size: `priceBy: { "M": 25000, "L": 30000 }`.
- Ảnh: đặt file `.jpg` vào `assets/img/photos/`, ghi tên file (không đuôi) vào trường `img`.
- Bài viết: mảng `NHAN.ARTICLES`.

Sau khi sửa, commit & push – GitHub Pages tự cập nhật sau 1–2 phút.

## Đưa lên GitHub Pages

1. Tạo repo mới (Public) trên GitHub, ví dụ `coffee-nhan-to-go`, **không** tích tạo README.
2. Trong thư mục dự án:
   ```bash
   git remote add origin https://github.com/<tai-khoan>/coffee-nhan-to-go.git
   git push -u origin main
   ```
3. Trên GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. Sau 1–2 phút website chạy tại `https://<tai-khoan>.github.io/coffee-nhan-to-go/`.

## Ảnh

Ảnh minh họa lấy từ Wikimedia Commons theo giấy phép tự do (xem `credits.html`). Nên thay dần bằng ảnh do quán tự chụp.
