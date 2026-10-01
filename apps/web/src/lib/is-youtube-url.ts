// 요구사항 명세서 4-1항의 주소 판별식.
export const isYoutubeUrl = (value: string) =>
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?|shorts\/|live\/)|youtu\.be\/|m\.youtube\.com\/)/i.test(
    value.trim(),
  );
