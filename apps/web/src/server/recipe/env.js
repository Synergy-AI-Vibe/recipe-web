export function loadEnv() {
  return { loaded: false, keys: [] };
}

export function describeKey(name) {
  return process.env[name] ? `${name}: 설정됨` : `${name}: 없음`;
}
