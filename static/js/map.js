// 1. 地図の初期化（日本全体サイズで起動）
const map = L.map('map').setView([36.00, 137.50], 5);

// 2. 国土地理院「標準地図」
L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>',
    minZoom: 2,
    maxZoom: 18
}).addTo(map);

// 📌 【重要】ピンを管理するためのレイヤーグループ
const markerGroup = L.layerGroup().addTo(map);

// 3. ハンバーガーメニューの開閉関数
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('closed');
}

// 4. トグルボタンが押されたときに、見た目のクラスを変更して検索を実行する関数
function setCategory(categoryValue) {
    // すべてのトグルボタンから一端 active クラスを消去
    document.getElementById('btn-all').classList.remove('active');
    document.getElementById('btn-art').classList.remove('active');
    document.getElementById('btn-museum').classList.remove('active');

    // クリックされたボタンに対応するボタンに active クラスを付与
    if (categoryValue === 'all') {
        document.getElementById('btn-all').classList.add('active');
    } else if (categoryValue === 'art_gallery') {
        document.getElementById('btn-art').classList.add('active');
    } else if (categoryValue === 'museum') {
        document.getElementById('btn-museum').classList.add('active');
    }

    // 隠しインプットの値を書き換える
    document.getElementById('category-filter').value = categoryValue;

    // ボタン操作時は自動ズームを行いたいので true を渡す
    filterMap(true); 
}

// 5. 【コア】複合フィルター ＆ 表示制限 ＆ 自動ズーム処理
// 引数 isUserAction: ユーザーが検索窓やフィルターを明示的に操作したかどうか
// 5. 【コア】複合フィルター ＆ 表示制限 ＆ 自動ズーム処理
function filterMap(isUserAction = false) {
    // 1. 一旦マップ上のピンをすべてクリア
    markerGroup.clearLayers();

    // 2. 検索条件の取得
    const searchWord = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const prefFilter = document.getElementById('pref-filter').value;

    const matchedBounds = [];
    const matchedItems = [];

    // 3. まず条件に合う施設をすべて洗い出す（ズームレベルに関係なく計算）
    facilities.forEach(item => {
        const matchName = item.name.toLowerCase().includes(searchWord);
        const matchCategory = (categoryFilter === 'all' || item.category === categoryFilter);
        const matchPref = (prefFilter === 'all' || item.pref === prefFilter);

        if (matchName && matchCategory && matchPref) {
            matchedBounds.push([item.lat, item.lng]);
            matchedItems.push(item); // 後でピンを描画するためにデータを保持
        }
    });

    // 4. 【ここが重要】ユーザー自身が操作した時、かつ結果がある場合は「先に」自動ズームを実行する
    // これにより、引きの画面（ズーム5）からでも一気にズームレベル13等まで拡大します
    if (isUserAction && matchedBounds.length > 0) {
        map.fitBounds(matchedBounds, { padding: [50, 50], maxZoom: 13 });
    }

    // 5. 自動ズームした「後」の、最新のズームレベルを取得する
    const currentZoom = map.getZoom();
    
    // ズームレベルが 8 未満なら、ここで処理を終了してピンは描画しない（軽量化）
    if (currentZoom < 8) {
        return; 
    }

    // 6. ズームレベルが 8 以上の時だけ、実際にピンをマップ上に生成する
    matchedItems.forEach(item => {
        const categoryLabel = item.category === 'art_gallery' ? '🎨 美術館' : '🏛️ 博物館';
        const popupContent = `
            <div style="font-size: 14px; width: 200px;">
                <strong style="font-size: 16px;">${item.name}</strong><br>
                <span style="color: #666; font-size: 11px;">分類: ${categoryLabel}</span><br>
                <span style="color: #666; font-size: 11px;">所在地: ${item.pref}</span>
                <hr style="margin: 6px 0;">
                <p style="margin: 0;">${item.desc || ''}</p>
            </div>
        `;

        const marker = L.marker([item.lat, item.lng]).bindPopup(popupContent);
        markerGroup.addLayer(marker);
    });
}

// ==========================================
// イベントリスナーの設定
// ==========================================

// 地図が手動でズーム（拡大・縮小）や移動されたら、ピンの表示・非表示を再計算する
//（ここでは自動ズームさせないように false を維持）
map.on('zoomend', function() {
    filterMap(false);
});

// 都道府県セレクトボックスが変更されたとき
document.getElementById('pref-filter').addEventListener('change', function() {
    filterMap(true); // ★ズームを実行させるために true を渡す
});

// 検索窓に文字が入力されたとき
document.getElementById('search-input').addEventListener('input', function() {
    filterMap(true); // ★ズームを実行させるために true を渡す
});

// 🚀 初回起動時の実行
// 最初は日本全体（ズーム5）なのでピンは表示されません。拡大すると表示されます。
filterMap(false);