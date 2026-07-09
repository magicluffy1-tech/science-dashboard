/**
 * app.js — 메인 앱 로직
 * 카메라 제어, UI 이벤트, 이미지 처리 조율
 */

const App = (() => {
  // ─── 상태 변수들 ───────────────────────────────
  let videoStream = null;
  let currentAnimalId = 'human';
  let originalImageData = null;
  let isCameraActive = false;
  let facingMode = 'environment'; // 'environment' = 후면, 'user' = 전면

  // ─── DOM 요소 캐시 ──────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ─── 카메라 관련 ────────────────────────────────

  async function initCamera() {
    const video = $('#camera-video');
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    try {
      // 기존 스트림 정리
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }

      videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = videoStream;
      await video.play();

      isCameraActive = true;
      showScreen('camera');
      updateCameraUI();

    } catch (err) {
      console.error('카메라 접근 실패:', err);
      showError('카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.');
    }
  }

  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }
    isCameraActive = false;
  }

  function flipCamera() {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    if (isCameraActive) {
      initCamera();
    }
  }

  function capturePhoto() {
    const video = $('#camera-video');
    const canvas = $('#process-canvas');
    const ctx = canvas.getContext('2d');

    // 비디오 실제 크기로 캔버스 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 원본 이미지 데이터 저장
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 결과 캔버스에도 원본 표시
    const resultCanvas = $('#result-canvas');
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    const resultCtx = resultCanvas.getContext('2d');
    resultCtx.putImageData(originalImageData, 0, 0);

    // 카메라 중지 & 결과 화면으로 전환
    stopCamera();
    currentAnimalId = 'human';
    showScreen('result');
    updateAnimalSelection('human');
    showAnimalInfo('human');

    // 촬영 햅틱/사운드 효과
    playShutterEffect();
  }

  /** 갤러리에서 이미지 선택 */
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = $('#process-canvas');
        const ctx = canvas.getContext('2d');

        // 이미지 크기 제한 (성능)
        const maxDim = 1920;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        originalImageData = ctx.getImageData(0, 0, w, h);

        const resultCanvas = $('#result-canvas');
        resultCanvas.width = w;
        resultCanvas.height = h;
        resultCanvas.getContext('2d').putImageData(originalImageData, 0, 0);

        stopCamera();
        currentAnimalId = 'human';
        showScreen('result');
        updateAnimalSelection('human');
        showAnimalInfo('human');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }


  // ─── 시각 변환 ──────────────────────────────────

  function applyAnimalVision(animalId) {
    if (!originalImageData) return;

    currentAnimalId = animalId;
    updateAnimalSelection(animalId);
    showAnimalInfo(animalId);

    // 동물 전환 시 정보 패널 닫기 (동물 선택 바가 가려지지 않도록)
    $('#animal-info').classList.remove('visible');

    // 변환 시작 애니메이션
    const resultCanvas = $('#result-canvas');
    resultCanvas.classList.add('transforming');

    // 비동기 처리로 UI 블로킹 방지
    requestAnimationFrame(() => {
      const ctx = resultCanvas.getContext('2d');

      // 원본 복사본 생성 (매번 원본에서 변환)
      const clonedData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
      );

      // 변환 적용
      const transformed = VisionEngine.applyVision(animalId, clonedData);
      ctx.putImageData(transformed, 0, 0);

      // 애니메이션 종료
      setTimeout(() => {
        resultCanvas.classList.remove('transforming');
      }, 400);
    });
  }


  // ─── UI 관련 ────────────────────────────────────

  function showScreen(screenId) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $(`#screen-${screenId}`).classList.add('active');
  }

  function showError(message) {
    const errorEl = $('#error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }

  function updateCameraUI() {
    const flipBtn = $('#btn-flip');
    if (flipBtn) {
      flipBtn.querySelector('.btn-label').textContent =
        facingMode === 'environment' ? '전면' : '후면';
    }
  }

  function updateAnimalSelection(animalId) {
    $$('.animal-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.animal === animalId);
    });

    // 테마 컬러 변경
    const animal = ANIMALS.find(a => a.id === animalId);
    if (animal) {
      document.documentElement.style.setProperty('--active-color', animal.themeColor);
      document.documentElement.style.setProperty('--active-gradient', animal.themeGradient);
    }
  }

  function showAnimalInfo(animalId) {
    const animal = ANIMALS.find(a => a.id === animalId);
    if (!animal) return;

    const infoPanel = $('#animal-info');
    infoPanel.innerHTML = `
      <div class="info-header">
        <span class="info-emoji">${animal.emoji}</span>
        <div class="info-title">
          <h3>${animal.name} <span class="info-en">${animal.nameEn}</span></h3>
          <p class="info-short">${animal.shortDesc}</p>
        </div>
      </div>
      <div class="info-details">
        <div class="info-stat">
          <span class="stat-label">파장 범위</span>
          <span class="stat-value">${animal.spectrum}</span>
        </div>
        <div class="info-stat">
          <span class="stat-label">광수용체</span>
          <span class="stat-value">${animal.receptors}</span>
        </div>
      </div>
      <p class="info-desc">${animal.description}</p>
    `;

    // 패널 내용만 업데이트 (자동으로 열지 않음 — ℹ️ 버튼으로 토글)
  }

  function playShutterEffect() {
    const flash = $('#shutter-flash');
    flash.classList.add('flash');
    setTimeout(() => flash.classList.remove('flash'), 300);

    // 진동 API (지원 시)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  function downloadImage() {
    const resultCanvas = $('#result-canvas');
    const animal = ANIMALS.find(a => a.id === currentAnimalId);
    const link = document.createElement('a');
    link.download = `animal_vision_${animal ? animal.id : 'photo'}.png`;
    link.href = resultCanvas.toDataURL('image/png');
    link.click();
  }

  function goBack() {
    showScreen('home');
    stopCamera();
    originalImageData = null;
  }

  function toggleInfoPanel() {
    const panel = $('#animal-info');
    panel.classList.toggle('visible');
  }


  // ─── 동물 선택 바 생성 ──────────────────────────

  function renderAnimalBar() {
    const bar = $('#animal-bar');
    bar.innerHTML = ANIMALS.map(animal => `
      <button class="animal-btn ${animal.id === 'human' ? 'active' : ''}"
              data-animal="${animal.id}"
              id="btn-animal-${animal.id}"
              aria-label="${animal.name}의 시각으로 보기"
              style="--btn-color: ${animal.themeColor}; --btn-gradient: ${animal.themeGradient}">
        <span class="animal-icon">${animal.emoji}</span>
        <span class="animal-name">${animal.name}</span>
      </button>
    `).join('');

    // 이벤트 위임
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.animal-btn');
      if (btn) {
        applyAnimalVision(btn.dataset.animal);
      }
    });
  }


  // ─── 초기화 & 이벤트 바인딩 ─────────────────────

  function init() {
    // 동물 선택 바 렌더링
    renderAnimalBar();

    // 홈 화면 버튼들
    $('#btn-camera').addEventListener('click', initCamera);
    $('#btn-gallery').addEventListener('click', () => {
      $('#file-input').click();
    });
    $('#file-input').addEventListener('change', handleFileSelect);

    // 카메라 화면 버튼들
    $('#btn-capture').addEventListener('click', capturePhoto);
    $('#btn-flip').addEventListener('click', flipCamera);
    $('#btn-camera-back').addEventListener('click', () => {
      stopCamera();
      showScreen('home');
    });

    // 결과 화면 버튼들
    $('#btn-back').addEventListener('click', goBack);
    $('#btn-download').addEventListener('click', downloadImage);
    $('#btn-info-toggle').addEventListener('click', toggleInfoPanel);
    $('#btn-retake').addEventListener('click', initCamera);

    // 비교 슬라이더
    const compareSlider = $('#compare-slider');
    if (compareSlider) {
      compareSlider.addEventListener('input', handleCompareSlider);
    }

    // 초기 화면
    showScreen('home');

    // 데모 모드: ?demo 파라미터가 있으면 테스트 이미지 자동 로드
    if (new URLSearchParams(window.location.search).has('demo')) {
      loadDemoImage();
    }

    console.log('🌈 Animal Vision Simulator initialized!');
  }

  async function loadDemoImage() {
    try {
      const response = await fetch('/test_flower.png');
      const blob = await response.blob();
      const img = new Image();
      img.onload = () => {
        const canvas = $('#process-canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 1920;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        originalImageData = ctx.getImageData(0, 0, w, h);
        const resultCanvas = $('#result-canvas');
        resultCanvas.width = w;
        resultCanvas.height = h;
        resultCanvas.getContext('2d').putImageData(originalImageData, 0, 0);
        currentAnimalId = 'human';
        showScreen('result');
        updateAnimalSelection('human');
        showAnimalInfo('human');
      };
      img.src = URL.createObjectURL(blob);
    } catch (err) {
      console.error('Demo image load failed:', err);
    }
  }

  function handleCompareSlider(e) {
    const value = e.target.value / 100;
    const resultCanvas = $('#result-canvas');
    const ctx = resultCanvas.getContext('2d');

    if (!originalImageData) return;

    // 원본과 변환본 블렌딩
    const clonedData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      originalImageData.width,
      originalImageData.height
    );

    if (currentAnimalId !== 'human') {
      const transformed = VisionEngine.applyVision(currentAnimalId, clonedData);
      const origData = originalImageData.data;
      const transData = transformed.data;

      const blended = new ImageData(
        new Uint8ClampedArray(origData.length),
        originalImageData.width,
        originalImageData.height
      );

      for (let i = 0; i < origData.length; i++) {
        blended.data[i] = origData[i] * (1 - value) + transData[i] * value;
      }

      ctx.putImageData(blended, 0, 0);
    } else {
      ctx.putImageData(originalImageData, 0, 0);
    }
  }

  // DOM 로드 후 초기화
  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
