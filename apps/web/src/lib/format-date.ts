export const formatMonthDay = (isoDate: string): string => {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  return `${Number(match[1])}월 ${Number(match[2])}일`;
};
