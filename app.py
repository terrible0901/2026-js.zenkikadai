from flask import Flask, render_template
import sqlite3

app = Flask(__name__)

def get_db_connection():
    # データベースに接続
    conn = sqlite3.connect('database.db')
    # 結果を辞書型(dict)ライクに扱えるように設定（item['name'] などで呼べる）
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    conn = get_db_connection()
    # SQLでデータベースから全件取得
    facilities_rows = conn.execute('SELECT name, lat, lng, category, pref, desc FROM facilities').fetchall()
    conn.close()

    # テンプレートに渡すために Pythonの辞書リスト に変換
    facilities_data = [dict(row) for row in facilities_rows]

    return render_template('index.html', facilities=facilities_data)

if __name__ == '__main__':
    app.run(debug=True)