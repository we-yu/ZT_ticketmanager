// BOT呼び出しコード
var CATCHER = "@taskbot"

function sandBox() {
  var txt;
  txt = "abcdefghijklmnopqrstuvwxyz";
  Logger.log(txt);
  Logger.log(txt.slice(0, 10));
}

// 今回投稿されたテキストがBOT呼び出しのものかチェック
function isBotMessage(tgtTxt) {
  return (tgtTxt[0] === CATCHER) ? true : false;
}

function padString(tgtText, width, m) {
  padWidth = width - 1;
  width = width * -1;
  padding = "";
  for (var i = 0 ; i < padWidth ; i++ ){
    padding = padding + m;
  }

  padTxt = (padding + tgtText).substr(width);
  return padTxt;
}

/**
 右埋めする処理
 指定桁数になるまで対象文字列の右側に
 指定された文字を埋めます。
 @param val 右埋め対象文字列
 @param char 埋める文字
 @param n 指定桁数
 @return 右埋めした文字列
**/
function paddingright(val,char,n){
  for(; val.length < n; val+=char);
  return val;
 }

 // 本日零時の時間取得(1月23日4時56分に呼び出したとすると、1/23-00:00を返す)
function getTodays0000(){
  // 今日
  var _d = new Date();
  // 今日の零時零分零秒
  var  d = new Date(_d.getFullYear(), _d.getMonth(), _d.getDate(), 0, 0, 0);
  return d;
}

// 投下されたテキストを区切る
// .,はスペースに置換し、複数スペースは一つに置換し、前後の空白も取り除いてスペースで区切った配列に落とし込む。
function textDivide(tgtText) {
  bodyText = tgtText;
  toBotText = bodyText.replace(/(,|\.)/gi, ' ');  // , and . replace to blank
  toBotText = toBotText.replace(/( +)/gi, ' ');   // Multiple blanks replace to single blank
  toBotText = toBotText.trim();                   // Remove blanks from head and tail.
  toBotText = toBotText.toLowerCase();
  botTextArray = toBotText.split(" ");
  reText = botTextArray.join(",");

  // debugLog("Original TEXT :" + bodyText);
  // debugLog("Replaced TEXT :" + toBotText);
  // debugLog("Rebuild  TEXT :" + reText);

  return botTextArray;
}

function getCommandCode(tgtText) {
  cmdis = tgtText[1];
  return cmdis;
}

// 当該チャットワーク部屋になにか投下されたらここに来る。
function doPost(e) {

  // propからプロジェクトのプロパティにアクセスできるようになる
  var prop = PropertiesService.getScriptProperties().getProperties();
  var json = JSON.parse(e.postData.contents);
  /* リクエスト用パラメータ・URLの準備 */
  var params = {
    // Chatworkから入手したアクセス用のトークン。セキュリティ観点からプロジェクトのプロパティに保存してあるのでこれを呼び出す。
    headers : {"X-ChatWorkToken" : prop.API_TOKEN},
    method : "post"
  };
  
  // 投下されたのと同じ部屋に返信する。
  var roomId = json.webhook_event.room_id;
  url = "https://api.chatwork.com/v2/rooms/" + roomId + "/messages";
  // debugLog(url);
  // debugLog(json);
  // debugLog("Catcher = " + CATCHER);
  
  // 投下されたテキスト取得
  var bodyText = json.webhook_event.body;

  // 投下されたテキストを区切る
  var dividedTxt = textDivide(bodyText);

  // 今回のメッセージがBot対象のものか確認。否なら終了。
  if (isBotMessage(dividedTxt) === false) {
    debugLog("This is NOT bot message : " + bodyText);
    return false;
  }
  else
  {
    debugLog("a This is bot message : " + bodyText);
  }

  debugLog(dividedTxt[0]);
  debugLog(dividedTxt[1]);
  debugLog(dividedTxt[2]);
  // 動作内容(@taskbot hoge)を取得
  var cmd = getCommandCode(dividedTxt);
  var opt = dividedTxt[2];
  // debugLog("cmd == ", cmd, typeof cmd);
  var readCmd = "read";
  var allCommand = "--all";
 
  // debugLog(cmd, ":", match);
  // debugLog(typeof cmd, ":", typeof match);
  // debugLog(cmd + ":" + readCmd);

  // 動作内容が"read"である場合
  if(cmd === readCmd){
    debugLog(cmd + ":" + readCmd);
    // アタッチされてるスプレッドシートの
    var tgtFile  = SpreadsheetApp.getActiveSpreadsheet();
    // アクティブシート取得
    // var tgtSheet = tgtFile.getActiveSheet();
    var tgtSheet = tgtFile.getSheetByName("TicketsInfo");
    
    // シートに記載されている内容の取得
    var startrow = 1;
    var startcol = 1;
    var lastrow = tgtSheet.getLastRow();
    var lastcol = tgtSheet.getLastColumn();
    
    var sheetdata = tgtSheet.getSheetValues(startrow, startcol, lastrow, lastcol);
    
    // 各項目の出力時横幅（文字数）
    var textWidths = [6, 14, 10, 12, 12, 18, 42];
    
    msgs = [];
    rowdata = "";
    var tStat;    // 当該レコードのステータス
    var isToday;  // 当該レコードは当日案件か
    var compText = "Completed"; // ”完了済み”を意味するテキストは何か
    var allFlg = false; // 全表示モードか否か

    // 全表示モードならフラグをTrue
    if(opt === allCommand)
      allFlg = true;

    // i = 行
    // j = 列
    for (var i = 0 ; i < lastrow ; i++ ){
      tStat = "";
      isToday = "";
      for (var j = 0 ; j < lastcol ; j++ ){
        // なんらかの理由で余計な列が増えていても7個目で打ち切る
        if (j == 7) break;

        // 当該セルのテキスト取得
        item  = sheetdata[i][j];
        
        // 2列目ならステータスが格納されている。(Z/TH Issued - Completed)
        if(j == 1){
          tStat = item;
        }

        // 一列目は除外
        if(i != 0 && j == 5){
          todays0000 = getTodays0000().getTime();
          ticketTime = item.getTime();
          // debugLog(todays0000 + ":" + ticketTime);
          if(todays0000 < ticketTime)
            isToday = true;
          // debugLog(item + ":" + typeof item);
          item = Utilities.formatDate(item, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm');
        }
        if(i != 0 && j == 6){
          item = item.slice(0, 40);
        }
        
        // 当該アイテムを文字列化し、右側にスペースを足して適切な幅にする。
        item  = item.toString();
        item  = paddingright(item, " ", textWidths[j]);

        // 幅調整したテキストをrowdataに積む
        rowdata += item;
      }
      // debugLog(isToday + ":" + tStat);

      // 全部出すなら積んだrowdataをmsgsに
      if(allFlg) {
        msgs.push(rowdata);
      }
      else {
        if(isToday) {
          msgs.push(rowdata);
        }
        else {
          if(tStat !== compText) {
            msgs.push(rowdata);
          }
        }
      }
      rowdata = "";
    }
    // for (var i = 0 ; i < msgs.length ; i++ ){
    //   debugLog(msgs[i]);
    // }
    // -------------------------
    
    // メッセージ投下者のIDと、投下メッセージID（未使用）
    var accountId = json.webhook_event.account_id;
    var messageId = json.webhook_event.message_id;
    
    // 実際チャットに投下されるメッセージ生成
    var bodyTxt = '';
    bodyTxt += '[code]';
    
    for (var i = 0 ; i < msgs.length ; i++ ){
      bodyTxt += msgs[i] + '\n';
    }
    
    bodyTxt += '[/code]';
    // bodyに格納
    params.payload = {body :bodyTxt};

    debugLog(params);
    
    // 当該部屋（URL）へ送信処理
    UrlFetchApp.fetch(url, params);
  }
}
