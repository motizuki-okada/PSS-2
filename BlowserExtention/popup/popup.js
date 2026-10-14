const $ = (e) => document.querySelector(e);

const currentTab__url = "https://porta.nanzan-u.ac.jp/md-portal/"

async function connectToContentScript() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab?.id) {
        throw new Error("通信対象のタブを取得できませんでした。");
    }

    const port = chrome.tabs.connect(currentTab.id, {
        name: "Toward_Conection",
    });

    return port;
}

function requestScraping(port, request) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            finish(
                reject,
                new Error("content_script.jsから応答がありませんでした。")
            );
        }, 3000);

        const finish = (callback, value) => {
            clearTimeout(timeoutId);
            port.onMessage.removeListener(handleMessage);
            port.onDisconnect.removeListener(handleDisconnect);
            callback(value);
        };

        const handleMessage = (response) => {
            if (response?.action === "Get_Data_Acknowledged" && response.success === true) {
                finish(resolve, response);
            }
        };

        const handleDisconnect = () => {
            const message = chrome.runtime.lastError?.message
                || "content_script.jsとの通信が切断されました。";
            finish(reject, new Error(message));
        };

        port.onMessage.addListener(handleMessage);
        port.onDisconnect.addListener(handleDisconnect);
        port.postMessage(request);
    });
}

function showContentScriptConnectionError(error) {
    alert("通信に失敗しました。PORTAをリロードしてから、もう一度お試しください。");
    console.error(error);
}

window.onload = async function (){
    let TokenAutoFillCounter = 0 ;
    let UserIdAutoFillCounter = 0;
    
    function toHalfWidth(value){
        return value.replace(
            /[Ａ-Ｚａ-ｚ０-９]/g,
            character =>
            String.fromCharCode(
                character.charCodeAt(0) - 0xFEE0
            )
        );
    }

    $('.input-field--token--default').addEventListener('focus', async function TokenAutoFill(){
        const savedData = await chrome.storage.local.get("accountInfo");
        if(savedData.accountInfo && typeof savedData.accountInfo === 'object'){
            const MashUpToken = savedData.accountInfo.MashUpToken;
            if(MashUpToken === "undefined"){
                return;
            }else{
                if(TokenAutoFillCounter === 0){
                    if(window.confirm(`トークンを自動入力しますか`)){
                       $('.input-field--token--default').value = MashUpToken;
                       $('.input-field--token--default').blur();
                    }else{
                       $('.input-field--token--default').blur();
                    }
                    TokenAutoFillCounter++;
                }else{
                    return;
                }
            }
        }else{
            return;
        }
    }
    );
    $('.input-field--userId--default').addEventListener('focus',async function TokenAutoFill(){
        const savedData = await chrome.storage.local.get("accountInfo");
        if(savedData.accountInfo && typeof savedData.accountInfo === 'object'){
            const MashUpUserId = savedData.accountInfo.MashUpUserId;
            if(MashUpUserId === "undefined"){
                return;
            }else{
                if(UserIdAutoFillCounter === 0){
                    if(window.confirm(`ユーザーIDを自動入力しますか`)){
                        $('.input-field--userId--default').value = MashUpUserId;
                        $('.input-field--userId--default').blur();
                    }else{
                        $('.input-field--userId--default').blur();
                    }
                    UserIdAutoFillCounter++;
                }else{
                    return;
                }
            }
        }else{
            return;
        }
    })
    $('.button--submit--default').onclick = async function (){
        const defaultInputUserId = toHalfWidth($('.input-field--userId--default').value.toLowerCase().trim());
        const defaultInputToken = toHalfWidth($('.input-field--token--default').value.toLowerCase().trim());
        
        if(defaultInputUserId && defaultInputToken){

            if(!/^\d+$/.test(defaultInputUserId)){
                alert("ユーザーID入力欄には数字を入力してください。");
                return
            }
            try {
                const connection = await connectToContentScript();
                
                await chrome.runtime.sendMessage({
                    "action": "accountInformation",
                    "inputToken": defaultInputToken,
                    "inputUserId": defaultInputUserId
                });
                
                await requestScraping(connection, {
                    action: "Get_Data"
                });
            } catch (error) {
                showContentScriptConnectionError(error);
            }
        }else{
            alert('ユーザーID・トークンを入力してください。');
        }
        
    }
    $('.button--submit--manager').onclick = async function(){
        const savedData = await chrome.storage.local.get("accountInfo");

        const managerInputUserId = toHalfWidth($('.input-field--userId--manager').value.toLowerCase().trim());
        const managerInputToken = toHalfWidth($('.input-field--token--manager').value.toLowerCase().trim());
        
        if(savedData.accountInfo && typeof savedData.accountInfo === 'object'){
            alert("ユーザーID・トークンは既に保存されています。")
        }else{
            if(managerInputUserId && managerInputToken){
                if(!/^\d+$/.test(managerInputUserId)){
                    alert("ユーザーID入力欄には数字を入力してください。");
                    return
                }
                if(window.confirm(`トークン・ユーザーIDを保存しますか。`)){
                    await chrome.storage.local.set({
                        accountInfo: {
                            MashUpUserId: managerInputUserId,
                            MashUpToken: managerInputToken
                        }
                    });
                    alert("トークンとユーザーIDを保存しました。");
                }else{
                    return;
                }
            }else{
                alert("トークンとユーザーIDを保存できませんでした");
                return;
            }
        }
    }
    $(".button--delete").onclick = async function(){
        const savedData = await chrome.storage.local.get("accountInfo");

        if(savedData.accountInfo && typeof savedData.accountInfo === 'object'){
            if(window.confirm("保存されているユーザーID・トークンを削除しますか？(削除した場合、ユーザーID・トークンの自動入力は新しいユーザーID・トークンを保存するまで使用できません。)")){
                await chrome.storage.local.remove(
                   'accountInfo'
                );
                alert("ユーザーID・トークンを削除しました。新しいユーザーID・トークンを保存するには「情報保存」ボタンから操作してください。")
            }
        }else{
            alert("保存されている情報はありませんでした。");
        }
    }
}
