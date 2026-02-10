
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize, InspirationItem } from "./types";

const BASE64_IMAGE_REGEX = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/;

export class GeminiService {
  /**
   * 每次请求前动态创建客户端实例，确保使用最新的 API Key。
   */
  private static getClient() {
    // Create a new instance right before making an API call to ensure it uses the latest API key.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('MISSING_GEMINI_API_KEY');
    }
    const baseUrl = process.env.GEMINI_BASE_URL;
    const clientOptions: ConstructorParameters<typeof GoogleGenAI>[0] = { apiKey };
    if (baseUrl) {
      clientOptions.httpOptions = { baseUrl };
    }
    return new GoogleGenAI(clientOptions);
  }

  private static extractImageFromParts(parts?: any[]): string | null {
    if (!parts) return null;
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
      if (typeof part.text === 'string') {
        const match = part.text.match(BASE64_IMAGE_REGEX);
        if (match) {
          return match[0];
        }
      }
    }
    return null;
  }


  /**
   * 指数退避重试包装函数
   */
  private static async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuotaError = errorMsg.includes("429") || 
                           errorMsg.includes("RESOURCE_EXHAUSTED") ||
                           error?.status === 429;
      
      if (isQuotaError && retries > 0) {
        console.warn(`检测到频率限制 (429)，正在进行第 ${4 - retries} 次重试...`);
        await new Promise<void>(resolve => setTimeout(() => resolve(), delay));
        return this.withRetry<T>(fn, retries - 1, delay * delay);
      }
      throw error;
    }
  }

  /**
   * 辅助函数：解析 Data URL
   */
  private static parseDataUrl(dataUrl: string) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error("INVALID_BASE64_FORMAT");
    }
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }

  /**
   * 处理并提取响应中的图像数据
   */
  private static extractImageFromResponse(response: any): string {
    const candidate = response.candidates?.[0];
    
    if (!candidate) {
      // 检查是否由于安全反馈导致无结果
      if (response.promptFeedback?.blockReason) {
        throw new Error(`请求被拦截: ${response.promptFeedback.blockReason}。请尝试调整图案或提示词。`);
      }
      throw new Error("AI 未返回任何候选结果。这通常是由于安全过滤或图案过于复杂导致的。");
    }

    if (!candidate.content?.parts) {
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("生成任务因安全策略被终止（可能包含版权图案或敏感内容）。");
      }
      throw new Error(`AI 未返回有效内容 (原因: ${candidate.finishReason || '未知'})。`);
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // 如果没找到图片但有文本输出，则反馈文本
    const text = response.text;
    if (text && text.trim().length > 0) {
      throw new Error(`模型返回了文字信息而非图像：${text.substring(0, 100)}...`);
    }

    throw new Error("处理成功但响应中未发现图片数据。");
  }

  /**
   * 处理图片（编辑/二次生成）
   */
  static async processImage(
    base64Images: string | string[] | null,
    prompt: string,
    aspectRatio: AspectRatio = '1:1'
  ): Promise<string> {
    return this.withRetry<string>(async () => {
      const ai = this.getClient();
      const model = 'gemini-2.5-flash-image';
      
      const parts: any[] = [{ text: prompt }];
      
      if (base64Images) {
        const images = Array.isArray(base64Images) ? base64Images : [base64Images];
        images.forEach(img => {
            const { mimeType, data } = this.parseDataUrl(img);
            parts.unshift({ inlineData: { data, mimeType } });
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          systemInstruction: "You are a specialized image processing engine. Output strictly one image part. Do not output text, explanations, or any conversational elements. Your output must contain the processed image data based on the instructions provided. When multiple images are provided, use them as reference as instructed in the prompt.",
          imageConfig: {
            aspectRatio: aspectRatio
          }
        }
      });

      return this.extractImageFromResponse(response);
    });
  }

  /**
   * 生成图片
   */
  static async generateImage(
    prompt: string, 
    aspectRatio: AspectRatio = '1:1', 
    isPro: boolean = false,
    referenceImage: string | null = null
  ): Promise<string> {
    return this.withRetry<string>(async () => {
      const ai = this.getClient();
      const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const parts: any[] = [{ text: prompt }];
      
      if (referenceImage) {
        const { mimeType, data } = this.parseDataUrl(referenceImage);
        parts.unshift({ inlineData: { data, mimeType } });
      }

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: "You are a professional image generator. Strictly output the image part only. Do not provide descriptions or text feedback.",
          imageConfig: {
            responseModalities: ['TEXT', 'IMAGE'], 
            aspectRatio: aspectRatio,
            ...(isPro ? { imageSize: '1K' as ImageSize } : {})
          }
        }
      });

      return this.extractImageFromResponse(response);
    });
  }

  /**
   * 高清放大图片 (4K)
   */
  static async upscaleImage(base64Image: string): Promise<string> {
    return this.withRetry<string>(async () => {
      const ai = this.getClient();
      const model = 'gemini-3-pro-image-preview';
      
      const { mimeType, data } = this.parseDataUrl(base64Image);

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data, mimeType } },
            { text: "Enhance this image to 4K resolution with high fidelity." }
          ]
        },
        config: {
          systemInstruction: "IMAGE UPSCALER: NO TEXT OUTPUT. ONLY RETURN THE UPSCALED IMAGE PART.",
          imageConfig: {
            imageSize: '4K' as ImageSize
          }
        }
      });

      return this.extractImageFromResponse(response);
    });
  }

  /**
   * 获取灵感
   */
  static async getInspiration(keyword: string): Promise<InspirationItem[]> {
    return this.withRetry<InspirationItem[]>(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Pinterest design trends for "${keyword}". Provide a list of links.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title || "美学灵感参考",
          uri: chunk.web.uri,
        }));
    });
  }
}
