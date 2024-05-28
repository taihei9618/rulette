//　確率
const probabilities = [1.0, 0.0, 0.0];

// 各セグメントの停止角度範囲を計算
const stopAngles = [];
let currentAngle = 0;
for (let i = 0; i < probabilities.length; i++) {
    const angleRange = probabilities[i] * Math.PI * 2;
    stopAngles.push([currentAngle, currentAngle + angleRange]);
    currentAngle += angleRange;
}

// 半径
const radius = 150;

// canvasの幅と高さ
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 360;

// 中心座標
const centerX = CANVAS_WIDTH / 2;
const centerY = CANVAS_HEIGHT / 2;

// ルーレットの目の数
const count = 3;

// 各目に描画するイメージが格納されている配列
const images = [];

// 各目の背景色
const colors = ['#FDFD96', '#77DD77', '#FF6961']; // 新しい色の配列

// 回転速度（弧度法）
const MAX_SPEED = 0.3;
const MIN_SPEED = 0.01;
let speed = 0;

// 扇形の中心角
const rad = Math.PI * 2 / count;

// canvas要素とコンテキスト
const $canvas = document.getElementById('canvas');
const ctx = $canvas.getContext('2d');

// スタートボタンと停止ボタン
const $start = document.getElementById('start');
const $stop = document.getElementById('stop');

// 効果音
const startSound = new Audio('./sounds/start.mp3');
const stopedSound = new Audio('./sounds/stoped.mp3');
const clickSound = new Audio('./sounds/click.mp3'); 

// ページが読み込まれたときの処理
window.onload = () => {
    $canvas.width = CANVAS_WIDTH;
    $canvas.height = CANVAS_HEIGHT;

    // 画像ファイルを読み出してイメージを配列に格納
    const imagePromises = [];
    for (let i = 0; i < count; i++) {
        const image = new Image();
        image.src = `./images/${i + 1}.png`; // 画像のファイル名が1.png, 2.png, 3.pngとする
        images.push(image);
        imagePromises.push(new Promise((resolve) => {
            image.onload = resolve;
        }));
    }

    // 画像の読み込みが完了してから更新処理を開始
    Promise.all(imagePromises).then(() => {
        // 停止ボタンを非表示に
        $stop.style.display = 'none';

        // 更新処理の開始
        setInterval(() => {
            update();
        }, 10);
    });
}

// 更新処理
let initRound = 0;
function update() {
    // canvas全体を黒で塗りつぶす
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, $canvas.width, $canvas.height);

    ctx.save();

    // 初期状態からどれだけ回転しているか？（回転速度を追加すればよい）
    initRound += speed;

    // 中心になる座標が原点になるように平行移動
    ctx.translate(centerX, centerY);
    // 回転
    ctx.rotate(initRound);

    for (let i = 0; i < count; i++) {
        // 扇形を描画
        ctx.beginPath();
        ctx.arc(0, 0, radius, rad * i, rad * (i + 1));
        ctx.lineTo(0, 0);
        ctx.closePath();

        // 扇形の内部を塗りつぶす
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // 扇形に内接するようにイメージを描画する
        const img = images[i % images.length];
        if (img.complete) { // 画像がロードされているか確認
            ctx.save();
            ctx.translate((radius * 2 / 3) * Math.cos(rad * (i + 0.5)), (radius * 2 / 3) * Math.sin(rad * (i + 0.5)));
            ctx.rotate(rad * (i + 0.5) + Math.PI / 2); // 画像を正しく配置
            const imgSize = radius / 2; // 画像サイズを調整
            ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
            ctx.restore();
        }
    }
    ctx.restore();


    // ルーレットを指す三角形を描画する
    // 三角形の内部を描画
    ctx.beginPath();
    ctx.moveTo($canvas.width, centerY - 10);
    ctx.lineTo($canvas.width - 45, centerY);
    ctx.lineTo($canvas.width, centerY + 10);
    ctx.closePath();
    ctx.fillStyle= '#a0d8ef';
    ctx.fill();

    // 三角形の輪郭を描画
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.lineWidth = 1;
}

// 回転ボタンをクリックしたときの処理
async function start() {
    // ボタン音を再生する
    clickSound.currentTime = 0;
    clickSound.play();

    // 回転速度を最大に
    speed = MAX_SPEED;

    // 開始ボタンを非表示にして停止ボタンを表示させる
    $start.style.display = 'none';
    $stop.style.display = 'block';

    // 効果音を再生する
    startSound.currentTime = 1;
    startSound.play();
}

// 確率に基づいて停止位置のインデックスを取得する関数
function getStopIndex() {
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    for (let i = 0; i < probabilities.length; i++) {
        cumulativeProbability += probabilities[i];
        if (randomValue <= cumulativeProbability) {
            return i;
        }
    }
    return probabilities.length - 1; // 万が一のためのフォールバック
}

// ルーレットを停止させる
function stop() {
    // ボタン音を再生する
    clickSound.currentTime = 0;
    clickSound.play();

    // 停止ボタンを非表示に
    $stop.style.display = 'none';
    const targetSegment = Math.random();
    let targetAngle;
    for (let i = 0; i < stopAngles.length; i++) {
        if (targetSegment >= (i > 0 ? probabilities.slice(0, i).reduce((a, b) => a + b) : 0) && 
            targetSegment < probabilities.slice(0, i + 1).reduce((a, b) => a + b)) {
            targetAngle = stopAngles[i][0] + (stopAngles[i][1] - stopAngles[i][0]) / 2;
            break;
        }
    }

    const id = setInterval(() => {
        // 回転速度を低下させ、最低速度を下回ったら停止させる
        if (speed > MIN_SPEED)
            speed -= 0.004;
        else {
            // 停止させるときは回転速度を0にしてインターバルを削除する
            speed = 0;
            clearInterval(id);

            // 回転時の効果音を停止
            // 一呼吸おいて停止時の効果音を再生する
            startSound.pause();
            setTimeout(() => {
                $start.style.display = 'block';
                stopedSound.currentTime = 0;
                stopedSound.play();
            }, 300);
        }
    }, 30);
}
