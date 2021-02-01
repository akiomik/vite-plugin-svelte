import path from 'path'
import slash from 'slash'
import hash from 'hash-sum'
import { CompileOptions, Options } from '../index'
import { compileSvelte } from './compileSvelte'

export interface SvelteComponentDescriptor {
  id: string
  js: { code: string; map?: any; dependencies?: any[] }
  css: { code: string; map?: any; dependencies?: any[] }
  warnings: any
  vars: any
  compilerOptions: CompileOptions
  rest: Partial<Options>
  ssr: boolean
}

const cache = new Map<string, SvelteComponentDescriptor>()
const prevCache = new Map<string, SvelteComponentDescriptor | undefined>()

export async function createDescriptor(
  filename: string,
  source: string,
  root: string,
  isProduction: boolean | undefined,
  compilerOptions: CompileOptions,
  rest: Partial<Options>,
  ssr: boolean
): Promise<SvelteComponentDescriptor> {
  const compiled = await compileSvelte(
    filename,
    source,
    compilerOptions,
    rest,
    ssr
  )

  // TODO this id is generated by vite-plugin-vue, may not be needed for svelte but may be handy
  // ensure the path is normalized in a way that is consistent inside
  // project (relative to root) and on different systems.
  const normalizedPath = slash(path.normalize(path.relative(root, filename)))
  const id = hash(normalizedPath + (isProduction ? source : ''))

  const descriptor: SvelteComponentDescriptor = {
    ...compiled,
    rest,
    ssr,
    id
  }

  cache.set(filename, descriptor)
  return descriptor
}

export function getPrevDescriptor(filename: string) {
  return prevCache.get(filename)
}

export function setPrevDescriptor(
  filename: string,
  entry: SvelteComponentDescriptor
) {
  prevCache.set(filename, entry)
}

export function getDescriptor(filename: string, errorOnMissing = true) {
  if (cache.has(filename)) {
    return cache.get(filename)!
  }
  if (errorOnMissing) {
    throw new Error(
      `${filename} has no corresponding entry in the cache. ` +
        `This is a @svitejs/vite-plugin-svelte internal error, please open an issue.`
    )
  }
}

export function setDescriptor(
  filename: string,
  entry: SvelteComponentDescriptor
) {
  cache.set(filename, entry)
}
