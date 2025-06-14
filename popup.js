document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const promptList = document.getElementById('prompt-list');
    
    let globalPrompts = [];
    let globalPinnedPrompts = [];

    function loadPrompts() {
        chrome.storage.local.get({prompts: [], pinnedPrompts: []}, (data) => {
            globalPrompts = data.prompts;
            globalPinnedPrompts = data.pinnedPrompts || [];
            renderPrompts();
        });
    }

    function renderPromptItem(prompt, isPinned, promptList, searchInputElement, currentGlobalPrompts, currentGlobalPinnedPrompts, loadPromptsFunction, renderPromptsFunction) {
        const listItem = document.createElement('li');
        listItem.classList.add('prompt-item');
        if (isPinned) {
            listItem.classList.add('pinned');
        }

        const titleElement = document.createElement('div');
        titleElement.classList.add('prompt-title'); // Keep the class for existing styles

        const expandCollapseIcon = document.createElement('span');
        expandCollapseIcon.classList.add('expand-collapse-icon');
        expandCollapseIcon.textContent = '▶'; // Initial state: Expand (right arrow)
        const titleTextSpan = document.createElement('span');
        titleTextSpan.classList.add('prompt-title-text');
        titleTextSpan.textContent = prompt.title;

        titleElement.appendChild(titleTextSpan);
        titleElement.appendChild(expandCollapseIcon);

        const contentElement = document.createElement('div');
        contentElement.classList.add('prompt-content');
        contentElement.textContent = prompt.content;

        titleElement.addEventListener('click', () => {
            // We need to find the contentElement relative to this titleElement's listItem
            const parentItem = titleElement.closest('.prompt-item');
            if (parentItem) {
                const associatedContent = parentItem.querySelector('.prompt-content');
                if (associatedContent) {
                    const isHidden = associatedContent.style.display === 'none' || associatedContent.style.display === '';
                    if (isHidden) {
                        associatedContent.style.display = 'block';
                        expandCollapseIcon.textContent = '▼'; // Change to Collapse (down arrow)
                    } else {
                        associatedContent.style.display = 'none';
                        expandCollapseIcon.textContent = '▶'; // Change to Expand (right arrow)
                    }
                }
            }
        });

        let tagsElementContainer = null; // This will be the 'Tags: ' prefix and pill container
        if (prompt.tags && prompt.tags.length > 0) {
            tagsElementContainer = document.createElement('div');
            tagsElementContainer.classList.add('prompt-tags'); // Use existing class for overall styling

            const tagsLabelSpan = document.createElement('span');
            tagsLabelSpan.textContent = '';
            tagsElementContainer.appendChild(tagsLabelSpan);

            prompt.tags.forEach(tagText => {
                const tagPill = document.createElement('span');
                tagPill.textContent = tagText;
                tagPill.classList.add('tag-pill-display'); // Use class from popup.html CSS
                tagPill.style.cursor = 'pointer'; // Make it look clickable
                tagPill.title = `Search for tag: ${tagText}`;

                tagPill.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent click from bubbling to list item or title
                    searchInputElement.value = tagText; // Set search input value
                    
                    // Trigger re-render. Calling renderPromptsFn directly is cleaner.
                    if (renderPromptsFunction && typeof renderPromptsFunction === 'function') {
                        renderPromptsFunction();
                    } else {
                        // Fallback: simulate input event if direct function call isn't passed
                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                        searchInputElement.dispatchEvent(inputEvent);
                    }
                });
                tagsElementContainer.appendChild(tagPill);
            });
        }

        const buttonsElement = document.createElement('div');
        buttonsElement.classList.add('prompt-buttons');

        const copyButton = document.createElement('img');
        copyButton.src = 'icons/copy.png'; // Path to your copy icon relative to popup.html
                                        // Or use chrome.runtime.getURL('icons/copy.png') if you prefer,
                                        // but for extension pages, relative paths usually work.
        copyButton.alt = 'Copy'; // Alt text for accessibility
        copyButton.title = 'Copy prompt'; // Tooltip
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.content)
            .then(() => {
                copyButton.src = 'icons/copied.png'; 
                setTimeout(() => {
                    copyButton.src = 'icons/copy.png';
                }, 1500); // Revert after 1.5 seconds
            })
            .catch(err => {
                console.error('Failed to copy prompt: ', err);
            });
        });

        const pinButton = document.createElement('img');
        pinButton.src = isPinned ? `icons/unpin.png` : `icons/pin.png`; // Path to your pin icon
        pinButton.title = isPinned ? 'Unpin' : 'Pin'; // Tooltip
        pinButton.addEventListener('click', () => {
            if (isPinned) {
                globalPinnedPrompts = globalPinnedPrompts.filter(p => p !== prompt);
                globalPrompts.push(prompt);
            } else {
                globalPrompts = globalPrompts.filter(p => p !== prompt);
                globalPinnedPrompts.push(prompt);
            }

            chrome.storage.local.set({prompts: globalPrompts, pinnedPrompts: globalPinnedPrompts}, () => {
                loadPrompts();
            });
        });

        const editButton = document.createElement('img');
        editButton.src = 'icons/edit.png'; // Path to your edit icon
        editButton.alt = 'Edit';
        editButton.title = 'Edit prompt';

        const currentPromptIdForEdit = prompt.id;
        const currentPromptTitleForEdit = prompt.title;

        editButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent title click event from firing
    
            // Send message to background script to open edit modal
            chrome.runtime.sendMessage({
                action: 'editPrompt',
                promptId: currentPromptIdForEdit // Pass the unique ID of the prompt to edit
            });
    
            window.close(); // Close the popup after sending the edit request
        });

        const deleteButton = document.createElement('img');
        deleteButton.src = `icons/delete.png`; // Path to your delete icon
        deleteButton.title = 'Delete'; // Tooltip
        deleteButton.addEventListener('click', async () => {
            try {
                const confirmed = await showConfirmDialog("Are you sure you want to delete this prompt?");
                if (confirmed) {
                    if (!prompt || !prompt.id) {
                        alert("Error: This prompt cannot be deleted (missing ID).");
                        return;
                    }
                    if (isPinned) {
                        globalPinnedPrompts = globalPinnedPrompts.filter(p => p.id !== prompt.id);
                    } else {
                        globalPrompts = globalPrompts.filter(p => p.id !== prompt.id);
                    }
        
                    chrome.storage.local.set({prompts: globalPrompts, pinnedPrompts: globalPinnedPrompts}, () => {
                        loadPrompts();
                    });
                }
            } catch (err) {
                alert("An error occurred while deleting the prompt.");
            }
        });

        buttonsElement.appendChild(copyButton);
        buttonsElement.appendChild(pinButton);
        buttonsElement.appendChild(editButton);
        buttonsElement.appendChild(deleteButton);

        const footerRow = document.createElement('div');
        footerRow.classList.add('prompt-footer-row');

        listItem.appendChild(titleElement);
        listItem.appendChild(contentElement);
        if (tagsElementContainer) { 
            footerRow.appendChild(tagsElementContainer);
        }
        footerRow.appendChild(buttonsElement);
        listItem.appendChild(footerRow);

        promptList.appendChild(listItem);
    }

    function showConfirmDialog(message) {
        return new Promise((resolve) => {
            const dialog = document.getElementById('confirm-dialog');
            const msg = document.getElementById('confirm-dialog-message');
            msg.textContent = message;
    
            dialog.returnValue = ''; // Reset
            dialog.showModal();
    
            dialog.addEventListener('close', function handler() {
                dialog.removeEventListener('close', handler);
                resolve(dialog.returnValue === 'yes');
            });
        });
    }

    function renderPrompts() {
        promptList.innerHTML = '';

        const searchTerm = searchInput.value.toLowerCase();

        const filteredPinnedPrompts = globalPinnedPrompts.filter(prompt =>
            prompt.title.toLowerCase().includes(searchTerm) ||
            prompt.content.toLowerCase().includes(searchTerm) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );

        try {
            filteredPinnedPrompts.forEach(prompt => {
                renderPromptItem(prompt, true, promptList, searchInput, globalPrompts, globalPinnedPrompts, loadPrompts, renderPrompts);
            });
        } catch (error) {
            console.error("Error rendering pinned prompts:", error);
        }

        const filteredPrompts = globalPrompts.filter(prompt =>
            !globalPinnedPrompts.includes(prompt) && (
                prompt.title.toLowerCase().includes(searchTerm) ||
                prompt.content.toLowerCase().includes(searchTerm) ||
                prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            )
        );

        
        if (filteredPinnedPrompts.length > 0 && filteredPrompts.length > 0) { // ** MODIFIED: Check filteredPrompts as well **
            const separator = document.createElement('li');
            separator.className = 'pinned-separator'; 
            separator.textContent = ''; // Or just '---' or keep empty and use CSS border
            // separator.style.textAlign = 'center'; // Remove inline style, use CSS class
            promptList.appendChild(separator);
        }

        filteredPrompts.forEach(prompt => {
            renderPromptItem(prompt, false, promptList, searchInput, globalPrompts, globalPinnedPrompts, loadPrompts, renderPrompts);
        });
        
        if (filteredPinnedPrompts.length === 0 && filteredPrompts.length === 0) {
            const noPromptsMessage = document.createElement('p');
            noPromptsMessage.textContent = 'No prompts found.';
            promptList.appendChild(noPromptsMessage);

            // Only show the external search link if there was an actual search term entered
            if (searchTerm !== "") {
                const searchExternalContainer = document.createElement('div');
                searchExternalContainer.style.textAlign = 'center'; // Center the link
                searchExternalContainer.style.marginTop = '10px'; // Add some space

                const searchExternalText = document.createElement('span');
                searchExternalText.textContent = 'Search the ';
                
                const searchExternalLink = document.createElement('a');
                searchExternalLink.textContent = 'Prompt Index';
                // Encode the search term for use in a URL
                const encodedSearchTerm = encodeURIComponent(searchTerm);
                searchExternalLink.href = `https://www.thepromptindex.com/prompt-database.php?search=${encodedSearchTerm}`;
                searchExternalLink.target = '_blank'; // Open in a new tab
                searchExternalLink.title = `Search for "${searchTerm}" on The Prompt Index`;
                // Style the link to fit the dark theme
                searchExternalLink.style.color = '#0a84ff'; // Prominent link color (iOS blue)
                searchExternalLink.style.textDecoration = 'underline';

                searchExternalContainer.appendChild(searchExternalText);
                searchExternalContainer.appendChild(searchExternalLink);
                promptList.appendChild(searchExternalContainer);
            }
        }

    }
    
    searchInput.addEventListener('input', renderPrompts);
    loadPrompts();
});