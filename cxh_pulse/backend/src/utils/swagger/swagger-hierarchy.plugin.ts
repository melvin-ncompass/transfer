export class SwaggerHierarchyPlugin {
  
  static getHierarchyScript(tags: Record<string, string>): string {
    const scriptBody = function (tagDescriptions: Record<string, string>) {
      const createHierarchy = () => {
        const separator = '/';
        const allSections = document.querySelectorAll('.opblock-tag-section') as NodeListOf<HTMLElement>;
        const searchInput = document.querySelector('.swagger-ui .filter input') || document.querySelector('.operation-filter-input');
        const isFiltering = searchInput && (searchInput as HTMLInputElement).value.trim().length > 0;

        let currentRootFolder: HTMLElement | null = null;
        let currentSubFolder: HTMLElement | null = null;
        let currentRootFolderPath = '';
        let currentSubFolderPath = '';

        allSections.forEach((section) => {
          const tagLink = section.querySelector('.opblock-tag a span') as HTMLElement;
          if (!tagLink) return;

          const fullTagName = tagLink.getAttribute('data-full-tag') || tagLink.innerText.trim();
          if (!tagLink.getAttribute('data-full-tag')) {
            tagLink.setAttribute('data-full-tag', fullTagName);
          }

          if (!fullTagName.includes(separator)) {
            currentRootFolder = null;
            currentSubFolder = null;
            currentRootFolderPath = '';
            currentSubFolderPath = '';
            section.style.display = ''; 
            return;
          }

          const parts = fullTagName.split(separator).map((p) => p.trim());
          const rootFolderName = parts[0];
          // If depth > 2, we have a sub-folder (e.g. Business/Dashboard/Forecast)
          // parts[0]=Business, parts[1]=Dashboard, parts[2]=Forecast
          const hasSubFolder = parts.length > 2;
          const subFolderName = hasSubFolder ? parts[1] : null;
          const leafName = parts[parts.length - 1];

          // 1. Rename Tag
          if (tagLink.innerText !== leafName) {
             tagLink.innerText = leafName;
          }

          // 2. Root Folder
          if (currentRootFolderPath !== rootFolderName) {
             currentRootFolderPath = rootFolderName;
             // Reset sub folder when root changes
             currentSubFolder = null;
             currentSubFolderPath = '';

             const folderId = 'folder-' + rootFolderName.replace(/\s+/g, '-').toLowerCase();
             let header = document.querySelector(`#${folderId}`) as HTMLElement;
             
             if (!header || header.nextElementSibling !== section) {
                if (header) header.remove();
                const folderDesc = tagDescriptions[rootFolderName] || "";
                const descHtml = folderDesc ? `<small class="folder-description">${folderDesc}</small>` : "";

                header = document.createElement('div');
                header.id = folderId;
                header.className = 'folder-header nav-folder-header'; // Uses the Red/Brand style
                header.dataset.path = rootFolderName;
                header.innerHTML = `
                    <div class="folder-text-container">
                      <span class="folder-title">${rootFolderName}</span>
                      ${descHtml}
                    </div>
                    <span class="folder-arrow">
                      <svg width="20" height="20"><use href="#large-arrow"></use></svg>
                    </span>
                `;
                header.onclick = () => {
                   header.classList.toggle('is-open');
                   setTimeout(createHierarchy, 10);
                };
                section.parentElement?.insertBefore(header, section);
             }
             currentRootFolder = header;
          }

          // 3. Sub Folder
          if (hasSubFolder && subFolderName) {
             const subPath = rootFolderName + '/' + subFolderName;
             if (currentSubFolderPath !== subPath) {
               currentSubFolderPath = subPath;
               
               const subFolderId = 'subfolder-' + subPath.replace(/[\/\s]+/g, '-').toLowerCase();
               let subHeader = document.querySelector(`#${subFolderId}`) as HTMLElement;

               if (!subHeader || subHeader.nextElementSibling !== section) {
                  if (subHeader) subHeader.remove();
                  
                  const subDesc = tagDescriptions[subPath] || "";
                  const subDescHtml = subDesc ? `<small class="folder-description">${subDesc}</small>` : "";

                  subHeader = document.createElement('div');
                  subHeader.id = subFolderId;
                  subHeader.className = 'sub-folder-header hierarchy-indented'; // Uses the new Gray style and indentation
                  subHeader.dataset.path = subPath;
                  subHeader.innerHTML = `
                      <div class="folder-text-container">
                        <span class="folder-title">${subFolderName}</span>
                        ${subDescHtml}
                      </div>
                      <span class="folder-arrow">
                        <svg width="18" height="18"><use href="#large-arrow"></use></svg>
                      </span>
                  `;
                  subHeader.onclick = () => {
                    subHeader.classList.toggle('is-open');
                     setTimeout(createHierarchy, 10);
                  };
                  section.parentElement?.insertBefore(subHeader, section);
               }
               currentSubFolder = subHeader;
             }
          } else {
             // If we switched from a sub-folder item to a direct item (Business/Config), clear sub
             if (currentSubFolderPath !== '') {
               currentSubFolder = null;
               currentSubFolderPath = '';
             }
          }

          // 4. Indentation & Styling
          if (!section.classList.contains('hierarchy-indented')) {
            section.classList.add('hierarchy-indented');
          }
          
          // Use data attribute control for robust CSS styling (prevents jumps)
          const targetLevel = currentSubFolder ? '2' : '1';
          if (section.dataset.level !== targetLevel) {
              section.dataset.level = targetLevel;
          }

          // 5. Visibility Logic
          const isRootOpen = currentRootFolder && currentRootFolder.classList.contains('is-open');
          const isSubOpen = currentSubFolder && currentSubFolder.classList.contains('is-open');

          if (isFiltering) {
             // Force Open visual states
             if (currentRootFolder) currentRootFolder.classList.add('is-open');
             if (currentSubFolder) currentSubFolder.classList.add('is-open');
             
             // Show everything
             if (currentRootFolder) currentRootFolder.style.display = '';
             if (currentSubFolder) currentSubFolder.style.display = '';
             section.style.display = '';
          } else {
             // Normal State
             if (!isRootOpen) {
                 // Root closed: Hide Sub and Section
                 if (currentSubFolder) currentSubFolder.style.display = 'none';
                 section.style.display = 'none';
             } else {
                 // Root open: Show Sub
                 if (currentSubFolder) currentSubFolder.style.display = '';
                 
                 // Check Sub state
                 if (currentSubFolder) {
                    if (isSubOpen) {
                       section.style.display = '';
                    } else {
                       section.style.display = 'none';
                    }
                 } else {
                    // Directly under root
                    section.style.display = '';
                 }
             }
          }
        });
      };
      

      let timeout: any;
      const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(createHierarchy, 150);
      });

      observer.observe(document.body, { childList: true, subtree: true });
    };

    return `(${scriptBody.toString()})(${JSON.stringify(tags)});`;
  }
}