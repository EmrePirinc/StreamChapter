let isRunning = false;
let shouldStop = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'startChaptering') {
    startChapteringProcess(message.data);
  } else if (message.type === 'stopChaptering') {
    shouldStop = true;
    isRunning = false;
    chrome.storage.local.set({ isRunning: false });
  }
});

async function startChapteringProcess({ chapters, settings, tabId }) {
  isRunning = true;
  shouldStop = false;
  
  await chrome.storage.local.set({ 
    isRunning: true, 
    progress: { current: 0, total: chapters.length } 
  });

  for (let i = 0; i < chapters.length; i++) {
    if (shouldStop) {
      sendToPopup({ type: 'log', data: { text: 'İşlem kullanıcı tarafından durduruldu', level: 'warning' } });
      break;
    }

    const chapter = chapters[i];
    
    // Update progress
    const progress = { current: i + 1, total: chapters.length, currentTitle: chapter.title };
    await chrome.storage.local.set({ progress });
    sendToPopup({ type: 'progress', data: progress });
    sendToPopup({ type: 'log', data: { text: `[${i + 1}/${chapters.length}] İşleniyor: ${chapter.title}`, level: 'info' } });

    try {
      // Execute the chapter adding script
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: addChapter,
        args: [chapter, settings]
      });

      if (result[0]?.result?.success) {
        sendToPopup({ type: 'log', data: { text: `✓ Eklendi: ${chapter.title}`, level: 'success' } });
      } else {
        sendToPopup({ type: 'log', data: { text: `✗ Hata: ${result[0]?.result?.error || 'Bilinmeyen hata'}`, level: 'error' } });
      }
    } catch (error) {
      sendToPopup({ type: 'log', data: { text: `✗ Script hatası: ${error.message}`, level: 'error' } });
    }

    // Wait between chapters
    await sleep(500);
  }

  isRunning = false;
  await chrome.storage.local.set({ isRunning: false });
  sendToPopup({ type: 'complete' });
}

function sendToPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might be closed, ignore error
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// This function runs in the page context
function addChapter(chapter, settings) {
  return new Promise(async (resolve) => {
    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    // Time format validation
    const validateTime = (timeStr) => {
      const parts = timeStr.split(':').map(Number);
      if (parts.length > 3) return { valid: false, error: "4 haneli format" };
      const seconds = parts[parts.length - 1];
      const minutes = parts.length > 1 ? parts[parts.length - 2] : 0;
      if (seconds >= 60) return { valid: false, error: "Saniye >= 60" };
      if (minutes >= 60) return { valid: false, error: "Dakika >= 60" };
      return { valid: true };
    };

    // Convert time to seconds
    const timeToSeconds = (timeStr) => {
      const parts = timeStr.split(':').map(Number);
      if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
      if (parts.length === 2) return (parts[0] * 60) + parts[1];
      return 0;
    };

    // Write title to textarea
    const writeTitle = async (element, value) => {
      if (!element) return;
      element.focus();
      element.click();
      await wait(50);
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeSetter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
    };

    try {
      // Validate time format
      const timeCheck = validateTime(chapter.time);
      if (!timeCheck.valid) {
        resolve({ success: false, error: `Hatalı zaman formatı: ${timeCheck.error}` });
        return;
      }

      // Find video player
      const videoPlayer = document.querySelector('video');
      if (!videoPlayer) {
        resolve({ success: false, error: 'Video oynatıcı bulunamadı' });
        return;
      }

      // Seek video
      const seconds = timeToSeconds(chapter.time);
      videoPlayer.currentTime = seconds;
      await wait(settings.videoSeek);

      // Find "New Chapter" button
      const buttons = Array.from(document.querySelectorAll('button'));
      const newChapterBtn = buttons.find(b => {
        const text = (b.innerText || "").toLowerCase();
        const label = (b.getAttribute('aria-label') || "").toLowerCase();
        const hasAddIcon = b.querySelector('i[data-icon-name="Add"]');
        return text.includes("yeni bölüm") || text.includes("new chapter") || 
               label.includes("yeni bölüm") || label.includes("new chapter") || hasAddIcon;
      });

      if (!newChapterBtn) {
        resolve({ success: false, error: 'Yeni Bölüm butonu bulunamadı' });
        return;
      }

      newChapterBtn.click();
      await wait(settings.buttonClick);

      // Find title textarea
      const titleBox = document.querySelector('textarea[data-automation-id^="OnePlayer-Chaptering-ChapterTitleEdit"]');
      if (!titleBox) {
        resolve({ success: false, error: 'Başlık kutusu bulunamadı' });
        return;
      }

      await writeTitle(titleBox, chapter.title);
      await wait(300);

      // Find save button
      let saveBtn = null;
      let currentElement = titleBox;
      
      for (let k = 0; k < 10; k++) {
        if (!currentElement) break;
        currentElement = currentElement.parentElement;
        if (currentElement) {
          const checkIcon = currentElement.querySelector('i[data-icon-name="CheckMark"]');
          if (checkIcon) {
            saveBtn = checkIcon.closest('button');
            if (saveBtn) break;
          }
        }
      }

      if (!saveBtn) {
        const allChecks = Array.from(document.querySelectorAll('i[data-icon-name="CheckMark"]'));
        const visibleCheck = allChecks.filter(i => i.offsetParent !== null).pop();
        if (visibleCheck) saveBtn = visibleCheck.closest('button');
      }

      if (saveBtn) {
        saveBtn.click();
        await wait(settings.save);
        resolve({ success: true });
      } else {
        resolve({ success: false, error: 'Kaydet butonu bulunamadı' });
      }

    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}