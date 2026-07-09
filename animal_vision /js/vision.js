/**
 * vision.js — 동물 시각 변환 엔진
 * Canvas ImageData의 픽셀을 직접 조작하여 각 동물의 시각을 시뮬레이션합니다.
 * 
 * 각 함수는 ImageData를 받아 변환된 ImageData를 반환합니다.
 * 성능을 위해 TypedArray 직접 조작을 사용합니다.
 */

const VisionEngine = (() => {

  // ─── 유틸리티 함수들 ───────────────────────────

  /** RGB → HSL 변환 */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [h, s, l];
  }

  /** HSL → RGB 변환 */
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /** 값 클램프 (0–255) */
  function clamp(val) {
    return val < 0 ? 0 : val > 255 ? 255 : val | 0;
  }

  /** 열화상 컬러맵 (0.0~1.0 → RGB) */
  function thermalColormap(t) {
    // 파랑 → 청록 → 초록 → 노랑 → 빨강 → 흰색
    let r, g, b;
    if (t < 0.15) {
      // 짙은 파랑 → 파랑
      const f = t / 0.15;
      r = 0;
      g = 0;
      b = clamp(30 + f * 195);
    } else if (t < 0.35) {
      // 파랑 → 청록
      const f = (t - 0.15) / 0.20;
      r = 0;
      g = clamp(f * 220);
      b = clamp(225 - f * 60);
    } else if (t < 0.55) {
      // 청록 → 초록 → 노랑
      const f = (t - 0.35) / 0.20;
      r = clamp(f * 255);
      g = clamp(220 + f * 35);
      b = clamp(165 - f * 165);
    } else if (t < 0.75) {
      // 노랑 → 주황 → 빨강
      const f = (t - 0.55) / 0.20;
      r = 255;
      g = clamp(255 - f * 220);
      b = 0;
    } else {
      // 빨강 → 흰색(고열)
      const f = (t - 0.75) / 0.25;
      r = 255;
      g = clamp(35 + f * 220);
      b = clamp(f * 220);
    }
    return [r, g, b];
  }


  // ─── 동물 시각 변환 함수들 ───────────────────

  /**
   * 사람 시각 — 원본 그대로 반환
   */
  function applyHumanVision(imageData) {
    return imageData;
  }


  /**
   * 🐝 벌 시각 시뮬레이션
   * - 빨간색 채널 대폭 억제 (벌은 빨강을 인식하지 못함)
   * - UV 시뮬: 파란색 영역을 보라~자외선 쪽으로 시프트
   * - 노란-녹색 영역 강조 (벌의 주 감지 영역)
   * - 밝기 기반 UV 꿀 안내선 패턴 시뮬레이션
   */
  function applyBeeVision(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      let r = data[i], g = data[i+1], b = data[i+2];

      // 1) 빨강 억제 — 벌은 빨간색을 거의 못 봄
      const redSuppressed = r * 0.12;

      // 2) UV 시뮬레이션 — 파란빛을 보라쪽으로 시프트
      const uvBoost = b * 0.4;

      // 3) 노란-녹색 강조
      const yellowGreen = (r * 0.35 + g * 0.65);

      // 4) 벌의 3색 시각 매핑: UV(보라) / 청 / 녹
      let newR = clamp(uvBoost * 0.7 + redSuppressed + yellowGreen * 0.15);
      let newG = clamp(g * 0.85 + yellowGreen * 0.25);
      let newB = clamp(b * 1.15 + uvBoost * 0.6);

      // 5) UV 꿀 안내선 패턴 (밝기 기반 동심원 느낌)
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const px = (i / 4) % width;
      const py = Math.floor((i / 4) / width);
      const cx = width / 2, cy = imageData.height / 2;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      const pattern = Math.sin(dist * 0.04 + lum * 12) * 0.5 + 0.5;

      if (lum > 0.5) {
        // 밝은 영역에 UV 패턴 강조 (꽃잎의 UV 패턴)
        newR = clamp(newR - pattern * 35);
        newB = clamp(newB + pattern * 50);
      }

      data[i]   = newR;
      data[i+1] = newG;
      data[i+2] = newB;
    }

    return imageData;
  }


  /**
   * 🐍 뱀 시각 시뮬레이션 (살무사/보아뱀)
   * - 피트 기관의 열감지를 열화상으로 표현
   * - 밝기/색온도를 열 분포로 매핑
   * - 원본 윤곽선을 약하게 블렌딩 (일부 가시광 시각)
   */
  function applySnakeVision(imageData) {
    const data = imageData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];

      // 1) 밝기 계산 (피부/체온 추정)
      const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      // 2) "색온도" 추정 — 따뜻한 색(빨강/노랑) = 높은 열
      const warmth = (r * 0.6 + g * 0.2 - b * 0.3) / 255;
      const coldness = (b * 0.5 - r * 0.2) / 255;

      // 3) 열 강도 = 밝기 + 색온도 보정
      let heat = luminance * 0.6 + Math.max(0, warmth) * 0.4;
      heat = Math.min(1, Math.max(0, heat));

      // 비선형 감마로 열 대비 강화
      heat = Math.pow(heat, 0.75);

      // 4) 열화상 컬러맵 적용
      const [tr, tg, tb] = thermalColormap(heat);

      // 5) 원본 윤곽선 약간 블렌딩 (뱀도 약한 가시광 시각 있음)
      const edgeR = r * 0.08;
      const edgeG = g * 0.08;
      const edgeB = b * 0.08;

      data[i]   = clamp(tr * 0.92 + edgeR);
      data[i+1] = clamp(tg * 0.92 + edgeG);
      data[i+2] = clamp(tb * 0.92 + edgeB);
    }

    return imageData;
  }


  /**
   * 🦋 나비 시각 시뮬레이션
   * - 15종 광수용체: 극도로 풍부한 색감
   * - UV 채널 시뮬레이션
   * - 채도 극대화 + 색상 스펙트럼 확장
   * - 미세 편광 패턴
   */
  function applyButterflyVision(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];

      // 1) HSL 변환으로 채도/색상 조작
      let [h, s, l] = rgbToHsl(r, g, b);

      // 2) 채도 극대화 (15종 광수용체 = 초고채도 인지)
      s = Math.min(1, s * 1.8 + 0.1);

      // 3) 색상 스펙트럼 확장 — 색상환 양쪽으로 늘리기
      // 나비는 인간보다 색상 구분이 세밀하므로 색상 편차 증폭
      h = (h + Math.sin(h * Math.PI * 4) * 0.06 + 1) % 1;

      // 4) UV 시프트 — 파란빛 영역을 보라-자외선 쪽으로
      if (h > 0.55 && h < 0.75) {
        h -= 0.08; // 보라쪽으로 시프트
        s = Math.min(1, s * 1.3);
      }

      // 5) 밝기 감마 — 나비는 밝은 영역에서 더 세밀한 구분
      l = Math.pow(l, 0.9);

      const [newR, newG, newB] = hslToRgb(h, s, l);

      // 6) UV 패턴 오버레이 (편광 시뮬)
      const px = (i / 4) % width;
      const py = Math.floor((i / 4) / width);
      const uvPattern = Math.sin(px * 0.08 + py * 0.06) * 0.5 + 0.5;
      const lumOriginal = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      // 밝은 영역에 미세한 UV 텍스처
      const uvStrength = lumOriginal > 0.4 ? uvPattern * 18 : 0;

      data[i]   = clamp(newR + uvStrength * 0.3);
      data[i+1] = clamp(newG - uvStrength * 0.1);
      data[i+2] = clamp(newB + uvStrength * 0.8);
    }

    return imageData;
  }


  /**
   * 🐕 개 시각 시뮬레이션
   * - 2색 시각 (Dichromacy): 파란색 + 노란색만
   * - 적-녹 색맹 (Deuteranopia 유사)
   * - 채도 감소 + 약간의 소프트 포커스 효과
   */
  function applyDogVision(imageData) {
    const data = imageData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];

      // Brettel 1997 기반 Deuteranopia (적-녹 색맹) 변환 매트릭스
      // 개는 정확히 Deuteranopia는 아니지만, 가장 유사한 모델
      const newR = clamp(r * 0.625 + g * 0.375 + b * 0.0);
      const newG = clamp(r * 0.700 + g * 0.300 + b * 0.0);
      const newB = clamp(r * 0.0   + g * 0.300 + b * 0.700);

      // 채도 약간 감소 (개의 색 인지 능력이 제한적)
      let [h, s, l] = rgbToHsl(newR, newG, newB);
      s *= 0.72;
      l = l * 0.95 + 0.02; // 약간 밝게 (개의 야간 시력 반영)

      const [finalR, finalG, finalB] = hslToRgb(h, s, l);

      data[i]   = finalR;
      data[i+1] = finalG;
      data[i+2] = finalB;
    }

    return imageData;
  }


  /**
   * 🦐 갯가재 시각 시뮬레이션
   * - 16종 광수용체: 극한의 색감
   * - UV + IR 양쪽 스펙트럼 확장
   * - 편광 감지 시뮬레이션
   * - 각 색상 채널을 독립적으로 감마 변환
   */
  function applyMantisVision(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];

      // 1) HSL 변환
      let [h, s, l] = rgbToHsl(r, g, b);

      // 2) 극채도 (16종 광수용체 — 인간의 5배 이상 색감)
      s = Math.min(1, s * 2.2 + 0.15);

      // 3) 색상 분할 증폭 — 비슷한 색도 크게 다르게 보이도록
      h = (h + Math.sin(h * Math.PI * 8) * 0.04 + 1) % 1;

      // 4) 각 밴드별 독립 감마 (다양한 광수용체 시뮬)
      const [baseR, baseG, baseB] = hslToRgb(h, s, l);

      let newR = clamp(Math.pow(baseR / 255, 0.7) * 255);
      let newG = clamp(Math.pow(baseG / 255, 0.85) * 255);
      let newB = clamp(Math.pow(baseB / 255, 0.65) * 255);

      // 5) UV 채널 시뮬 (보라색 강화)
      if (b > r * 0.8 && b > 80) {
        newR = clamp(newR + 30);
        newB = clamp(newB + 45);
      }

      // 6) IR 채널 시뮬 (따뜻한 색 약간 확장)
      if (r > b * 1.2 && r > 100) {
        newR = clamp(newR + 20);
        newG = clamp(newG - 10);
      }

      // 7) 편광 패턴 시뮬레이션
      const px = (i / 4) % width;
      const py = Math.floor((i / 4) / width);
      const polAngle = Math.atan2(py - imageData.height / 2, px - width / 2);
      const polPattern = Math.cos(polAngle * 3) * 0.5 + 0.5;
      const polStrength = 12;

      newR = clamp(newR + polPattern * polStrength * 0.3);
      newG = clamp(newG + polPattern * polStrength * 0.5);
      newB = clamp(newB + polPattern * polStrength * 0.8);

      data[i]   = newR;
      data[i+1] = newG;
      data[i+2] = newB;
    }

    return imageData;
  }


  // ─── Public API ────────────────────────────────

  return {
    applyHumanVision,
    applyBeeVision,
    applySnakeVision,
    applyButterflyVision,
    applyDogVision,
    applyMantisVision,

    /**
     * 동물 ID로 변환 함수를 찾아 적용
     * @param {string} animalId — 동물 ID ('bee', 'snake', etc.)
     * @param {ImageData} imageData — 변환할 이미지 데이터
     * @returns {ImageData} 변환된 이미지 데이터
     */
    applyVision(animalId, imageData) {
      const animal = ANIMALS.find(a => a.id === animalId);
      if (!animal) return imageData;

      const fn = this[animal.visionFn];
      if (typeof fn === 'function') {
        return fn(imageData);
      }
      return imageData;
    }
  };

})();
