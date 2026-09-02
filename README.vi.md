# windoctor

**Claude Code hoặc Codex CLI không chạy trên Windows 11? Cài xong mà `claude` hay `codex` báo "is not recognized", hook chết im lặng, gõ tiếng Việt mất chữ?**

`windoctor` trả lời trong 10 giây. Một lệnh, không phụ thuộc, không cài gì, không sửa gì.

```powershell
npx windoctor
```

Chưa lấy được từ npm? Chạy thẳng từ GitHub:

```powershell
npx github:ShenJun93/windoctor
```

## Nó giải thích những lỗi nào

| Lỗi bạn thấy | Nguyên nhân windoctor kiểm tra |
|---|---|
| `'claude' is not recognized as an internal or external command` (cmd) | thư mục bin của npm chưa có trong PATH |
| `claude : The term 'claude' is not recognized as the name of a cmdlet` (PowerShell) | bộ cài native đặt `claude.exe` ở `%USERPROFILE%\.local\bin` nhưng PATH chưa có |
| `'codex' is not recognized` / cài `npm i -g codex` mà không chạy | gói đúng là `@openai/codex` |
| `python3: command not found` trong hook | Windows không có `python3`, hoặc có `python3.exe` giả của Microsoft Store |
| `claude.ps1 cannot be loaded because running scripts is disabled` | execution policy của PowerShell |
| Tiếng Việt, emoji thành `?`; `UnicodeEncodeError` | code page console không phải UTF-8; thiếu `PYTHONUTF8=1` |
| `ENAMETOOLONG` / `Filename too long` khi `npm install` | chưa bật long paths |
| Nháy màn hình, nhảy cuộn, trùng ký tự khi gõ tiếng Việt | đang dùng conhost cũ thay vì Windows Terminal |
| Hook không bao giờ chạy, không báo lỗi | đường dẫn Windows có dấu `\` trong lệnh hook (Git Bash nuốt mất) |
| Codex trong WSL ghi cấu hình sang ổ Windows | `CODEX_HOME` trỏ sang đường dẫn Windows |

Mã thoát: `0` ổn, `1` có cảnh báo, `2` có lỗi. Thêm `--json` để lấy kết quả máy đọc được.

## Dùng ngay trong Claude Code / Codex

```bash
npx skills add ShenJun93/windoctor
```

Sau đó chỉ cần mô tả lỗi cho agent; agent tự chạy chẩn đoán và đưa lệnh sửa.

## Quyền riêng tư
Không telemetry, không gọi mạng, không ghi file. Công cụ chỉ đọc; mọi lệnh sửa được in ra để bạn tự chạy.

## Bài viết chi tiết (tiếng Việt)
- [Sáu lỗi ai cũng gặp khi cài Claude Code và Codex trên Windows](docs/vi/W1-cai-claude-code-codex-tren-windows.md)
- [Vì sao hook của bạn im lặng chết trên Windows](docs/vi/W5-hook-im-lang-chet-tren-windows.md)

Giấy phép MIT.
