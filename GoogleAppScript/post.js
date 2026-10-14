function doPost(e) {
  const Sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HogehogeHugahuga");
  const Data = Sheet.getDataRange().getValues();

  const EventData = JSON.parse(e.postData.contents);
  
    if(EventData.events[0].type === 'follow'){
      const UserIdBasic = Sheet.getRange(`A${Data.length}`).getValue()
      const MashupUserId = String(UserIdBasic + 1);
      Sheet.getRange(`A${Data.length + 1}`).setValue("'" + MashupUserId);
    
      const Token = String(Utilities.getUuid().replace(/-/g, ''));
      const TokenHash = HashToken(Token);
      function HashToken(){
        const Digest = Utilities.computeDigest(
          Utilities.DigestAlgorithm.SHA_256,
          Token,
          Utilities.Charset.UTF_8
        )
        return Digest.map(byte => (byte + 256) % 256).map(byte => byte.toString(16).padStart(2, '0')).join('');
      }
      Sheet.getRange(`E${Data.length + 1}`).setValue("'" + String(TokenHash));

      const LineUserId = EventData.events[0].source.userId.trim();
      Sheet.getRange(`D${Data.length + 1}`).setValue("'" + LineUserId);

      const TextMessage = "今日は休講があります！portaで最新情報を確認してください。";
      Sheet.getRange(`B${Data.length + 1}`).setValue("'" + TextMessage);

      const Transmissions = "0";
      Sheet.getRange(`F${Data.length + 1}`).setValue(Transmissions);

      const LoginAccount = [{
        "MashupUserId": MashupUserId,
        "Token": Token        
      }]

      const LoguinAccountMessage = `ユーザーIDは”${LoginAccount[0].MashupUserId}"、トークンは"${LoginAccount[0].Token}"です。拡張機能にこの情報を入力し読み込む必要があります。  なお登録情報は、当LINE公式アカウントをブロックすると自動的に削除されます。ただし、拡張機能で保存したユーザーID・トークンは削除されませんので「情報を削除する」ボタンから必要な情報を削除してください。`

      const AccessToken = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
      const Headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + AccessToken,
      };

      const PostData = {
        to: LineUserId,
        "messages":[{
          "type": 'text',
          "text": LoguinAccountMessage.toString(),
        }],
        "notificationDisabled": false
      }

      const Options = {
        "method": 'post', 
        "headers": Headers,
        "payload": JSON.stringify(PostData),
      };

      UrlFetchApp.fetch('https://api.line.me/v2/bot/message/broadcast', Options);

    }

    if(EventData.events[0].type === 'blowserExtention'){
      const InputUserId = EventData.accountInfo[0].inputUserId;
      const InputToken = EventData.accountInfo[0].inputToken;
      const InputTokenHash = HashToken(InputToken);
      function HashToken(){
        const Digest = Utilities.computeDigest(
          Utilities.DigestAlgorithm.SHA_256,
          InputToken,
          Utilities.Charset.UTF_8
        )
        return Digest.map(byte => (byte + 256) % 256).map(byte => byte.toString(16).padStart(2, '0')).join('');
      }
      
      let ResponceData = [{
        "Result": "",
        "UserAuthentication": "",
        "TokenAuthentication": ""
      }];
      let FailureCounter = 1;
      for(let i = 1; i < Data.length; i++){
        if(InputUserId == Data[i][0]){
          if(InputTokenHash == Data[i][4]){
            let MatchingRows = []
            const Destination = EventData.screeningInfo.length;
            for(let j = 0; j <= Destination - 1; j++){
              let DestinationTime = EventData.screeningInfo[j];
              if(j === 0){
                const Desc = Sheet.getRange(`C${i + 1}`).getValue();
                if(Desc){
                  let LastRow = Sheet.getLastRow();
                  for(let k = 0; k < LastRow - 1; k++){
                    MatchingRows[k] = {
                      "MashupUserId": Sheet.getRange(`A${k + 2}`).getValue(), 
                      "SheetRow": k + 2
                    } 
                  }
                  let MatchingRowsFilter = MatchingRows.filter((item) => {
                    return item.MashupUserId === Data[i][0];
                  }); 
                  
                  if(MatchingRowsFilter.length >= 2){
                    MatchingRowsFilter.slice(1).reverse()
                    .forEach(item => {
                      Sheet.deleteRow(item.SheetRow);
                    });
                  }
                  Sheet.getRange(`C${i + 1}`).clearContent()
                } 
                Sheet.getRange(`C${i + 1}`).setValue(`${DestinationTime} 05:00:00`);
                Sheet.getRange(`F${i + 1}`).setValue("0");
                i++;
              }else if(j >= 1){
                Sheet.insertRowAfter(i);
                Sheet.getRange(`C${i + 1}`).setValue(`${DestinationTime} 05:00:00`);
                const FormerMessage = Sheet.getRange(`B${i}`).getValue();
                Sheet.getRange(`B${i + 1}`).setValue(FormerMessage);

                const FormerUserId = Sheet.getRange(`A${i}`).getValue();
                Sheet.getRange(`A${i + 1}`).setValue(FormerUserId);

                const FormerLineUserId = Sheet.getRange(`D${i}`).getValue();
                Sheet.getRange(`D${i + 1}`).setValue(FormerLineUserId);

                const FormerToken = Sheet.getRange(`E${i}`).getValue();
                Sheet.getRange(`E${i + 1}`).setValue(FormerToken);

                const FormerTransmissions = Sheet.getRange(`F${i}`).getValue();
                Sheet.getRange(`F${i + 1}`).setValue(FormerTransmissions);

                i++;
              }
            }
            ResponceData[0].Result = "success";
            ResponceData[0].UserAuthentication  = "true";
            ResponceData[0].TokenAuthentication = "true";
          }else{
            ResponceData[0].Result = "failure";
            ResponceData[0].UserAuthentication = "true";
            ResponceData[0].TokenAuthentication = "false";  
          }
        }else{
          FailureCounter++
        }
      }
      if(FailureCounter >= Data.length - 1){
        ResponceData[0].Result = "failure";
        ResponceData[0].UserAuthentication = "false";
        ResponceData[0].TokenAuthentication = "false";
      }
      console.log(ResponceData);
      return ContentService.createTextOutput(JSON.stringify(ResponceData[0])).setMimeType(ContentService.MimeType.JSON);
    }
    if(EventData.events[0].type === 'unfollow'){
      const UnfollowLineUserId = EventData.events[0].source.userId;
      const UnfollowMatchingRows = [];
      let LastRow = Sheet.getLastRow();
      for(let l = 0; l < LastRow - 1; l++){
        UnfollowMatchingRows[l] = {
          "LineUserId": Sheet.getRange(`D${l + 2}`).getValue(), 
          "SheetRow": l + 2
        } 
      }
      console.log(UnfollowMatchingRows);
      let MatchingRowsFilter = UnfollowMatchingRows.filter((item) => {
        return item.LineUserId === UnfollowLineUserId;
      });
      if(MatchingRowsFilter){
        MatchingRowsFilter.reverse()
          .forEach(item => {
            Sheet.deleteRow(item.SheetRow);
          });
      }
    }      
} 

