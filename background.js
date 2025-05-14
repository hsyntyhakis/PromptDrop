chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "save-to-promptdrop",
      title: "Save to PromptDrop",
      contexts: ["selection"] // Only show when text is selected
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-promptdrop") {
      const selectedText = info.selectionText;
  
      // Open the save prompt modal (we'll implement this later)
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: openSavePromptModal,
        args: [selectedText]
      });
    }
  });
  
  function openSavePromptModal(selectedText) {
    // This function will be injected into the current tab.
    // It's responsible for creating and displaying the modal.
  
    // Check if the modal is already open. If so, focus on it and return.
    if (document.getElementById('promptdrop-modal')) {
      document.getElementById('promptdrop-modal').focus();
      return;
    }
  
    const modal = document.createElement('div');
    modal.id = 'promptdrop-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      border: 1px solid #ccc;
      padding: 20px;
      z-index: 10000; /* Ensure it's on top of everything */
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    `;
  
    const overlay = document.createElement('div');
    overlay.id = 'promptdrop-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;
  
    const textDisplay = document.createElement('p');
    textDisplay.textContent = selectedText;
  
    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.placeholder = 'Add tags (comma-separated)';
  
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
  
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
  
    modal.appendChild(textDisplay);
    modal.appendChild(tagInput);
    modal.appendChild(saveButton);
    modal.appendChild(cancelButton);
  
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  
  
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      document.body.removeChild(overlay);
    });
  
    saveButton.addEventListener('click', () => {
      const tags = tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''); // trim and remove empty
      savePrompt(selectedText, tags);
      document.body.removeChild(modal);
      document.body.removeChild(overlay);
  
    });
  
    function savePrompt(content, tags) {
      chrome.storage.local.get({prompts: []}, function(result) {
          const prompts = result.prompts;
          const title = content.substring(0, 50); // First 50 characters as title
          const newPrompt = {
              title: title,
              content: content,
              tags: tags
          };
          prompts.push(newPrompt);
          chrome.storage.local.set({prompts: prompts}, function() {
              console.log('Prompt saved:', newPrompt);
          });
      });
  }
  }