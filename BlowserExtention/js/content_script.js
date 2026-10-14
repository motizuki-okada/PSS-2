const $ = (e) => document.querySelector(e);
const $All = (e) => document.querySelectorAll(e);

chrome.runtime.onConnect.addListener(function(port){
    if (port.name === "Toward_Conection") {
        port.onMessage.addListener(function (request){
            if (request.action === "Get_Data") {
                port.postMessage({
                    action: 'Get_Data_Acknowledged',
                    success: true
                })
                if($('.right div:nth-child(3) .nodata')){
                    console.log($('.right div:nth-child(3) .nodata').textContent);
                    alert("休講情報はありません。");
                }else if($All('.right div:nth-child(3) .panel-body li .item_1').length > 0){
                    if (window.confirm("休講情報を登録しますか？")){
                        let kkd = {} 
                        let screeningInfo = new Set();
        
                        $All('.right div:nth-child(3) .panel-body li .item_1').forEach(function (item, index){
                            let Cancellation = item.textContent.toLowerCase().replace("[", "").replace("]", "").trim();
                            screeningInfo.add(Cancellation);
                        })
                        const screeningInfoArray = Array.from(screeningInfo);
                        kkd = {
                            "screeningInfo": screeningInfoArray 
                        }
                        alert("休講情報を登録しています。この処理には数秒かかることがあります。");
                        chrome.runtime.sendMessage({
                            "action": "Post_Data",
                            "kkd": kkd
                        },(response) => {
                            if(response.success){
                                if(response.data.Result === "success"){
                                    alert("休講情報を登録しました。");        
                                }else if(response.data.Result === "failure"){
                                    if(response.data.UserAuthentication === "true"){
                                        alert("休講情報を登録できませんでした。トークンもしくはユーザーIDが間違っています。")
                                    }else if(response.data.UserAuthentication === "false"){
                                        alert("休講情報を登録できませんでした。トークンもしくはユーザーIDが間違っています。")
                                    }
                                }
                            }else{
                                alert("通信に失敗しました。");
                            }
                        });
                    }else {
                        alert("休講情報の登録をキャンセルしました。");
                    }

                }else{
                    alert('エラーが発生しました。');
                }         
            }
        })
    }
})

