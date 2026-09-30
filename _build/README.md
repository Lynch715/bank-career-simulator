index.html 由 src/ 下的文件按 build.sh 里的顺序拼成。
改代码时改 src/ 里的文件，跑 `bash build.sh`，再 `cp index.html 银行升职记.html`。
直接改 index.html 也行，但下次拼接会被覆盖。
tools_textcheck.py：抽出全部文本做黑名单和「说」字自查。
