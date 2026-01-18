document.addEventListener('DOMContentLoaded', async () => {
  const jsonInput = document.getElementById('jsonInput');
  const validateBtn = document.getElementById('validateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  const validationResult = document.getElementById('validationResult');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const progressSection = document.getElementById('progressSection');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const currentChapter = document.getElementById('currentChapter');
  const logContainer = document.getElementById('logContainer');
  const videoSeekDelay = document.getElementById('videoSeekDelay');
  const buttonClickDelay = document.getElementById('buttonClickDelay');
  const saveDelay = document.getElementById('saveDelay');
  const presetBtns = document.querySelectorAll('.preset-btn');

  const SPEED_PRESETS = {
    fast: { videoSeek: 1500, buttonClick: 1000, save: 1500 },
    normal: { videoSeek: 2500, buttonClick: 1500, save: 2000 },
    slow: { videoSeek: 4000, buttonClick: 2500, save: 3000 }
  };

  const SAMPLE_DATA = [
    { time: "00:00:00", title: "Giriş ve Tanıtım" },
    { time: "00:05:30", title: "Ana Konu Açıklaması" },
    { time: "00:15:00", title: "Pratik Uygulama" },
    { time: "00:25:45", title: "Soru-Cevap Bölümü" },
    { time: "00:35:00", title: "Kapanış ve Özet" }
  ];

  // Load saved settings
  const savedData = await chrome.storage.local.get(['jsonData', 'settings']);
  if (savedData.jsonData) jsonInput.value = savedData.jsonData;
  if (savedData.settings) {
    videoSeekDelay.value = savedData.settings.videoSeek || 2500;
    buttonClickDelay.value = savedData.settings.buttonClick || 1500;
    saveDelay.value = savedData.settings.save || 2000;
  }

  // Check if process is running
  const state = await chrome.storage.local.get(['isRunning', 'progress']);
  if (state.isRunning) {
    showRunningState(state.progress);
  }

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'progress') {
      updateProgress(message.data);
    } else if (message.type === 'log') {
      addLog(message.data.text, message.data.level);
    } else if (message.type === 'complete') {
      showCompleteState();
    } else if (message.type === 'error') {
      showError(message.data);
    }
  });

  function validateTimeFormat(timeStr) {
    const parts = timeStr.split(':').map(Number);
    if (parts.length > 3) return { valid: false, error: "4 haneli format desteklenmez" };
    if (parts.length < 2) return { valid: false, error: "En az MM:SS formatı gerekli" };
    const seconds = parts[parts.length - 1];
    const minutes = parts[parts.length - 2];
    if (seconds >= 60) return { valid: false, error: "Saniye 60'tan küçük olmalı" };
    if (minutes >= 60 && parts.length === 2) return { valid: false, error: "Dakika 60'tan küçük olmalı, saat ekleyin" };
    if (parts.length === 3 && minutes >= 60) return { valid: false, error: "Dakika 60'tan küçük olmalı" };
    return { valid: true };
  }

  function validateJSON() {
    const text = jsonInput.value.trim();
    if (!text) {
      showValidation('Lütfen JSON verisi girin', false);
      return null;
    }
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        showValidation('JSON bir dizi olmalı', false);
        return null;
      }
      if (data.length === 0) {
        showValidation('Dizi boş olamaz', false);
        return null;
      }
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.time || !item.title) {
          showValidation(`Satır ${i + 1}: "time" ve "title" alanları zorunlu`, false);
          return null;
        }
        const timeCheck = validateTimeFormat(item.time);
        if (!timeCheck.valid) {
          showValidation(`Satır ${i + 1} (${item.time}): ${timeCheck.error}`, false);
          return null;
        }
      }
      showValidation(`✓ ${data.length} bölüm doğrulandı`, true);
      return data;
    } catch (e) {
      showValidation(`JSON Hatası: ${e.message}`, false);
      return null;
    }
  }

  function showValidation(message, isSuccess) {
    validationResult.textContent = message;
    validationResult.className = 'validation-result ' + (isSuccess ? 'success' : 'error');
  }

  function addLog(text, level = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    entry.textContent = `[${new Date().toLocaleTimeString('tr-TR')}] ${text}`;
    logContainer.insertBefore(entry, logContainer.firstChild);
    if (logContainer.children.length > 50) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }

  function updateProgress(data) {
    progressFill.style.width = `${(data.current / data.total) * 100}%`;
    progressText.textContent = `${data.current} / ${data.total}`;
    currentChapter.textContent = data.currentTitle || '';
  }

  function showRunningState(progress) {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    progressSection.style.display = 'block';
    if (progress) updateProgress(progress);
  }

  function showCompleteState() {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    startBtn.disabled = false;
    addLog('İşlem tamamlandı!', 'success');
    progressFill.style.width = '100%';
  }

  function showError(error) {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    startBtn.disabled = false;
    addLog(`Hata: ${error}`, 'error');
  }

  // Event Listeners
  validateBtn.addEventListener('click', validateJSON);

  clearBtn.addEventListener('click', () => {
    jsonInput.value = '';
    validationResult.className = 'validation-result';
    chrome.storage.local.remove('jsonData');
  });

  loadSampleBtn.addEventListener('click', () => {
    jsonInput.value = JSON.stringify(SAMPLE_DATA, null, 2);
    validateJSON();
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = btn.dataset.speed;
      const preset = SPEED_PRESETS[speed];
      videoSeekDelay.value = preset.videoSeek;
      buttonClickDelay.value = preset.buttonClick;
      saveDelay.value = preset.save;
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  startBtn.addEventListener('click', async () => {
    const chapters = validateJSON();
    if (!chapters) return;

    const settings = {
      videoSeek: parseInt(videoSeekDelay.value),
      buttonClick: parseInt(buttonClickDelay.value),
      save: parseInt(saveDelay.value)
    };

    // Save data
    await chrome.storage.local.set({
      jsonData: jsonInput.value,
      settings: settings
    });

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('sharepoint.com') && !tab.url.includes('microsoftstream.com')) {
      showValidation('Lütfen Microsoft Stream video sayfasında olun', false);
      return;
    }

    // Clear logs and show progress
    logContainer.innerHTML = '';
    showRunningState({ current: 0, total: chapters.length });
    addLog(`${chapters.length} bölüm işlenecek...`, 'info');

    // Send to background
    chrome.runtime.sendMessage({
      type: 'startChaptering',
      data: { chapters, settings, tabId: tab.id }
    });
  });

  stopBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'stopChaptering' });
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    addLog('İşlem durduruldu', 'warning');
  });

  // Auto-save on input change
  jsonInput.addEventListener('input', () => {
    chrome.storage.local.set({ jsonData: jsonInput.value });
  });

  [videoSeekDelay, buttonClickDelay, saveDelay].forEach(input => {
    input.addEventListener('change', () => {
      chrome.storage.local.set({
        settings: {
          videoSeek: parseInt(videoSeekDelay.value),
          buttonClick: parseInt(buttonClickDelay.value),
          save: parseInt(saveDelay.value)
        }
      });
    });
  });
});
