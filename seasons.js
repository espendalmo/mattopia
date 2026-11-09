const DAY=86400000;

function easterDay(year) {
  // Gregorian computus. Use UTC days to avoid a daylight saving offset.
  const cycle=year%19, century=Math.floor(year/100), rest=year%100;
  const leap=Math.floor(century/4), correction=Math.floor((century+8)/25);
  const epact=(19*cycle+century-leap-Math.floor((century-correction+1)/3)+15)%30;
  const weekday=(32+2*(century%4)+2*Math.floor(rest/4)-epact-rest%4)%7;
  const moon=Math.floor((cycle+11*epact+22*weekday)/451);
  const day=epact+weekday-7*moon+114;
  return Date.UTC(year,Math.floor(day/31)-1,day%31+1)/DAY;
}

export function seasonForDate(date=new Date()) {
  const year=date.getFullYear(),month=date.getMonth(),day=date.getDate();
  const easter=easterDay(year),today=Date.UTC(year,month,day)/DAY;
  if (today>=easter-7&&today<=easter+2) return 'easter';
  if (month===9&&day>=23) return 'halloween';
  if (month===11&&day<=26) return 'christmas';
  if (month===11||month<2) return 'winter';
  if (month<5) return 'spring';
  return month<8?'summer':'autumn';
}

const MOTIFS={
  winter:'<path d="M12 2v20M3.34 7l17.32 10m0-10L3.34 17M9 5l3 3 3-3m-6 14 3-3 3 3M4 10l4-.7-.7-4m12.7 8.7-4 .7.7 4m-.7-13.4-.7 4 4 .7M4 14l4 .7-.7 4"/>',
  christmas:'<path d="M12 2 6 10h3l-5 6h6v5h4v-5h6l-5-6h3Z"/><path d="M8 14h.1m8-2h.1m-4-5h.1"/>',
  easter:'<path d="M12 3c4 0 8 7 8 12a8 8 0 0 1-16 0c0-5 4-12 8-12Z"/><path d="m5 13 4 2 3-2 3 2 4-2m-12-3h.1m9 0h.1"/>',
  spring:'<path d="M12 13v8m0-3q-6 0-6-4 5-1 6 4m0 0q6 0 6-4-5-1-6 4M9 6c-3-4-6 0-4 3 0 2 3 4 7 4s7-2 7-4c2-3-1-7-4-3-2-4-4-4-6 0Z"/>',
  summer:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  autumn:'<path d="M4 19C3 8 11 5 20 4c0 10-3 17-13 16m-4 2 12-12m-7 7v-5m4 1h4"/>',
  halloween:'<path d="M12 7c-2-5 1-6 4-6m-4 6C5 3 2 9 3 14c1 6 5 7 9 6 4 1 8 0 9-6 1-5-2-11-9-7Zm-4 4h.1m8 0h.1M9 15q3 2 6 0"/>',
};

export function seasonMark(season) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${MOTIFS[season]}</svg>`;
}
