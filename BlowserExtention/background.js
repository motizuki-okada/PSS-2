async function updatePopupForTab(tabId, url) {
    const currentTab__url = "https://porta.nanzan-u.ac.jp/md-portal/";

    if (url.startsWith(currentTab__url)) {
        await chrome.action.setPopup({ tabId, popup: "popup/popup.html" });
    } 
}

chrome.action.onClicked.addListener((tab) => {
    updatePopupForTab(tab.id, tab.url);
});
chrome.runtime.onMessage.addListener(
    async function (message, sender, sendResponse){
        if(message.action === "accountInformation"){
            const accountInfo = {
                "inputToken": message.inputToken,
                "inputUserId":  message.inputUserId
            }
            await chrome.storage.session.set({"accountInfo": accountInfo}); 
        }
        if(message.action === "Post_Data"){
            try{
            const GAS_URL = "https://script.google.com/macros/s/AKfycbyHrj9XLusCXM5T-isVp3wk3bwhV_rrfAP95PCltWth4sppbqseaHrWqYO6IEhx-dHP/exec";
            const savedData = await chrome.storage.session.get("accountInfo");
            const accountInfo = savedData.accountInfo;
            const messageBody = {
                "accountInfo": [accountInfo],
                "screeningInfo": message.kkd.screeningInfo,
                "events": [{"type": "blowserExtention"}]
            }
            
            const response = await fetch(GAS_URL, {
                method: 'POST',

                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },

                body: JSON.stringify(messageBody)
            });

            const contextType = response.headers.get('content-type');
            let result = {}
            if(response.ok && contextType.includes('application/json')){
                result = await response.json();
            }
            
            sendResponse({
                success: true,
                data: result
            });

            await chrome.storage.session.remove("accountInfo");

            
            }catch(error){
                console.error(error);
            }
        }
    }
)

