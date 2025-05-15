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

// --- Start of openSavePromptModal function in background.js ---
function openSavePromptModal(selectedText) {
    if (document.getElementById('promptdrop-modal-container')) {
        document.getElementById('promptdrop-modal-container').focus();
        return;
    }

    // --- Modal Container (for centering and overlay) ---
    const modalContainer = document.createElement('div');
    modalContainer.id = 'promptdrop-modal-container';
    // ... (rest of modalContainer styles) ...
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6); /* Darker overlay */
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;


    // --- Modal Content ---
    const modal = document.createElement('div');
    modal.id = 'promptdrop-modal-content';
    // ... (rest of modal styles) ...
    modal.style.cssText = `
        background-color: #2c2c2e; /* Dark background */
        color: #f2f2f7; /* Light text */
        border-radius: 12px;
        padding: 20px;
        width: 450px; /* Or your preferred width */
        max-width: 90%;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        gap: 15px; /* Spacing between elements */
    `;


    // --- Header ---
    const header = document.createElement('div');
    // ... (header styles) ...
    header.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 10px;
        border-bottom: 1px solid #3a3a3c; /* Subtle separator */
    `;

    const appLogo = document.createElement('img');
    appLogo.src = chrome.runtime.getURL('icons/logo.png');
    appLogo.alt = 'PromptDrop Logo';
    appLogo.style.cssText = `
        width: 24px;
        height: 24px;
        vertical-align: middle;
    `;

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Save new prompt';
    modalTitle.style.cssText = `
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        flex-grow: 1;
    `;


    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: #8e8e93;
        font-size: 24px;
        cursor: pointer;
        padding: 0 5px;
        margin-left: auto;
    `;
    closeButton.title = 'Close';

    header.appendChild(appLogo);
    header.appendChild(modalTitle);
    header.appendChild(closeButton);

    // --- Title Field ---
    const titleLabel = document.createElement('label');
    // ... (titleLabel styles) ...
    titleLabel.textContent = 'TITLE';
    titleLabel.style.cssText = `font-size: 12px; color: #8e8e93; font-weight: 500;`;


    const titleInput = document.createElement('input');
    // ... (titleInput styles) ...
    titleInput.type = 'text';
    titleInput.id = 'promptdrop-title-input';
    titleInput.placeholder = 'Enter a title';
    titleInput.style.cssText = `
        width: 100%;
        padding: 10px;
        border: 1px solid #3a3a3c;
        border-radius: 6px;
        background-color: #3a3a3c; /* Slightly lighter input background */
        color: #f2f2f7;
        box-sizing: border-box; /* Important for padding and width */
        font-size: 14px;
    `;


    // --- Prompt Content Field (Editable) ---
    const contentLabel = document.createElement('label');
    // ... (contentLabel styles) ...
    contentLabel.textContent = 'PROMPT';
    contentLabel.style.cssText = `font-size: 12px; color: #8e8e93; font-weight: 500; margin-top: 20px;`;


    const contentTextarea = document.createElement('textarea');
    // ... (contentTextarea styles) ...
    contentTextarea.id = 'promptdrop-content-textarea';
    contentTextarea.value = selectedText; // Pre-fill with selected text
    contentTextarea.rows = 5; // Adjust as needed
    contentTextarea.style.cssText = `
        width: 100%;
        padding: 10px;
        border: 1px solid #3a3a3c;
        border-radius: 6px;
        background-color: #3a3a3c;
        color: #f2f2f7;
        box-sizing: border-box;
        font-size: 14px;
        resize: vertical; /* Allow vertical resize */
    `;


    // --- Tags Field ---
    const tagsLabel = document.createElement('label');
    // ... (tagsLabel styles) ...
    tagsLabel.textContent = 'TAGS';
    tagsLabel.style.cssText = `font-size: 12px; color: #8e8e93; font-weight: 500; margin-top: 20px;`;

    const tagsOuterContainer = document.createElement('div'); // ** NEW: To help position dropdown **
    tagsOuterContainer.style.position = 'relative'; // ** NEW: For absolute positioning of dropdown **

    const tagsContainer = document.createElement('div'); // To hold pills and input
    tagsContainer.id = 'promptdrop-tags-pills-container'; // Give it an ID for easier targeting
    // ... (tagsContainer styles) ...
    tagsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 8px;
        border: 1px solid #3a3a3c;
        border-radius: 6px;
        background-color: #3a3a3c;
        gap: 5px; /* Gap between pills and input */
    `;


    const tagsInput = document.createElement('input');
    // ... (tagsInput styles) ...
    tagsInput.type = 'text';
    tagsInput.id = 'promptdrop-tags-input';
    tagsInput.placeholder = 'Add tags...';
    tagsInput.style.cssText = `
        flex-grow: 1; /* Allows input to take remaining space */
        border: none;
        background-color: transparent;
        color: #f2f2f7;
        outline: none; /* Remove default focus outline */
        font-size: 14px;
        min-width: 100px; /* Ensure it has some base width */
    `;

    // ** NEW: Array to store current tags for this prompt **
    let currentPromptTags = [];

    // ** NEW: Function to create a tag pill **
    function createTagPill(tagText) {
        if (!tagText || currentPromptTags.includes(tagText.toLowerCase())) { // Prevent empty or duplicate tags
            return;
        }

        const pill = document.createElement('div');
        pill.classList.add('promptdrop-tag-pill');
        pill.textContent = tagText;
        pill.style.cssText = `
            background-color: #505054; /* Pill background */
            color: #f2f2f7;
            padding: 4px 8px;
            border-radius: 12px; /* Rounded pill */
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 5px;
        `;

        const removePillButton = document.createElement('span');
        removePillButton.innerHTML = '×';
        removePillButton.style.cssText = `
            cursor: pointer;
            font-weight: bold;
            margin-left: 3px; /* Spacing for the 'x' */
        `;
        removePillButton.onclick = () => {
            tagsContainer.removeChild(pill);
            currentPromptTags = currentPromptTags.filter(t => t !== tagText.toLowerCase());
        };

        pill.appendChild(removePillButton);
        tagsContainer.insertBefore(pill, tagsInput); // Insert pill before the input field
        currentPromptTags.push(tagText.toLowerCase());
    }

    // ** NEW: Event listener for tagsInput **
    tagsInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault(); // Prevent default form submission or comma in input
            const tagText = tagsInput.value.trim();
            if (tagText) {
                createTagPill(tagText);
                tagsInput.value = ''; // Clear the input
            }
        } else if (event.key === "Escape") { // ** NEW: Hide dropdown on Escape **
            hideTagSuggestions();
        }
    });
    // Add blur event to create tag if input loses focus and has text
    tagsInput.addEventListener('blur', () => {
        // ** MODIFIED: Delay hiding to allow clicks on suggestions **
        setTimeout(() => {
            // Check if the new focused element is part of our suggestions
            if (!tagSuggestionsDropdown.contains(document.activeElement)) {
                hideTagSuggestions();
            }
        }, 100); // Small delay

        // Create pill from remaining text on blur (if any)
        const tagText = tagsInput.value.trim();
        if (tagText) {
            createTagPill(tagText);
            tagsInput.value = '';
        }
    });

    tagsContainer.appendChild(tagsInput);
    tagsOuterContainer.appendChild(tagsContainer);

    const tagSuggestionsDropdown = document.createElement('div');
    tagSuggestionsDropdown.id = 'promptdrop-tag-suggestions';
    tagSuggestionsDropdown.style.cssText = `
        display: none; /* Hidden by default */
        position: absolute;
        top: 100%; /* Position below the tagsContainer */
        left: 0;
        right: 0;
        background-color: #3a3a3c; /* Match input background */
        border: 1px solid #505054; /* Slightly different border */
        border-top: none; /* Avoid double border with container */
        border-radius: 0 0 6px 6px; /* Rounded bottom corners */
        z-index: 10001; /* Above modal content but below other potential popups */
        max-height: 150px; /* Limit height and make scrollable */
        overflow-y: auto;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;

    let suggestionHideTimeout; // ** NEW: For managing blur hide delay **

    function populateTagSuggestions(filterText = '') {
        filterText = filterText.toLowerCase();
        chrome.storage.local.get({ tags: [] }, (data) => {
            tagSuggestionsDropdown.innerHTML = ''; // Clear old suggestions
            const globalTags = data.tags || [];
            
            const filteredTags = globalTags.filter(tag => 
                tag.toLowerCase().includes(filterText) && 
                !currentPromptTags.includes(tag.toLowerCase()) // Don't suggest already added tags
            );

            if (filteredTags.length === 0 && !filterText) { // No tags at all and no filter
                 // Optionally show "No tags yet" or similar
            } else if (filteredTags.length === 0 && filterText) {
                const noMatchItem = document.createElement('div');
                noMatchItem.textContent = `No matching tags for "${filterText}"`;
                noMatchItem.style.cssText = `padding: 8px 10px; color: #8e8e93; font-style: italic;`;
                tagSuggestionsDropdown.appendChild(noMatchItem);
            }


            filteredTags.forEach(tag => {
                const suggestionItem = document.createElement('div');
                suggestionItem.textContent = tag;
                suggestionItem.style.cssText = `
                    padding: 8px 10px;
                    cursor: pointer;
                    color: #f2f2f7;
                `;
                suggestionItem.onmouseover = () => { suggestionItem.style.backgroundColor = '#505054'; };
                suggestionItem.onmouseout = () => { suggestionItem.style.backgroundColor = 'transparent'; };
                
                suggestionItem.addEventListener('mousedown', (e) => { // Use mousedown to act before blur
                    e.preventDefault(); // Prevent input from losing focus immediately
                    createTagPill(tag);
                    tagsInput.value = '';
                    hideTagSuggestions();
                    tagsInput.focus(); // Keep focus on the input
                });
                tagSuggestionsDropdown.appendChild(suggestionItem);
            });

            if (filteredTags.length > 0 || (filteredTags.length === 0 && filterText)) {
                tagSuggestionsDropdown.style.display = 'block';
            } else {
                tagSuggestionsDropdown.style.display = 'none';
            }
        });
    }

    function hideTagSuggestions() {
        tagSuggestionsDropdown.style.display = 'none';
    }
    
    let firstFocus = true;
    
    tagsInput.addEventListener('focus', () => {
        clearTimeout(suggestionHideTimeout); 
        if (firstFocus) { // ** NEW: Check for first focus **
            firstFocus = false; // Set flag so it doesn't run again on this modal instance
            return; // Don't populate on the very first programmatic focus
        }
        populateTagSuggestions(tagsInput.value);
    });

    tagsInput.addEventListener('input', () => {
        firstFocus = false; // If user types, it's no longer the "initial silent focus"
        populateTagSuggestions(tagsInput.value);
    });
    
    tagsOuterContainer.appendChild(tagSuggestionsDropdown); // ** NEW: Add dropdown to its container **

    // --- Footer ---
    const footer = document.createElement('div');
    // ... (footer styles) ...
    footer.style.cssText = `
        display: flex;
        justify-content: flex-end; /* Align buttons to the right */
        gap: 10px; /* Space between buttons */
        padding-top: 15px;
        border-top: 1px solid #3a3a3c;
    `;


    const cancelButton = document.createElement('button');
    // ... (cancelButton styles) ...
    cancelButton.textContent = 'Cancel';
    cancelButton.id = 'promptdrop-cancel-button';
    cancelButton.style.cssText = `
        padding: 8px 15px;
        border: 1px solid #555;
        border-radius: 6px;
        background-color: #3a3a3c;
        color: #f2f2f7;
        cursor: pointer;
        font-size: 14px;
    `;


    const saveButton = document.createElement('button');
    // ... (saveButton styles) ...
    saveButton.textContent = 'Save';
    saveButton.id = 'promptdrop-save-button';
    saveButton.style.cssText = `
        padding: 8px 15px;
        border: none;
        border-radius: 6px;
        background-color: #129d5e;
        color: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
    `;


    footer.appendChild(cancelButton);
    footer.appendChild(saveButton);

    // --- Assemble Modal ---
    modal.appendChild(header);
    modal.appendChild(titleLabel);
    modal.appendChild(titleInput);
    modal.appendChild(contentLabel);
    modal.appendChild(contentTextarea);
    modal.appendChild(tagsLabel);
    modal.appendChild(tagsOuterContainer);
    modal.appendChild(footer);

    modalContainer.appendChild(modal);
    document.body.appendChild(modalContainer);

    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) { // Clicked on the overlay
            hideTagSuggestions();
            // Optionally, you could also close the whole modal here:
            // document.body.removeChild(modalContainer);
        }
    });
    // Make sure clicking inside the modal content but outside interactable elements
    // also closes the dropdown if it's open.
    modal.addEventListener('click', (event) => {
        if (!tagsOuterContainer.contains(event.target) && tagSuggestionsDropdown.style.display === 'block') {
             hideTagSuggestions();
        }
    });

    function handleEscapeKey(event) {
        if (event.key === "Escape") {
            if (tagSuggestionsDropdown.style.display === 'block') {
                hideTagSuggestions();
                event.stopPropagation(); 
                event.preventDefault();  
                return; 
            }
            document.body.removeChild(modalContainer);
            document.removeEventListener('keydown', handleEscapeKey);
        }
    }
    document.addEventListener('keydown', handleEscapeKey);

    // --- Define savePrompt function INSIDE openSavePromptModal ---
    function savePrompt(title, content, tagsForPrompt) {
        chrome.storage.local.get({ prompts: [], tags: [] /* Ensure we also fetch existing global tags */ }, function (result) {
            const prompts = result.prompts;
            let existingGlobalTags = result.tags || []; // This is the list of all unique tags

            const newPrompt = {
                id: Date.now().toString(), // Add a unique ID for easier management later
                title: title,
                content: content,
                tags: tagsForPrompt // These are the tags for THIS prompt
            };
            prompts.push(newPrompt);

            // Update the global list of unique tags
            tagsForPrompt.forEach(tag => {
                if (!existingGlobalTags.includes(tag.toLowerCase())) { // Store global tags as lowercase
                    existingGlobalTags.push(tag.toLowerCase());
                }
            });
            existingGlobalTags.sort(); // Keep global tags sorted for consistency

            chrome.storage.local.set({ prompts: prompts, tags: existingGlobalTags }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error saving prompt:", chrome.runtime.lastError.message);
                    return;
                }
                console.log('Prompt saved:', newPrompt);
                console.log('Global tags updated:', existingGlobalTags);
                // We might want to trigger a refresh of the main popup list here if it's open
                // or send a message to it. For now, console log is fine.
            });
        });
    }
    // --- End of savePrompt function definition ---


    // --- Event Listeners ---
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', handleEscapeKey);
    });

    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', handleEscapeKey);
    });

    saveButton.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const content = contentTextarea.value.trim();
        const tagsToSave = [...currentPromptTags]; // Use the array of tags from pills
        if (!title) {
            alert("Please enter a title for the prompt.");
            titleInput.focus();
            return;
        }
        if (!content) {
            alert("Prompt content cannot be empty.");
            contentTextarea.focus();
            return;
        }

        savePrompt(title, content, tagsToSave); // Now savePrompt is defined in this scope
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', handleEscapeKey);
    });

    titleInput.focus();

} // --- End of openSavePromptModal function ---