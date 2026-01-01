/**
 * 한국 시간(KST, UTC+9) 기준 날짜 유틸리티
 */

const KST_OFFSET = 9 * 60; // 분 단위

/**
 * 현재 한국 시간 Date 객체 반환
 */
export const getKSTDate = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (KST_OFFSET * 60000));
};

/**
 * 한국 시간 기준 오늘 날짜 문자열 (YYYY-MM-DD)
 */
export const getKSTDateString = (date?: Date): string => {
  const d = date || getKSTDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 한국 시간 기준 오늘 날짜 문자열
 */
export const getTodayKST = (): string => {
  return getKSTDateString();
};

/**
 * 날짜 문자열을 한국 시간 기준 Date 객체로 변환
 */
export const parseKSTDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * 한국 시간 기준 요일 반환 (0: 일요일 ~ 6: 토요일)
 */
export const getKSTDayOfWeek = (dateStr?: string): number => {
  if (dateStr) {
    return parseKSTDate(dateStr).getDay();
  }
  return getKSTDate().getDay();
};

/**
 * 한국 시간 기준 현재 연도
 */
export const getKSTYear = (): number => {
  return getKSTDate().getFullYear();
};

/**
 * 한국 시간 기준 현재 월 (1-12)
 */
export const getKSTMonth = (): number => {
  return getKSTDate().getMonth() + 1;
};

/**
 * 한국 시간 기준 포맷된 날짜 문자열
 */
export const formatKSTDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = parseKSTDate(dateStr);
  return date.toLocaleDateString('ko-KR', options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

/**
 * 두 날짜 사이의 일수 차이 계산
 */
export const getDaysDiff = (dateStr1: string, dateStr2: string): number => {
  const date1 = parseKSTDate(dateStr1);
  const date2 = parseKSTDate(dateStr2);
  const diffTime = date1.getTime() - date2.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 날짜에 일수 더하기
 */
export const addDays = (dateStr: string, days: number): string => {
  const date = parseKSTDate(dateStr);
  date.setDate(date.getDate() + days);
  return getKSTDateString(date);
};

/**
 * 이번 주 월요일 날짜 반환
 */
export const getWeekMondayKST = (dateStr?: string): string => {
  const date = dateStr ? parseKSTDate(dateStr) : getKSTDate();
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 일요일이면 6일 전, 아니면 (요일-1)일 전
  date.setDate(date.getDate() - diff);
  return getKSTDateString(date);
};

/**
 * 해당 월의 첫째 날
 */
export const getMonthFirstDay = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-01`;
};

/**
 * 해당 월의 마지막 날
 */
export const getMonthLastDay = (year: number, month: number): string => {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};
