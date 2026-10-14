function doGet() {

  const Sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HogehogeHugahuga");
  const Data = Sheet.getDataRange().getValues();

  const CurrentTime = new Date().getTime();
  console.log(CurrentTime);

  for( let i = 1 ; i <= Data.length - 1; i++){
    const PostTime = Data[i][2].getTime();
    console.log(PostTime);

    if(Data[i][5] === 0){
      if(CurrentTime >= PostTime){
        const AccessToken = PropertiesService.getScriptProperties().getProperty('HogehogeHugahuga');
        const PostMessage = Data[i][1];
        const PostUserId = Data[i][3];
        console.log(PostMessage);
        
        const Headers = {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + AccessToken,
        };

        const PostData = {
          to: PostUserId,
          messages:[{
            type: 'text',
            text: PostMessage.toString(),
          }],
          notificationDisabled: false
        }

        const Options = {
          method: 'post',
          headers: Headers,
          payload: JSON.stringify(PostData),
        };

        UrlFetchApp.fetch('https://api.line.me/v2/bot/message/broadcast', Options);

        const Transmissions = "1";
        Sheet.getRange(`F${i + 1}`).clearContent();
        Sheet.getRange(`F${i + 1}`).setValue(Transmissions);
        
      } 
    }
  }
}


