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
          target: {tabId: tab.id},
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

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = 'Prompt Title';
  titleInput.id = 'prompt-title-input'; // Added ID for easy access later

  const textDisplay = document.createElement('p');
  textDisplay.textContent = selectedText;

  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.placeholder = 'Add tags (comma-separated)';
  tagInput.id = 'prompt-tag-input';

  const tagDropdown = document.createElement('select');
  tagDropdown.id = 'prompt-tag-dropdown';
  tagDropdown.style.width = '100%';
  tagDropdown.style.display = 'none'; // Initially hidden

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';

  modal.appendChild(titleInput);
  modal.appendChild(textDisplay);
  modal.appendChild(tagInput);
  modal.appendChild(tagDropdown);
  modal.appendChild(saveButton);
  modal.appendChild(cancelButton);

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Load tags suggestions
  loadTagSuggestions();

  function loadTagSuggestions() {
      chrome.storage.local.get({tags: []}, (data) => {
          const tags = data.tags;
          tagDropdown.innerHTML = ''; // Clear existing options

          // Add a default option
          const defaultOption = document.createElement('option');
          defaultOption.text = 'Select a tag';
          defaultOption.value = '';
          tagDropdown.add(defaultOption);

          tags.forEach(tag => {
              const option = document.createElement('option');
              option.text = tag;
              option.value = tag;
              tagDropdown.add(option);
          });
      });
  }

  // Add click listener to the tag input field
  tagInput.addEventListener('click', () => {
      tagDropdown.style.display = tagDropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Add change listener to the tag dropdown menu
  tagDropdown.addEventListener('change', () => {
      const selectedTag = tagDropdown.value;
      if (selectedTag !== '') {
          const currentTags = tagInput.value.trim();
          if (currentTags === '') {
              tagInput.value = selectedTag;
          } else if (!currentTags.split(',').map(t => t.trim()).includes(selectedTag)) {
              tagInput.value = currentTags + ', ' + selectedTag;
          }
          tagDropdown.value = ''; // Reset the dropdown
          tagDropdown.style.display = 'none'; // Hide the dropdown after selection
      }
  });

  cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      document.body.removeChild(overlay);
  });

  saveButton.addEventListener('click', () => {
      const title = titleInput.value; // Get the title
      const tags = tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''); // trim and remove empty
      savePrompt(title, selectedText, tags); // Pass the title to savePrompt
      document.body.removeChild(modal);
      document.body.removeChild(overlay);

  });

  function savePrompt(title, content, tags) {
      chrome.storage.local.get({prompts: [], tags: []}, function (result) {
          const prompts = result.prompts;
          let existingTags = result.tags;

          const newPrompt = {
              title: title,
              content: content,
              tags: tags
          };
          prompts.push(newPrompt);

          // Update available tags
          tags.forEach(tag => {
              if (!existingTags.includes(tag)) {
                  existingTags.push(tag);
              }
          });

          chrome.storage.local.set({prompts: prompts, tags: existingTags}, function () {
              console.log('Prompt saved:', newPrompt);
              loadTagSuggestions();
          });
      });
  }
}