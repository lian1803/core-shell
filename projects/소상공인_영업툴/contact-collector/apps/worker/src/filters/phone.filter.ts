/**
 * 010 번호인지 확인 (문자/DM 발송 가능한 번호)
 * 031, 02 등 지역번호는 false 반환
 */
export function is010Number(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('010') && digits.length === 11
}

/**
 * 전화번호 정규화 (010-XXXX-XXXX 형식)
 */
export function filterPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  } else if (digits.length === 10) {
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    }
  } else if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  }

  return phone
}

// 하위 호환용 (index.ts에서 isSafeNumber 대신 is010Number 쓸 것)
export function isSafeNumber(phone: string): boolean {
  return !is010Number(phone)
}
