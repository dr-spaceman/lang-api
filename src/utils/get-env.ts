function getEnv(key: string): string {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing environment variable ${key}`)
  }

  // console.log('found key', key, `${value.slice(0, 5)}...${value.at(-1)}`)

  return value
}

export default getEnv
