[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$python = "C:\Users\lian1\Documents\Work\LAINCP\projects\지역_소상공인_010번호_+_인스타\local_biz_collector\venv\Scripts\python.exe"
$script = "C:\Users\lian1\Documents\Work\LAINCP\projects\지역_소상공인_010번호_+_인스타\local_biz_collector\run_headless.py"
& $python $script "포천"
