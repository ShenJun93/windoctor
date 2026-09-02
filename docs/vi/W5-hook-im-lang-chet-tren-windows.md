# Hook là gì, và vì sao hook của bạn im lặng chết trên Windows

*Bản nháp cho series Thông Não AI Vibe Coding. Chưa xuất bản. Mọi số liệu có ngày kiểm tra (2026-09-02).*

## Giải thích đời thường
Hook là "lệnh chạy tự động khi agent làm một việc gì đó": trước khi chạy công cụ, sau khi sửa file, khi phiên kết thúc. Bạn viết lệnh, Claude Code gọi lệnh đó đúng lúc. Nếu lệnh không chạy được, Claude Code thường không dừng lại; nó chỉ ghi một dòng lỗi rồi đi tiếp. Vì thế hook "chết im lặng".

## Định nghĩa kỹ thuật
Trong Claude Code, hook được khai báo trong `~/.claude/settings.json` (hoặc `.claude/settings.json` của dự án) theo sự kiện: `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, … Mỗi hook là một lệnh shell. Trên Windows, lệnh này chạy qua **Git Bash**, không phải PowerShell hay cmd.

## Ba lý do hook chết trên Windows (và đều tự chẩn đoán được)

1. **`python3: command not found`.** Hook viết cho macOS/Linux gọi `python3`. Windows chỉ có `python`, hoặc tệ hơn, có `python3.exe` giả của Microsoft Store. Trường hợp thật: một Stop hook trên chính máy dùng để viết bài này đã chết vì lỗi này vào 2026-08-30. Sửa: tạo `python3.exe` bằng cách copy `python.exe` cùng thư mục, hoặc trỏ hook thẳng vào `python`.
2. **`bash` không phải Git Bash.** Nếu `C:\Windows\System32\bash.exe` (WSL) đứng trước `C:\Program Files\Git\bin` trong PATH, hook chạy trong WSL: khác PATH, khác Python, khác đường dẫn ổ đĩa. Sửa: đổi thứ tự PATH hoặc đặt `CLAUDE_CODE_GIT_BASH_PATH`.
3. **Mã hóa ký tự.** Hook in tiếng Việt hoặc emoji ra console code page 437 → Python ném `UnicodeEncodeError`, hook thoát khác 0. Sửa: `PYTHONUTF8=1`, `chcp 65001`.

`npx windoctor` kiểm tra cả ba (mục `python3-alias`, `py-stub-*`, `wsl-bash-shadow`, `codepage`, `claude-hooks-python3`) và đọc luôn `settings.json` để tìm hook gọi `python3` khi máy không có `python3`.

## Khi nào cần hook, khi nào chưa
- Cần: chặn lệnh nguy hiểm, tự chạy lint/test sau khi sửa file, ghi log phiên.
- Chưa cần: khi bạn mới cài xong; hook lỗi làm bạn tưởng agent lỗi.

## Giới hạn
- Bài này nói về Claude Code. Codex CLI không có cơ chế hook tương đương tại thời điểm kiểm tra; plugin của Codex gồm skill + cấu hình MCP (đã kiểm tra 2026-09-02).
- Cách Claude Code báo lỗi hook có thể thay đổi theo phiên bản.
