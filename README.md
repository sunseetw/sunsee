# SUNSEE 善行微光

官方網站：https://sunsee.tw

## 網站結構

- `index.html`：首頁（SUNSEE 2.0）
- `assets/css/sunsee2.css`：首頁樣式
- `assets/js/shops.js`：微光店家資料。新增或修改店家只需改這個檔案
- `assets/js/main.js`：首頁互動（光之星圖、五大計畫、縣市篩選、附近定位、合作表單送出）
- `assets/img/`：首頁使用的店家與職人照片
- `people/`：發光職人個人頁
- `shops/`：微光店家詳細頁
- `with/`：同行計畫活動頁（知福・惜福・同行）
- `meetlight/`：遇光計畫
- `_archive/`：舊版首頁備份（2026-11-16 GitHub 版、2026-11-17 最新上傳版）

## 本機預覽

在專案資料夾執行 `python3 -m http.server 8000`，再開 http://localhost:8000

## 注意

- 網站分析：GA4 `G-X5X213H07P`，每頁都有，只在 sunsee.tw 網域載入，本機預覽不計入流量。
- 合作申請表單透過 FormSubmit 寄到 SUNSEE 信箱，只能在正式網址送出。
- 神攻沙威瑪、雞禽食舍的商品照片以外部網址嵌入；來源失效時會顯示「商品照片待補」。
