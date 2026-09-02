export const MIN_PREFERRED_AGE = 13
export const MAX_PREFERRED_AGE = 99

export function isValidAgePreference(minAge: number | null, maxAge: number | null): boolean {
  return (
    (minAge === null || (Number.isInteger(minAge) && minAge >= MIN_PREFERRED_AGE && minAge <= MAX_PREFERRED_AGE)) &&
    (maxAge === null || (Number.isInteger(maxAge) && maxAge >= MIN_PREFERRED_AGE && maxAge <= MAX_PREFERRED_AGE)) &&
    (minAge === null || maxAge === null || minAge <= maxAge)
  )
}
