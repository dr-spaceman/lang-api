function getEnv(
  key: string,
  keyDefault: string | undefined = undefined
): string {
  const value = process.env[key] || keyDefault

  if (!value) {
    throw new Error(`Missing environment variable ${key}`)
  }

  // console.log('found key', key, `${value.slice(0, 5)}...${value.at(-1)}`)

  return value
}

export default getEnv
