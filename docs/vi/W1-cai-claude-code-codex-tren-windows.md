# Cài Claude Code và Codex CLI trên Windows: 6 lỗi ai cũng gặp, và cách tự chẩn đoán trong 10 giây

*Bản nháp cho series Thông Não AI Vibe Coding. Mọi số liệu có ngày kiểm tra. Chưa xuất bản.*

## Vấn đề thật
Tính đến 2026-09-02, kho `anthropics/claude-code` có 900 issue đang mở với chữ "windows" trong tiêu đề; `openai/codex` có 2.651. Issue được vote nhiều nhất bên Codex là "cần bộ cài Windows độc lập" (189 👍). Phần lớn lỗi ngày đầu không phải do máy bạn, mà do sáu thứ lặp đi lặp lại dưới đây.

## Tự chẩn đoán trước, đọc sau
Mở PowerShell hoặc Windows Terminal, chạy:

```powershell
npx windoctor
```

Công cụ chỉ đọc, không sửa gì. Mỗi dòng ✖ FAIL hoặc ! WARN đi kèm lệnh sửa cụ thể. Mã thoát: 0 = ổn, 1 = có cảnh báo, 2 = có lỗi.

## Sáu lỗi phổ biến

| # | Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|---|
| 1 | `'claude' is not recognized` hoặc `'codex' is not recognized` ngay sau `npm i -g` | Thư mục bin toàn cục của npm (`%AppData%\npm`) chưa nằm trong PATH, hoặc bạn chưa mở terminal mới | Thêm vào PATH người dùng rồi mở terminal mới; windoctor in sẵn lệnh |
| 2 | Cài `npm i -g codex` mà chạy không được gì | Gói `codex` trên npm là một dự án cũ từ 2012; gói đúng là `@openai/codex` | `npm i -g @openai/codex` |
| 3 | Claude Code không khởi động, báo thiếu Git Bash | Claude Code trên Windows chạy lệnh qua Git Bash | Cài Git for Windows; nếu cài chỗ lạ, đặt `CLAUDE_CODE_GIT_BASH_PATH` |
| 4 | Hook báo `python3: command not found`, hoặc mở cửa sổ Microsoft Store | Windows có "python3.exe" giả (App Execution Alias) mở Store; hoặc chỉ có `python` không có `python3` | Tắt alias trong Settings → Apps → App execution aliases; tạo `python3.exe` bằng cách copy `python.exe` |
| 5 | `claude.ps1 cannot be loaded because running scripts is disabled` | Execution policy của PowerShell là Restricted | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| 6 | Tiếng Việt, emoji hiện thành `?`; hook Python báo `UnicodeEncodeError` | Code page console là 437/1252, không phải UTF-8 | `chcp 65001` trong phiên; đặt `PYTHONUTF8=1` |

Hai điều nữa hay bị bỏ qua: bật **long paths** (đường dẫn > 260 ký tự) nếu `npm install` báo `ENAMETOOLONG`; và dùng **Windows Terminal** thay vì cửa sổ console cũ, vì hầu hết lỗi nháy màn hình, nhảy cuộn và trùng ký tự khi gõ tiếng Việt xảy ra trên conhost.

## Giới hạn của bài này
- Chỉ nói về CLI. Ứng dụng desktop của Claude và Codex có nhóm lỗi riêng (luôn nổi trên cùng, treo, cài đặt) mà công cụ này không chẩn đoán được.
- Số issue là con số tại thời điểm kiểm tra; sẽ thay đổi.
- Nếu bạn gặp lỗi không nằm trong danh sách, mở issue kèm output của `npx windoctor --json`.

## Nguồn đã kiểm tra (2026-09-02)
- Issue search GitHub: `repo:anthropics/claude-code is:open windows in:title` (900), `repo:openai/codex is:open windows in:title` (2.651).
- openai/codex#13993 (bộ cài Windows), #13762 (CODEX_HOME trong WSL), #13542 (rg Access Denied).
- anthropics/claude-code#826, #14828 (console cuộn/nháy).
- Google autocomplete "codex cli" → "codex cli windows", "codex cli install windows".
