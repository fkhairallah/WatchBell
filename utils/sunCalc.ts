// Sunrise/sunset calculation based on the NOAA solar equations
// https://en.wikipedia.org/wiki/Sunrise_equation

const rad = Math.PI / 180;
const J2000 = 2451545.0; // Julian date of Jan 1, 2000 noon

function dateToJulian(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function julianToMs(J: number): number {
  return (J - 2440587.5) * 86400000;
}

export interface SunTimes {
  sunrise: number; // ms timestamp
  sunset: number;  // ms timestamp
  polarDay: boolean;  // sun never sets
  polarNight: boolean; // sun never rises
}

export function getSunTimes(date: Date, lat: number, lng: number): SunTimes {
  const JD = dateToJulian(date);

  // Mean solar noon.
  // The formula uses west-positive longitude (lw), but GPS lng is east-positive,
  // so negate: lw = -lng.
  const lw = -lng;
  const n = Math.round(JD - J2000 - 0.0009 - lw / 360);
  const Jstar = J2000 + 0.0009 + lw / 360 + n;

  // Solar mean anomaly
  const M = (357.5291 + 0.98560028 * (Jstar - J2000)) % 360;

  // Equation of centre
  const C =
    1.9148 * Math.sin(M * rad) +
    0.02 * Math.sin(2 * M * rad) +
    0.0003 * Math.sin(3 * M * rad);

  // Ecliptic longitude
  const lambda = (M + C + 180 + 102.9372) % 360;

  // Solar transit
  const Jtransit =
    Jstar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);

  // Declination
  const sinDec = Math.sin(lambda * rad) * Math.sin(23.4397 * rad);
  const cosDec = Math.cos(Math.asin(sinDec));

  // Hour angle (-0.8333° accounts for atmospheric refraction + solar disc size)
  const cosW =
    (Math.sin(-0.8333 * rad) - Math.sin(lat * rad) * sinDec) /
    (Math.cos(lat * rad) * cosDec);

  if (cosW < -1) {
    return { sunrise: -1, sunset: -1, polarDay: true, polarNight: false };
  }
  if (cosW > 1) {
    return { sunrise: -1, sunset: -1, polarDay: false, polarNight: true };
  }

  const W = Math.acos(cosW) / rad;

  return {
    sunrise: julianToMs(Jtransit - W / 360),
    sunset: julianToMs(Jtransit + W / 360),
    polarDay: false,
    polarNight: false,
  };
}

/** Returns true if the current local time is between sunset and sunrise. */
export function isNightTime(lat: number, lng: number): boolean {
  const now = Date.now();
  const today = new Date();
  const { sunrise, sunset, polarDay, polarNight } = getSunTimes(today, lat, lng);

  if (polarDay) return false;
  if (polarNight) return true;

  // After sunset or before sunrise → night
  return now >= sunset || now < sunrise;
}
