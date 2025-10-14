function detectDeviceType() {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobile";
  return "Desktop";
}

function detectBrowser() {
  const ua = navigator.userAgent || "";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/") && !ua.includes("Edg/") && !ua.includes("OPR/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Unknown";
}

function detectOS() {
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
  if (/Win/i.test(platform)) return "Windows";
  if (/Mac/i.test(platform) && !/iPhone|iPad|iPod/i.test(platform)) return "macOS";
  if (/iPhone|iPad|iPod/i.test(platform)) return "iOS";
  if (/Android/i.test(platform)) return "Android";
  if (/Linux/i.test(platform)) return "Linux";
  return "Unknown";
}

export { detectBrowser, detectDeviceType, detectOS };
