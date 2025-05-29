chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background: Message received:', message);
    console.log('Background: Sender details:', sender); // Keep this for now, useful for other message types

    if (message.action === 'editPrompt') {
        console.log('Background: EditPrompt action recognized for ID:', message.promptId);
        chrome.storage.local.get({prompts: []}, (data) => {
            console.log('Background: Prompts from storage:', data.prompts);
            const promptToEdit = data.prompts.find(p => p.id === message.promptId);
            console.log('Background: Found promptToEdit:', promptToEdit);

            if (promptToEdit) {
                // ** MODIFIED: Directly use chrome.tabs.query to get the active tab **
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    if (tabs && tabs.length > 0 && tabs[0].id) {
                        const activeTabId = tabs[0].id;
                        console.log('Background: Injecting script into active tab ID:', activeTabId);
                        chrome.scripting.executeScript({
                            target: {tabId: activeTabId},
                            function: openSavePromptModal,
                            args: [promptToEdit.content, promptToEdit] // Pass content and full prompt object
                        }, (injectionResults) => {
                            if (chrome.runtime.lastError) {
                                console.error('Background: Script injection failed:', chrome.runtime.lastError.message);
                            } else if (injectionResults && injectionResults.length > 0) {
                                console.log('Background: Script injected successfully:', injectionResults);
                            } else {
                                console.log('Background: Script injection completed, but no results array returned (might be okay).');
                            }
                        });
                    } else {
                        console.error('Background: No active tab found to inject script.');
                        // Optionally, inform the user through an alert or notification if appropriate,
                        // though since the popup closes, this might be tricky.
                        // For now, an error log is sufficient.
                    }
                });
            } else {
                console.error("Background: Prompt not found for editing:", message.promptId);
            }
        });
        return true; // Indicates asynchronous response will be sent (or channel kept open)
    }
    // Handle other message actions here if you add more later
});

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
function openSavePromptModal(selectedText, promptToEdit = null) {
    if (document.getElementById('promptdrop-modal-container')) {
        document.getElementById('promptdrop-modal-container').focus();
        return;
    }

    const isEditMode = (promptToEdit !== null);

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
    modalTitle.textContent = isEditMode ? 'Edit prompt' : 'Save new prompt';
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
    if (isEditMode) {
        titleInput.value = promptToEdit.title || '';
    }
    titleInput.style.cssText = `
        width: 100%;
        padding: 10px;
        border: 1px solid #3a3a3c;
        border-radius: 6px;
        background-color: #3a3a3c; /* Slightly lighter input background */
        color: #f2f2f7;
        box-sizing: border-box; /* Important for padding and width */
        font-size: 14px;
        font-family: inherit;
    `;


    // --- Prompt Content Field (Editable) ---
    const contentLabel = document.createElement('label');
    // ... (contentLabel styles) ...
    contentLabel.textContent = 'PROMPT';
    contentLabel.style.cssText = `font-size: 12px; color: #8e8e93; font-weight: 500; margin-top: 20px;`;


    const contentTextarea = document.createElement('textarea');
    // ... (contentTextarea styles) ...
    contentTextarea.id = 'promptdrop-content-textarea';
    contentTextarea.value = isEditMode ? promptToEdit.content : selectedText;
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
        font-family: inherit;
    `;


    // --- Tags Field ---
    const tagsLabel = document.createElement('label');
    // ... (tagsLabel styles) ...
    tagsLabel.textContent = 'TAGS';
    tagsLabel.style.cssText = `font-size: 12px; color: #8e8e93; font-weight: 500; margin-top: 20px;`;

    const tagsOuterContainer = document.createElement('div');
    tagsOuterContainer.style.position = 'relative';

    const tagsContainer = document.createElement('div');
    tagsContainer.id = 'promptdrop-tags-pills-container';
    tagsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 8px;
        border: 1px solid #3a3a3c;
        border-radius: 6px;
        background-color: #3a3a3c;
        gap: 5px; /* Gap between pills and input */
        font-family: inherit;
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
        font-family: inherit;
    `;

    let currentPromptTags = [];
    
    createTagPill = (tagText) => {
        console.log(`createTagPill called with: "${tagText}"`); // DEBUG
        if (!tagText) {
            console.log('createTagPill: tagText is empty, returning.'); // DEBUG
            return;
        }
        // Convert to lowercase for checking duplicates and storing
        const lowerTagText = tagText.toLowerCase();

        if (currentPromptTags.includes(lowerTagText)) {
            console.log(`createTagPill: tag "${lowerTagText}" already exists in currentPromptTags.`); // DEBUG
            return;
        }

        const pill = document.createElement('div');
        pill.classList.add('promptdrop-tag-pill');
        pill.textContent = tagText; // Display original casing
        // ... (pill styling) ...
        pill.style.cssText = `
            background-color: #505054; color: #f2f2f7; padding: 4px 8px; border-radius: 12px;
            font-size: 13px; display: flex; align-items: center; gap: 5px;
        `;

        const removePillButton = document.createElement('span');
        // ... (removePillButton setup) ...
        removePillButton.innerHTML = '×';
        removePillButton.style.cssText = `cursor: pointer; font-weight: bold; margin-left: 3px;`;

        removePillButton.onclick = () => {
            tagsContainer.removeChild(pill);
            currentPromptTags = currentPromptTags.filter(t => t !== lowerTagText); // Compare with lowercase
            console.log('Tag removed, currentPromptTags:', [...currentPromptTags]); // DEBUG

            if (currentPromptTags.length === 0) {
                tagsInput.placeholder = 'Add tags...';
            }

            populateTagSuggestions(tagsInput.value);
        };

        pill.appendChild(removePillButton);

        if (tagsContainer && tagsInput) { // Ensure parent and sibling exist
            tagsContainer.insertBefore(pill, tagsInput);
            currentPromptTags.push(lowerTagText); // Store lowercase
            console.log(`Pill for "${tagText}" created. currentPromptTags:`, [...currentPromptTags]); // DEBUG

            if (currentPromptTags.length === 1) { // Or just check > 0 after push
                tagsInput.placeholder = ''; // Or "Add more tags..."
            }

        } else {
            console.error('createTagPill: tagsContainer or tagsInput not found in DOM!'); // DEBUG
        }
    };

    let selectedSuggestionIndex = -1; // -1 means no suggestion is selected

    function highlightSuggestion(index) {
        const suggestions = tagSuggestionsDropdown.querySelectorAll('div'); // Get all suggestion items
        suggestions.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = '#505054'; // Highlight color
                item.classList.add('suggestion-active'); // Add a class for potential further styling
            } else {
                item.style.backgroundColor = 'transparent'; // Default background
                item.classList.remove('suggestion-active');
            }
        });
    }

    tagsInput.addEventListener('keydown', (event) => {
        const suggestions = tagSuggestionsDropdown.querySelectorAll('div'); // Get current suggestion items
        const suggestionsVisible = tagSuggestionsDropdown.style.display === 'block' && suggestions.length > 0;

        if (suggestionsVisible) {
            if (event.key === 'ArrowDown') {
                event.preventDefault(); // Prevent cursor from moving in input
                selectedSuggestionIndex++;
                if (selectedSuggestionIndex >= suggestions.length) {
                    selectedSuggestionIndex = 0; // Wrap around to the top
                }
                highlightSuggestion(selectedSuggestionIndex);
                suggestions[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' }); // Ensure visible
            } else if (event.key === 'ArrowUp') {
                event.preventDefault(); // Prevent cursor from moving in input
                selectedSuggestionIndex--;
                if (selectedSuggestionIndex < 0) {
                    selectedSuggestionIndex = suggestions.length - 1; // Wrap around to the bottom
                }
                highlightSuggestion(selectedSuggestionIndex);
                suggestions[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' }); // Ensure visible
            } else if (event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission or newline
                if (selectedSuggestionIndex > -1 && suggestions[selectedSuggestionIndex]) {
                    // If a suggestion is highlighted, use it
                    const selectedTagText = suggestions[selectedSuggestionIndex].textContent;
                    createTagPill(selectedTagText);
                    tagsInput.value = '';
                    hideTagSuggestions();
                    selectedSuggestionIndex = -1; // Reset selection
                    // populateTagSuggestions(''); // Refresh, or let input event handle if needed
                } else {
                    // If no suggestion highlighted, but text in input, create pill from input
                    const tagText = tagsInput.value.trim();
                    if (tagText) {
                        createTagPill(tagText);
                        tagsInput.value = '';
                        hideTagSuggestions(); // Also hide if Enter creates a tag from input
                        selectedSuggestionIndex = -1;
                        // populateTagSuggestions('');
                    }
                }
            } else if (event.key === 'Escape') {
                hideTagSuggestions();
                selectedSuggestionIndex = -1; // Reset selection
            }
        } else { // Suggestions are NOT visible
            if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                const tagText = tagsInput.value.trim();
                if (tagText) {
                    createTagPill(tagText);
                    tagsInput.value = '';
                    // If suggestions were meant to open on comma/enter, call populate here
                    // populateTagSuggestions(''); 
                }
            } else if (event.key === 'Escape') {
                // If modal is closable by escape and not just suggestions:
                // This part is handled by the global escape listener if present.
            }
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
        font-family: inherit; 
        font-size: 14px;
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
                noMatchItem.style.cssText = `padding: 8px 10px; color: #8e8e93; font-style: italic; font-family: inherit;`;
                tagSuggestionsDropdown.appendChild(noMatchItem);
            }

            selectedSuggestionIndex = -1; 
            highlightSuggestion(-1);

            filteredTags.forEach((tag, index) => { // Add index parameter
                const suggestionItem = document.createElement('div');
                suggestionItem.textContent = tag;
                suggestionItem.style.cssText = `padding: 8px 10px; cursor: pointer; color: #f2f2f7; font-family: inherit;`;
                // Set an ID or data-attribute for easier selection if needed, though querySelectorAll('div') is simple enough here
                // suggestionItem.dataset.index = index; 

                suggestionItem.onmouseover = () => { 
                    // Optional: Update selectedSuggestionIndex on mouse hover too, and highlight
                    // selectedSuggestionIndex = index; 
                    // highlightSuggestion(index);
                    suggestionItem.style.backgroundColor = '#505054'; // Keep simple hover style
                };
                suggestionItem.onmouseout = () => { 
                    // If not the keyboard selected one, revert
                    // if (index !== selectedSuggestionIndex) {
                    //    suggestionItem.style.backgroundColor = 'transparent';
                    // }
                    // For simplicity, keyboard highlight overrides mouseout for the active item
                    if (!suggestionItem.classList.contains('suggestion-active')) {
                         suggestionItem.style.backgroundColor = 'transparent';
                    }
                };
                
                suggestionItem.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    createTagPill(tag);
                    tagsInput.value = '';
                    hideTagSuggestions();
                    selectedSuggestionIndex = -1; // Reset
                    tagsInput.focus();
                });
                tagSuggestionsDropdown.appendChild(suggestionItem);
            });

            //if (filteredTags.length > 0 || (filteredTags.length === 0 && filterText)) {
            if (tagSuggestionsDropdown.childElementCount > 0) {
                tagSuggestionsDropdown.style.display = 'block';
            } else {
                tagSuggestionsDropdown.style.display = 'none';
            }
        });
    }

    function hideTagSuggestions() {
        tagSuggestionsDropdown.style.display = 'none';
    }
    
    hideTagSuggestions = () => { tagSuggestionsDropdown.style.display = 'none'; }; // Redefine as arrow function

    let firstFocus = true;
    
    tagsInput.addEventListener('focus', () => {
        clearTimeout(suggestionHideTimeout); 
        if (firstFocus) { 
            firstFocus = false; // Set flag so it doesn't run again on this modal instance
            return; // Don't populate on the very first programmatic focus
        }
        populateTagSuggestions(tagsInput.value);
    });

    tagsInput.addEventListener('input', () => {
        firstFocus = false; // If user types, it's no longer the "initial silent focus"
        populateTagSuggestions(tagsInput.value);
    });
    
    tagsOuterContainer.appendChild(tagSuggestionsDropdown); 

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

    function savePrompt(title, content, tagsForPrompt, originalPromptId = null) {
        chrome.storage.local.get({ prompts: [], tags: [] /* Ensure we also fetch existing global tags */ }, function (result) {
            const prompts = result.prompts;
            let existingGlobalTags = result.tags || []; // This is the list of all unique tags

            const newPromptData = { // Data for the new/updated prompt
                title: title,
                content: content,
                tags: tagsForPrompt
            };

            if (originalPromptId) { // ** EDIT MODE: Find and update existing prompt **
                const index = prompts.findIndex(p => p.id === originalPromptId);
                if (index !== -1) {
                    // Merge existing properties with new data
                    prompts[index] = { ...prompts[index], ...newPromptData };
                    // Ensure tags are completely replaced (not merged)
                    prompts[index].tags = tagsForPrompt;
                    console.log('Prompt updated:', prompts[index]);
                } else {
                    console.error("Attempted to update a prompt that doesn't exist (ID:", originalPromptId, "). Saving as new.");
                    newPromptData.id = Date.now().toString(); // Assign new ID if pushed as new
                    prompts.push(newPromptData);
                }
            } else { // ** NEW SAVE MODE: Create a new prompt **
                newPromptData.id = Date.now().toString(); // Assign new unique ID
                prompts.push(newPromptData);
                console.log('New prompt saved:', newPromptData);
            }

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

        savePrompt(title, content, tagsToSave, isEditMode ? promptToEdit.id : null);
        document.body.removeChild(modalContainer);
        document.removeEventListener('keydown', handleEscapeKey);
    });

    if (isEditMode && promptToEdit.tags && promptToEdit.tags.length > 0) {
        console.log(`Edit Mode: Pre-populating tags for prompt ID ${promptToEdit.id}:`, promptToEdit.tags);
        promptToEdit.tags.forEach(tag => {
            console.log(`Edit Mode: Attempting to create pill for tag: "${tag}"`);
            createTagPill(tag); // This function should add to currentPromptTags and DOM
        });
        console.log(`Edit Mode: currentPromptTags after pre-population:`, [...currentPromptTags]); // Log a copy
    } else if (isEditMode) {
        console.log(`Edit Mode: Prompt ID ${promptToEdit.id} has no tags to pre-populate.`);
    }

    titleInput.focus();

} // --- End of openSavePromptModal function ---