/**
 * animals.js — 동물 시각 데이터 정의
 * 각 동물의 메타데이터와 시각 특성 정보
 */

const ANIMALS = [
  {
    id: 'human',
    name: '사람',
    nameEn: 'Human',
    emoji: '👁️',
    icon: '👁️',
    themeColor: '#6C9BF2',
    themeGradient: 'linear-gradient(135deg, #6C9BF2, #A78BFA)',
    spectrum: '380–700 nm',
    receptors: '3종 (적·녹·청)',
    description: '인간은 빨강(L), 초록(M), 파랑(S) 세 가지 원추세포로 약 1천만 가지 색을 구분합니다. 가시광선 영역(380~700nm)만 볼 수 있습니다.',
    shortDesc: '가시광선 3색 시각',
    visionFn: 'applyHumanVision'
  },
  {
    id: 'bee',
    name: '벌',
    nameEn: 'Bee',
    emoji: '🐝',
    icon: '🐝',
    themeColor: '#F5C542',
    themeGradient: 'linear-gradient(135deg, #F5C542, #E6A817)',
    spectrum: '300–650 nm',
    receptors: '3종 (자외선·청·녹)',
    description: '벌은 자외선(UV)을 볼 수 있지만 빨간색을 인식하지 못합니다. 꽃에는 우리 눈에 보이지 않는 UV 패턴(꿀 안내선)이 있어 벌을 유인합니다.',
    shortDesc: 'UV 시각, 빨강 못 봄',
    visionFn: 'applyBeeVision'
  },
  {
    id: 'snake',
    name: '뱀',
    nameEn: 'Snake (Pit Viper)',
    emoji: '🐍',
    icon: '🐍',
    themeColor: '#FF4444',
    themeGradient: 'linear-gradient(135deg, #FF4444, #FF8800)',
    spectrum: '적외선 (750 nm+)',
    receptors: '열감지 피트 기관',
    description: '살무사과 뱀은 눈과 콧구멍 사이의 피트 기관으로 적외선(열)을 감지합니다. 0.003°C의 온도 차이도 감지하여 어둠 속에서도 온혈 먹잇감을 찾습니다.',
    shortDesc: '적외선 열감지',
    visionFn: 'applySnakeVision'
  },
  {
    id: 'butterfly',
    name: '나비',
    nameEn: 'Butterfly',
    emoji: '🦋',
    icon: '🦋',
    themeColor: '#C084FC',
    themeGradient: 'linear-gradient(135deg, #C084FC, #F472B6)',
    spectrum: '300–700+ nm',
    receptors: '최대 15종',
    description: '나비는 최대 15종의 광수용체를 가지고 있어 자외선부터 가시광선까지 매우 넓은 스펙트럼을 봅니다. 인간보다 훨씬 다채로운 색의 세계를 경험합니다.',
    shortDesc: '초광대역 15종 수용체',
    visionFn: 'applyButterflyVision'
  },
  {
    id: 'dog',
    name: '개',
    nameEn: 'Dog',
    emoji: '🐕',
    icon: '🐕',
    themeColor: '#8B6914',
    themeGradient: 'linear-gradient(135deg, #8B6914, #C4A24E)',
    spectrum: '430–620 nm',
    receptors: '2종 (청·황)',
    description: '개는 2종의 원추세포만 가져 파란색과 노란색 위주로 봅니다. 빨강과 초록을 구분하지 못하며, 시력은 인간의 약 20/75 수준이지만 야간 시력은 훨씬 뛰어납니다.',
    shortDesc: '2색 시각 (적-녹 색맹)',
    visionFn: 'applyDogVision'
  },
  {
    id: 'mantis',
    name: '갯가재',
    nameEn: 'Mantis Shrimp',
    emoji: '🦐',
    icon: '🦐',
    themeColor: '#00D4AA',
    themeGradient: 'linear-gradient(135deg, #00D4AA, #00B4D8)',
    spectrum: '300–720+ nm',
    receptors: '16종 + 편광',
    description: '갯가재는 동물계 최다인 16종의 광수용체를 보유하며, 자외선부터 적외선 근처까지 감지합니다. 원편광과 선편광까지 구분할 수 있는 유일한 동물입니다.',
    shortDesc: '16종 수용체 + 편광 감지',
    visionFn: 'applyMantisVision'
  }
];
