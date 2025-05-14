document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const promptList = document.getElementById('prompt-list');

    let prompts = [];
    let pinnedPrompts = [];

    function loadPrompts() {
        chrome.storage.local.get({prompts: [], pinnedPrompts: []}, (data) => {
            prompts = data.prompts;
            pinnedPrompts = data.pinnedPrompts || [];
            renderPrompts();
        });
    }

    function renderPrompts() {
        promptList.innerHTML = '';

        const searchTerm = searchInput.value.toLowerCase();

        const filteredPinnedPrompts = pinnedPrompts.filter(prompt =>
            prompt.title.toLowerCase().includes(searchTerm) ||
            prompt.content.toLowerCase().includes(searchTerm) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );

        try {
            filteredPinnedPrompts.forEach(prompt => {
                renderPromptItem(prompt, true, promptList, searchTerm, prompts, pinnedPrompts, loadPrompts);
            });
        } catch (error) {
            console.error("Error rendering pinned prompts:", error);
        }

        if (filteredPinnedPrompts.length > 0 && (prompts.length - pinnedPrompts.length > 0)) {
            const separator = document.createElement('li');
            separator.textContent = '---';
            separator.style.textAlign = 'center';
            promptList.appendChild(separator);
        }

        const filteredPrompts = prompts.filter(prompt =>
            !pinnedPrompts.includes(prompt) && (
                prompt.title.toLowerCase().includes(searchTerm) ||
                prompt.content.toLowerCase().includes(searchTerm) ||
                prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            )
        );

        try {
            filteredPrompts.forEach(prompt => {
                renderPromptItem(prompt, false, promptList, searchTerm, prompts, pinnedPrompts, loadPrompts);
            });
        } catch (error) {
            console.error("Error rendering regular prompts:", error);
        }
    }

    function renderPromptItem(prompt, isPinned, promptList, searchTerm, prompts, pinnedPrompts, loadPrompts) {
        const listItem = document.createElement('li');
        listItem.classList.add('prompt-item');
        if (isPinned) {
            listItem.classList.add('pinned');
        }

        const titleElement = document.createElement('div');
        titleElement.classList.add('prompt-title');
        titleElement.textContent = prompt.title;
        titleElement.addEventListener('click', () => {
            const contentElement = listItem.querySelector('.prompt-content'); // Find content within this item
            contentElement.style.display = contentElement.style.display === 'none' ? 'block' : 'none';
        });

        const contentElement = document.createElement('div');
        contentElement.classList.add('prompt-content');
        contentElement.textContent = prompt.content;

        const tagsElement = document.createElement('div');
        tagsElement.classList.add('prompt-tags');
        tagsElement.textContent = 'Tags: ' + prompt.tags.join(', ');

        const buttonsElement = document.createElement('div');
        buttonsElement.classList.add('prompt-buttons');

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.content)
                .then(() => {
                    console.log('Prompt copied to clipboard');
                })
                .catch(err => {
                    console.error('Failed to copy prompt: ', err);
                });
        });

        const pinButton = document.createElement('img');
        pinButton.src = `icons/pin.svg`; // Path to your pin icon
        pinButton.style.width = '16px'; // Adjust size as needed
        pinButton.style.height = '16px';
        pinButton.style.cursor = 'pointer';
        pinButton.title = isPinned ? 'Unpin' : 'Pin'; // Tooltip
        pinButton.addEventListener('click', () => {
            if (isPinned) {
                pinnedPrompts = pinnedPrompts.filter(p => p !== prompt);
                prompts.push(prompt);
            } else {
                prompts = prompts.filter(p => p !== prompt);
                pinnedPrompts.push(prompt);
            }

            chrome.storage.local.set({prompts: prompts, pinnedPrompts: pinnedPrompts}, () => {
                loadPrompts();
            });
        });

        const deleteButton = document.createElement('img');
        deleteButton.src = `icons/delete.png`; // Path to your delete icon
        deleteButton.style.width = '16px'; // Adjust size as needed
        deleteButton.style.height = '16px';
        deleteButton.style.cursor = 'pointer';
        deleteButton.title = 'Delete'; // Tooltip
        deleteButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this prompt?")) {
                if (isPinned) {
                    pinnedPrompts = pinnedPrompts.filter(p => p !== prompt);
                } else {
                    prompts = prompts.filter(p => p !== prompt);
                }

                chrome.storage.local.set({prompts: prompts, pinnedPrompts: pinnedPrompts}, () => {
                    loadPrompts();
                });
            }
        });

        buttonsElement.appendChild(copyButton);
        buttonsElement.appendChild(pinButton);
        buttonsElement.appendChild(deleteButton);

        listItem.appendChild(titleElement);
        listItem.appendChild(contentElement);
        listItem.appendChild(tagsElement);
        listItem.appendChild(buttonsElement);

        promptList.appendChild(listItem);
    }

    loadPrompts();

    searchInput.addEventListener('input', () => {
        renderPrompts();
    });
});