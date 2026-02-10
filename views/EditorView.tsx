
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GeminiService } from '../geminiService';
import { GeneratedImage, AspectRatio } from '../types';

interface EditorViewProps {
  onImageGenerated: (img: GeneratedImage) => void;
}

type Step = 'IDLE' | 'PROCESSING' | 'COMPLETED';
type TextureType = '水晶绒点塑底' | '天鹅绒点塑底' | '硅藻泥';

const SHAPE_OPTIONS = ['长条矩形', '大矩形', '小矩形', '正方形', '小正方形', '椭圆形', '圆形', '半圆形', '异形', '空白'];
const ALL_SCENE_OPTIONS = ['客厅', '卧室', '床边地垫', '厨房', '儿童房', '浴室垫', '玄关门垫', '室外门垫', '室内过道', '室外花园'];
const RATIO_OPTIONS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '自动'];

const RUNNER_CONFIGS = [
  { id: '主图_01(1)', size: '40x120' },
  { id: '主图_01(2)', size: '50x180' },
  { id: '主图_01(3)', size: '60x150' },
  { id: '主图_01(4)', size: '80x300' },
];

const BIG_RECT_CONFIGS = [
  { id: '主图_01(1)', size: '80x120' },
  { id: '主图_01(2)', size: '120x180' },
  { id: '主图_01(3)', size: '150x200' },
  { id: '主图_01(4)', size: '160x230' },
  { id: '主图_01(5)', size: '200x300' },
  { id: '主图_01(6)', size: '300x400' },
  { id: '主图_01(7)', size: '240x340' },
];

const ROUND_CONFIGS = [
  { id: '主图_01(1)', size: '100x100' },
  { id: '主图_01(2)', size: '120x120' },
  { id: '主图_01(3)', size: '150x150' },
  { id: '主图_01(4)', size: '200x200' },
];

const SQUARE_CONFIGS = [
  { id: '主图_01(1)', size: '100x100' },
  { id: '主图_01(2)', size: '120x120' },
  { id: '主图_01(3)', size: '150x150' },
  { id: '主图_01(4)', size: '200x200' },
];

const SMALL_RECT_BATHMAT_CONFIGS = [
  { id: '主图_01(1)', size: '40x60' },
  { id: '主图_01(2)', size: '50x80' },
  { id: '主图_01(3)', size: '60x90' },
];

const SMALL_RECT_ENTRANCE_CONFIGS = [
  { id: '主图_01(1)', size: '40x60' },
  { id: '主图_01(2)', size: '50x80' },
  { id: '主图_01(3)', size: '60x90' },
  { id: '主图_01(4)', size: '80x120' },
];

const EditorView: React.FC<EditorViewProps> = ({ onImageGenerated }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [labelImages, setLabelImages] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [currentStep, setCurrentStep] = useState<Step>('IDLE');
  
  const [reloadingImages, setReloadingImages] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [texture, setTexture] = useState<TextureType>('水晶绒点塑底');
  const [selectedShape, setSelectedShape] = useState<string>('大矩形');
  const [selectedScene, setSelectedScene] = useState<string>('客厅');
  const [selectedRatio, setSelectedRatio] = useState<string>('3:4');
  const [style, setStyle] = useState('');
  
  const [results, setResults] = useState<Record<string, string | null>>({
    '地毯原图': null,
    '主图_01': null,
    '主图_02': null,
    '主图_03': null,
    '主图_04': null,
    '主图_05': null,
  });

  const availableScenes = useMemo(() => {
    if (['小矩形', '半圆形', '小正方形'].includes(selectedShape)) {
      return ['浴室垫', '玄关门垫', '室外门垫', '床边地垫'];
    }
    if (['大矩形', '正方形', '圆形', '椭圆形', '异形'].includes(selectedShape)) {
      return ['客厅', '室外花园', '儿童房', '卧室'];
    }
    if (['长条矩形'].includes(selectedShape)) {
      return ['厨房', '床边地垫', '室内过道'];
    }
    return ALL_SCENE_OPTIONS;
  }, [selectedShape]);

  useEffect(() => {
    if (!availableScenes.includes(selectedScene)) {
      setSelectedScene(availableScenes[0] || '客厅');
    }
  }, [selectedShape, availableScenes, selectedScene]);

  useEffect(() => {
    const handleTrigger = () => {
      handleGenerateItem('地毯原图');
    };
    window.addEventListener('TRIGGER_GENERATE_ORIGINAL', handleTrigger);
    return () => window.removeEventListener('TRIGGER_GENERATE_ORIGINAL', handleTrigger);
  }, [sourceImage, texture]);

  useEffect(() => {
    setResults((prev) => {
      const newResults: Record<string, string | null> = {
        '地毯原图': prev['地毯原图'],
        '主图_01': prev['主图_01'],
        '主图_02': prev['主图_02'],
        '主图_03': prev['主图_03'],
        '主图_04': prev['主图_04'],
        '主图_05': prev['主图_05'],
      };
      
      let extraConfigs: { id: string; size: string }[] = [];
      if (selectedShape === '长条矩形') extraConfigs = RUNNER_CONFIGS;
      else if (selectedShape === '大矩形' || selectedShape === '椭圆形') extraConfigs = BIG_RECT_CONFIGS;
      else if (selectedShape === '圆形') extraConfigs = ROUND_CONFIGS;
      else if (selectedShape === '正方形') extraConfigs = SQUARE_CONFIGS;
      else if (selectedShape === '小矩形' || selectedShape === '半圆形' || selectedShape === '小正方形') {
        if (selectedShape === '小矩形' && selectedScene === '浴室垫') {
          extraConfigs = SMALL_RECT_BATHMAT_CONFIGS;
        } else if (selectedShape === '小矩形' && selectedScene === '玄关门垫') {
          extraConfigs = SMALL_RECT_ENTRANCE_CONFIGS;
        } else {
          extraConfigs = [{ id: '主图_01(1)', size: '40x60' }, { id: '主图_01(2)', size: '50x80' }];
        }
      }

      extraConfigs.forEach(conf => {
        newResults[conf.id] = prev[conf.id] || null;
      });
      
      return newResults;
    });
  }, [selectedShape, texture, selectedScene]);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') setSourceImage(result);
        setResults({ '地毯原图': null, '主图_01': null, '主图_02': null, '主图_03': null, '主图_04': null, '主图_05': null });
        setCurrentStep('IDLE');
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLabelFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setLabelImages(prev => {
            const next = [...prev];
            next[index] = result;
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLabelImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLabelImages(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    if (labelInputRefs[index].current) {
      labelInputRefs[index].current!.value = '';
    }
  };

  const compositeUserLabel = (baseImageBase64: string, labelBase64: string | null, position: 'top' | 'bottom' | 'full'): Promise<string> => {
    if (!labelBase64) return Promise.resolve(baseImageBase64);
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const baseImg = new Image();
      const labelImg = new Image();
      baseImg.crossOrigin = "anonymous";
      labelImg.crossOrigin = "anonymous";

      baseImg.onload = () => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx?.drawImage(baseImg, 0, 0);

        labelImg.onload = () => {
          if (position === 'full') {
            ctx?.drawImage(labelImg, 0, 0, canvas.width, canvas.height);
          } else {
            const labelRatio = labelImg.width / labelImg.height;
            const drawW = canvas.width;
            const drawH = drawW / labelRatio;
            const drawY = position === 'top' ? 0 : (canvas.height - drawH);
            ctx?.drawImage(labelImg, 0, drawY, drawW, drawH);
          }
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        labelImg.onerror = () => resolve(baseImageBase64);
        labelImg.src = labelBase64;
      };
      baseImg.onerror = () => reject(new Error("Failed to load base image for composite."));
      baseImg.src = baseImageBase64;
    });
  };

  const compositeAntiSlipIcon = (baseImageBase64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const baseImg = new Image();
      const iconImg = new Image();
      baseImg.crossOrigin = "anonymous";
      iconImg.crossOrigin = "anonymous";

      baseImg.onload = () => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx?.drawImage(baseImg, 0, 0);

        iconImg.onload = () => {
          const iconCanvas = document.createElement('canvas');
          const iconCtx = iconCanvas.getContext('2d', { willReadFrequently: true });
          iconCanvas.width = iconImg.width;
          iconCanvas.height = iconImg.height;
          iconCtx?.drawImage(iconImg, 0, 0);

          if (iconCtx) {
            const imageData = iconCtx.getImageData(0, 0, iconCanvas.width, iconCanvas.height);
            const data = imageData.data;
            const refR = data[0], refG = data[1], refB = data[2];
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i+1], b = data[i+2];
              const dist = Math.sqrt(Math.pow(r - refR, 2) + Math.pow(g - refG, 2) + Math.pow(b - refB, 2));
              if (dist < 90) data[i + 3] = 0;
            }
            iconCtx.putImageData(imageData, 0, 0);
          }

          const padding = canvas.width * 0.05;
          const targetIconSize = canvas.width * 0.25;
          const iconRatio = iconImg.width / iconImg.height;
          const drawW = targetIconSize;
          const drawH = targetIconSize / iconRatio;
          ctx?.drawImage(iconCanvas, canvas.width - drawW - padding, canvas.height - drawH - padding, drawW, drawH);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        iconImg.onerror = () => resolve(baseImageBase64);
        iconImg.src = './anti-slip-icon.png';
      };
      baseImg.onerror = () => reject(new Error("Failed to load base image for composition."));
      baseImg.src = baseImageBase64;
    });
  };

  const compositeCleaningTitle = (baseImageBase64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const baseImg = new Image();
      baseImg.crossOrigin = "anonymous";

      baseImg.onload = () => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        ctx?.drawImage(baseImg, 0, 0);

        if (ctx) {
          const rectHeight = canvas.height * 0.12;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(0, 0, canvas.width, rectHeight);

          const fontSize = Math.floor(rectHeight * 0.45);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ЛЕГКО ЧИСТИТЬ', canvas.width / 2, rectHeight / 2);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      baseImg.onerror = () => reject(new Error("Failed to load base image for cleaning title composition."));
      baseImg.src = baseImageBase64;
    });
  };

  const getApiRatio = (ratioStr: string): AspectRatio => {
    if (ratioStr === '自动') return '3:4';
    const directMatches: Record<string, AspectRatio> = {
      '1:1': '1:1', '3:4': '3:4', '4:3': '4:3', '9:16': '9:16', '16:9': '16:9'
    };
    if (directMatches[ratioStr]) return directMatches[ratioStr];
    const mapping: Record<string, AspectRatio> = {
      '2:3': '3:4', '3:2': '4:3', '4:5': '3:4', '5:4': '4:3'
    };
    return mapping[ratioStr] || '3:4';
  };

  const getPromptForType = (type: string, ratioStr: string): string => {
    const sceneText = selectedScene || "简约现代室内空间";
    const styleDesc = style || '清新、高质感电商风格';
    const ratioSpecText = ratioStr !== '自动' ? `输出图片的尺寸比例应严格符合 ${ratioStr}。` : "";

    const isSmallRectBathMat = selectedShape === '小矩形' && selectedScene === '浴室垫';
    const isSmallRectEntranceMat = selectedShape === '小矩形' && selectedScene === '玄关门垫';

    if (type === '地毯原图') {
        if (texture === '硅藻泥') {
          return `去除地毯表面材质，去除地毯的锁边（若有），使地毯表面保持平滑，地毯图案 and 颜色不发生任何改变，最终地毯摆放成垂直于地毯正上方的正俯视图。${ratioSpecText}`;
        } else {
          return `增加地毯的毯面毛绒材质 and 锁边，让地毯看起来更真实，锁边很细，锁边的颜色选择与地毯图案主色调最接近的颜色，地毯图案 and 颜色不发生任何改变，最终地毯摆放成垂直于地毯正上方的正俯视图。${ratioSpecText}`;
        }
    }

    if (isSmallRectBathMat) {
      switch (type) {
        case '主图_01':
          return `这是一张俄罗斯电商平台的地毯商品主图首图，请根据第一张生成的地毯原图.jpg，结合选择的应用场景和风格描述，生成一张地毯场景图，生成图片中的地毯视角为高位俯视角度，画面主体是一块铺在地板上的浴室吸水长方形地毯，地毯位于画面中心，且地毯为整张画面占比最大的元素，地毯从画面右下角向左上角延伸，画面右上角是淋浴间，由门槛和长虹玻璃隔断，地毯紧挨着门槛横放，即靠近门槛的一边是地毯的长边，淋浴间内有长条格栅地排水设计，淋浴间内的地上摆放着一个托盘，托盘上有洗手液、香薰瓶和肥皂，地毯摆放在淋浴间外的门槛边，地毯旁随意摆放着一双居家浴室拖鞋，阳光透过窗户洒下条纹状的剪影，光线自然柔和明亮，地毯场景需要根据所填写的风格描述进行生成，场景装饰需要和地毯的颜色风格和所填写的风格描述相互和谐，场景图充满整张画面，不要留白。整张地毯需要完全露出。同时图片顶部有巨大的俄语文字标题“КОВЕР”，下方有一个标签，上面写着文字“РАЗЛИЧНЫЕ РАЗMЕРЫ”。文字颜色调整为与整体场景色调和谐，所有文字需要清晰可见，文字可以根据场景和地毯的风格增加一些符合调性的设计感。同时，所有文字元素都不能对图片中的地毯有遮挡，地毯需要完整的被展示出来。图片上不要智能添加文字，也不要在生成的图片上增加边框或其他元素。图片中的俄语文字标题“КОВЕР”和“РАЗЛИЧНЫЕ РАЗMЕРЫ”等文字元素，不可以直接 p 到地毯上面，而是作为电商主图首图中的标题元素出现。地毯原图输出大小与填写的输出规格一致。将标签5.jpg叠放在图片上，缩放标签5.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_02':
          return `这是一张俄罗斯电商平台的地毯商品主图第二张图，请根据第一张生成的地毯原图.jpg，结合选择的应用场景和风格描述，生成一张地毯场景图，生成的场景图视角为平视略偏俯视，一张长方形地毯铺在地板上，背景是一个独立式大浴缸，地毯紧挨着浴缸横放，即靠近浴缸的一边是地毯的长边，一位身穿睡袍的女性坐在浴缸边缘，双腿自然下垂，赤脚脚尖微踩在地毯上方，浴缸上横放着原木托盘，装有果汁和香薰，浴缸旁有一株绿色的室内植物，采光自然且柔和。地毯场景需要根据所填写的风格描述进行生成，场景装饰、女性的装扮和地毯图案的整体色调需要互相和谐，场景图充满整张画面，不要留白，地毯完全自然的融入场景中，视觉上不会觉得假。生成的所有图片中，地毯场景和地毯图案的整体色调需要和谐，不突兀。图片上不要智能添加文字或其他元素。将标签6.jpg叠放在图片上，缩放标签6.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_03':
          return `请根据第一张基础图“地毯原图.jpg"，结合风格描述，生成一张地毯场景四宫格图片，第1个格子将基于第一张基础图“地毯原图.jpg"，生成一张入户地毯场景图... (省略内容) ...将标签2.jpg叠放在图片上，缩放标签2.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_04':
          return `这是一张俄罗斯电商平台的地毯商品主图第二张图，请根据第一张生成的地毯原图.jpg，结合选择的应用场景和风格描述，生成一张地毯场景图... (省略内容) ...将标签3.jpg叠放在图片上，缩放标签3.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_05':
          return `将地毯原图.jpg生成一张地毯，有扫地机器人在上面清洁，并贴到第一张图的第一个红色格子里，大小要求缩放到与红色格子完全一致；将地毯原图.jpg生成一张地毯，有吸尘器在上面清洁，并贴到第一张图的第二个红色格子里，大小要求缩放到与红色格子完全一致；将地毯原图.jpg生成一张地毯，有一只女人的手在上面擦茶渍，并贴到第一张图的第三个红色格子里，大小要求缩放到与红色格子完全一致。请确保模板图在最底部，红色格子被生成的场景图完全覆盖。${ratioSpecText}`;
        case '主图_01(1)':
        case '主图_01(2)':
        case '主图_01(3)':
          const sMap: Record<string, string> = { '主图_01(1)': '40x60', '主图_01(2)': '50x80', '主图_01(3)': '60x90' };
          const sVal = sMap[type];
          return `这是一张俄罗斯电商平台的地毯商品主图首图，请根据第一张生成的地毯原图.jpg，结合填写的风格描述，生成一张地毯场景图主图... (省略内容) ...再下方有一个标签，上面写着尺寸文字“${sVal}”。将标签5.jpg叠放在图片上，缩放标签5.jpg与图片四边重合。${ratioSpecText}`;
        default: return "";
      }
    }

    if (isSmallRectEntranceMat) {
      switch (type) {
        case '主图_01':
          return `这是一张俄罗斯电商平台的地毯商品主图首图，请根据第一张生成的地毯原图.jpg，结合选择的应用场景和风格描述，生成一张地毯场景图... (省略内容) ...将标签1.jpg叠放在图片上，缩放标签1.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_03':
          return `请根据第一张基础图“地毯原图.jpg"，结合风格描述，生成一张地毯场景四宫格图片... (省略内容) ...将标签2.jpg叠放在图片上，缩放标签2.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_04':
          return `这是一张俄罗斯电商平台的地毯商品主图第二张图... (省略内容) ...将标签3.jpg叠放在图片上，缩放标签3.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_05':
          return `基于地毯原图，结合风格描述，生成一张地毯清洁场景的四宫格图片... (省略内容) ...将标签4.jpg叠放在图片上，缩放标签4.jpg与图片四边重合。${ratioSpecText}`;
        case '主图_01(1)':
        case '主图_01(2)':
        case '主图_01(3)':
        case '主图_01(4)':
          const eMap: Record<string, string> = { '主图_01(1)': '40x60', '主图_01(2)': '50x80', '主图_01(3)': '60x90', '主图_01(4)': '80x120' };
          const eVal = eMap[type];
          return `这是一张俄罗斯电商平台的地毯商品主图首图... (省略内容) ...再下方有一个标签，上面写着尺寸文字“${eVal}”。将标签1.jpg叠放在图片上，缩放标签1.jpg与图片四边重合。${ratioSpecText}`;
        default: return "";
      }
    }

    // Default variants logic for non-special shapes/scenes
    let extraConfigs: { id: string; size: string }[] = [];
    if (selectedShape === '长条矩形') extraConfigs = RUNNER_CONFIGS;
    else if (selectedShape === '大矩形' || selectedShape === '椭圆形') extraConfigs = BIG_RECT_CONFIGS;
    else if (selectedShape === '圆形') extraConfigs = ROUND_CONFIGS;
    else if (selectedShape === '正方形') extraConfigs = SQUARE_CONFIGS;
    else if (selectedShape === '小矩形' || selectedShape === '半圆形' || selectedShape === '小正方形') {
      extraConfigs = [{ id: '主图_01(1)', size: '40x60' }, { id: '主图_01(2)', size: '50x80' }];
    }
    const sizeConf = extraConfigs.find(c => c.id === type);

    switch (type) {
      case '主图_01':
        return `这是一张俄罗斯电商平台的地毯商品主图首图... (省略内容) ...${ratioSpecText}`;
      case '主图_02':
        return `这是一张俄罗斯电商平台的地毯商品主图第二张图... (省略内容) ...${ratioSpecText}`;
      case '主图_03':
        return `请根据第一张基础图“地毯原图.jpg"，结合风格描述... (省略内容) ...${ratioSpecText}`;
      case '主图_04':
        return `这是一张俄罗斯电商平台的地毯商品主图第二张图... (省略内容) ...${ratioSpecText}`;
      case '主图_05':
        return `基于地毯原图，结合风格描述，生成一张地毯清洁场景的四宫格图片... (省略内容) ...${ratioSpecText}`;
      default:
        if (type.startsWith('主图_01') && sizeConf) {
          return `这是一张俄罗斯电商平台的地毯商品主图首图... (省略内容) ...${ratioSpecText}`;
        }
        return "";
    }
  };

  const handleSpecialSceneCompositing = async (name: string, imageUrl: string): Promise<string> => {
    const isSmallRectBathMat = selectedShape === '小矩形' && selectedScene === '浴室垫';
    const isSmallRectEntranceMat = selectedShape === '小矩形' && selectedScene === '玄关门垫';

    if (isSmallRectBathMat) {
      if (name === '主图_01' || name.startsWith('主图_01(')) {
        return await compositeUserLabel(imageUrl, labelImages[4], 'full'); // 标签图 5 
      } else if (name === '主图_02') {
        return await compositeUserLabel(imageUrl, labelImages[5], 'full'); // 标签图 6
      } else if (name === '主图_03') {
        return await compositeUserLabel(imageUrl, labelImages[1], 'full'); // 标签图 2
      } else if (name === '主图_04') {
        return await compositeUserLabel(imageUrl, labelImages[2], 'full'); // 标签图 3
      } else if (name === '主图_05') {
        // AI 在主图_05中已经处理了合成逻辑，不需要额外前端叠加
        return imageUrl;
      }
    }

    if (isSmallRectEntranceMat) {
      if (name === '主图_01' || name.startsWith('主图_01(')) {
        return await compositeUserLabel(imageUrl, labelImages[0], 'full'); // 标签图 1
      } else if (name === '主图_03') {
        return await compositeUserLabel(imageUrl, labelImages[1], 'full'); // 标签图 2
      } else if (name === '主图_04') {
        return await compositeUserLabel(imageUrl, labelImages[2], 'full'); // 标签图 3
      } else if (name === '主图_05') {
        return await compositeUserLabel(imageUrl, labelImages[3], 'full'); // 标签图 4
      }
    }

    return imageUrl;
  };

  const handleGenerateItem = async (name: string) => {
    if (!sourceImage) return;
    if (name !== '地毯原图' && !results['地毯原图']) {
      setError("请先生成或提取【地毯原图】作为基础。");
      return;
    }

    setReloadingImages(prev => new Set(prev).add(name));
    setError(null);

    const apiRatio = getApiRatio(selectedRatio);
    const prompt = getPromptForType(name, selectedRatio);
    const baseImg = (name === '地毯原图') ? sourceImage : results['地毯原图'];

    try {
      let imagesToSend: string | string[] | null = baseImg;
      const isSmallRectBathMat = selectedShape === '小矩形' && selectedScene === '浴室垫';
      
      if (name === '主图_05' && isSmallRectBathMat && labelImages[0]) {
          // 发送 [模板, 地毯] 确保 Gemini 的“第一张图”是模板
          imagesToSend = [labelImages[0], baseImg as string];
      }

      let imageUrl = await GeminiService.processImage(imagesToSend, prompt, apiRatio);
      
      const isSpecial = (selectedShape === '小矩形') && (selectedScene === '浴室垫' || selectedScene === '玄关门垫');
      if (isSpecial) {
        imageUrl = await handleSpecialSceneCompositing(name, imageUrl);
      } else {
        if (name === '主图_01' || name.startsWith('主图_01(')) {
          imageUrl = await compositeAntiSlipIcon(imageUrl);
        } else if (name === '主图_05') {
          imageUrl = await compositeCleaningTitle(imageUrl);
        }
      }
      
      setResults(prev => ({ ...prev, [name]: imageUrl }));
    } catch (err: any) {
      console.error(err);
      setError(`生成 ${name} 失败：${(err as any)?.message || String(err)}`);
    } finally {
      setReloadingImages(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const runFullPipeline = async () => {
    if (!sourceImage) return;
    setError(null);
    setCurrentStep('PROCESSING');
    const apiRatio = getApiRatio(selectedRatio);
    const isSpecial = (selectedShape === '小矩形') && (selectedScene === '浴室垫' || selectedScene === '玄关门垫');
    
    try {
      const originalUrl = await GeminiService.processImage(sourceImage, getPromptForType('地毯原图', selectedRatio), apiRatio);
      setResults(prev => ({ ...prev, '地毯原图': originalUrl }));

      const baseNames = ['主图_01', '主图_02', '主图_03', '主图_04', '主图_05'];
      for (const name of baseNames) {
        let imagesToSend: string | string[] | null = originalUrl;
        const isSmallRectBathMat = selectedShape === '小矩形' && selectedScene === '浴室垫';
        if (name === '主图_05' && isSmallRectBathMat && labelImages[0]) {
            imagesToSend = [labelImages[0], originalUrl];
        }

        let url = await GeminiService.processImage(imagesToSend, getPromptForType(name, selectedRatio), apiRatio);
        if (isSpecial) {
          url = await handleSpecialSceneCompositing(name, url);
        } else {
          if (name === '主图_05') {
            url = await compositeCleaningTitle(url);
          }
        }
        setResults(prev => ({ ...prev, [name]: url }));
      }

      let dynamicIds: string[] = [];
      if (selectedShape === '长条矩形') dynamicIds = RUNNER_CONFIGS.map(c => c.id);
      else if (selectedShape === '大矩形' || selectedShape === '椭圆形') dynamicIds = BIG_RECT_CONFIGS.map(c => c.id);
      else if (selectedShape === '圆形') dynamicIds = ROUND_CONFIGS.map(c => c.id);
      else if (selectedShape === '正方形') dynamicIds = SQUARE_CONFIGS.map(c => c.id);
      else if (selectedShape === '小矩形' || selectedShape === '半圆形' || selectedShape === '小正方形') {
        if (selectedShape === '小矩形' && selectedScene === '浴室垫') {
          dynamicIds = SMALL_RECT_BATHMAT_CONFIGS.map(c => c.id);
        } else if (selectedShape === '小矩形' && selectedScene === '玄关门垫') {
          dynamicIds = SMALL_RECT_ENTRANCE_CONFIGS.map(c => c.id);
        } else {
          dynamicIds = ['主图_01(1)', '主图_01(2)'];
        }
      }

      for (const id of dynamicIds) {
        let url = await GeminiService.processImage(originalUrl, getPromptForType(id, selectedRatio), apiRatio);
        if (isSpecial) {
          url = await handleSpecialSceneCompositing(id, url);
        } else {
          url = await (id.startsWith('主图_01') ? compositeAntiSlipIcon(url) : Promise.resolve(url));
        }
        setResults(prev => ({ ...prev, [id]: url }));
      }
      setCurrentStep('COMPLETED');
    } catch (err: any) {
      console.error(err);
      setError(`渲染失败: ${(err as any)?.message || String(err)}`);
      setCurrentStep('IDLE');
    }
  };

  const handleDownloadItem = (name: string, url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.jpg`;
    link.click();
  };

  return (
    <div className="space-y-8 pb-40 relative animate-in fade-in duration-700">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-indigo-600 rounded-full inline-block shadow-lg shadow-indigo-500/20" />
            OZON地毯主图 <span className="text-indigo-600 dark:text-indigo-400 font-light">渲染</span>
          </h1>
          <p className="text-slate-500 dark:text-zinc-500 text-sm mt-1 font-medium">批量执行将处理原图、主图01-05及所有尺寸变体。</p>
        </div>
        {currentStep === 'COMPLETED' && (
          <button 
            onClick={() => (Object.entries(results) as Array<[string, string | null]>).forEach(([n, u]) => u && handleDownloadItem(n, u))} 
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black shadow-xl transition-all active:scale-95"
          >
            打包下载全套素材
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <section className="space-y-4">
             <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">底稿图案上传</label>
             <div 
              onClick={() => currentStep !== 'PROCESSING' && fileInputRef.current?.click()}
              className={`aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer bg-white dark:bg-zinc-950 ${
                sourceImage ? 'border-indigo-500/30 shadow-inner' : 'border-slate-200 dark:border-zinc-800'
              }`}
            >
              {sourceImage ? <img src={sourceImage} className="w-full h-full object-contain p-2" /> : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5} /></svg>
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">选择图案素材</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
          </section>

          <section className="space-y-4 bg-white/80 dark:bg-zinc-900/40 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800/50">
             <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em]">功能标签上传 (6个)</label>
             <div className="grid grid-cols-3 gap-2">
                {labelImages.map((img, idx) => (
                  <div key={idx} onClick={() => labelInputRefs[idx].current?.click()} className={`aspect-square rounded-xl border border-dashed flex items-center justify-center relative overflow-hidden cursor-pointer transition-all ${img ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-200 dark:border-zinc-800 hover:border-indigo-400'}`}>
                    {img ? (
                      <>
                        <img src={img} className="w-full h-full object-cover p-1" />
                        <button onClick={(e) => removeLabelImage(idx, e)} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg hover:scale-110 transition-transform">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 opacity-40">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5} /></svg>
                        <span className="text-[8px] font-bold text-center">标签图{idx + 1}</span>
                      </div>
                    )}
                    <input type="file" ref={labelInputRefs[idx]} onChange={(e) => handleLabelFileChange(idx, e)} className="hidden" accept="image/*" />
                  </div>
                ))}
             </div>
          </section>

          <div className="bg-white/80 dark:bg-zinc-900/40 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800/50 space-y-5 shadow-sm">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">地毯形状</label>
              <div className="flex flex-wrap gap-1.5">
                {SHAPE_OPTIONS.map(s => (
                  <button key={s} onClick={() => setSelectedShape(s)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedShape === s ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 border-slate-100 dark:border-zinc-800'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">材质选择</label>
              <div className="flex flex-wrap gap-1.5">
                {(['水晶绒点塑底', '天鹅绒点塑底', '硅藻泥'] as TextureType[]).map(t => (
                  <button key={t} onClick={() => setTexture(t)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${texture === t ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 border-slate-100 dark:border-zinc-800'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">场景</label>
              <div className="flex flex-wrap gap-1.5">
                {availableScenes.map(s => (
                  <button key={s} onClick={() => setSelectedScene(s)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedScene === s ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 border-slate-100 dark:border-zinc-800'}`}>{s}</button>
                ))}
              </div>
            </div>

            <input type="text" value={style} onChange={e => setStyle(e.target.value)} placeholder="风格描述（选填）" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" />

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">输出比例</label>
              <div className="grid grid-cols-3 gap-1.5">
                {RATIO_OPTIONS.map(r => (
                  <button key={r} onClick={() => setSelectedRatio(r)} className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedRatio === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'text-slate-400 border-slate-100 dark:border-zinc-800 hover:border-indigo-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={runFullPipeline} disabled={currentStep === 'PROCESSING' || !sourceImage} className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl ${currentStep === 'PROCESSING' || !sourceImage ? 'bg-slate-100 dark:bg-zinc-800 text-slate-300 shadow-none' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}`}>
              {currentStep === 'PROCESSING' ? '全套渲染中...' : '开始批量执行'}
            </button>
            {error && <p className="text-[10px] text-red-500 font-bold text-center animate-pulse px-4">{error}</p>}
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.entries(results) as Array<[string, string | null]>).map(([name, url]) => (
              <div key={name} className="space-y-3 group">
                <div className="flex flex-col gap-2 px-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest truncate max-w-[60%]">
                      {name}.jpg
                    </span>
                    {url && (
                      <button onClick={() => handleDownloadItem(name, url)} className="p-1.5 text-slate-400 hover:text-indigo-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!url ? (
                      <button onClick={() => handleGenerateItem(name)} className="flex-1 py-1.5 bg-slate-50 dark:bg-zinc-900 border rounded-lg text-[9px] font-black text-slate-500 hover:text-indigo-600">单独执行</button>
                    ) : (
                      <>
                        <button onClick={() => handleGenerateItem(name)} className="flex-1 py-1.5 bg-slate-50 dark:bg-zinc-900 border rounded-lg text-[9px] font-black text-slate-500 hover:text-indigo-600">重做</button>
                        <button onClick={() => setPreviewUrl(url)} className="flex-1 py-1.5 bg-slate-50 dark:bg-zinc-900 border rounded-lg text-[9px] font-black text-slate-500 hover:text-indigo-600">预览</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="aspect-[4/5] bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-sm group-hover:shadow-indigo-500/5 transition-all">
                  {url && !reloadingImages.has(name) ? (
                    <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      {(reloadingImages.has(name) || (currentStep === 'PROCESSING' && !url)) && (
                        <div className="flex flex-col items-center gap-3 animate-pulse">
                          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-center px-4">正在渲染</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 dark:bg-black/95 backdrop-blur-md flex items-center justify-center p-8 transition-all" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
            <img src={previewUrl} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
            <button className="absolute top-0 right-0 p-6 text-white/50 hover:text-white" onClick={() => setPreviewUrl(null)}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorView;
