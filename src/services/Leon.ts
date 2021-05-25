import path from 'path'
import os from 'os'
import * as fsWithCallbacks from 'fs'

import axios from 'axios'
import ora from 'ora'
import extractZip from 'extract-zip'
import { v4 as uuidv4 } from 'uuid'

import {
  createTemporaryEmptyFolder,
  TEMPORARY_PATH
} from '../utils/createTemporaryEmptyFolder'
import { isExistingFile } from '../utils/isExistingFile'
import { log } from './Log'
import { LeonInstance } from './LeonInstance'

const fs = fsWithCallbacks.promises

export interface LeonOptions {
  useDevelopGitBranch?: boolean
  birthPath?: string
  version?: string
  useDocker?: boolean
  name?: string
  yes?: boolean
}

export class Leon implements LeonOptions {
  static NAME = 'leon'
  static ORGANIZATION_NAME = 'leon-ai'
  static GITHUB_URL = `https://github.com/${Leon.ORGANIZATION_NAME}/${Leon.NAME}`
  static DEFAULT_BIRTH_PATH = path.join(os.homedir(), '.leon')

  public useDevelopGitBranch: boolean
  public birthPath: string
  public version?: string
  public useDocker: boolean
  public name: string
  public yes: boolean

  constructor (options: LeonOptions) {
    const {
      useDevelopGitBranch = false,
      birthPath,
      version,
      useDocker = false,
      name = uuidv4(),
      yes = false
    } = options
    this.useDevelopGitBranch = useDevelopGitBranch
    this.birthPath =
      birthPath != null ? path.resolve(birthPath) : Leon.DEFAULT_BIRTH_PATH
    this.version = version
    this.useDocker = useDocker
    this.name = name
    this.yes = yes
  }

  public async downloadSourceCode (
    source: string,
    destination: string
  ): Promise<void> {
    const downloadLoader = ora(`Downloading Leon from ${source}`).start()
    try {
      const body = await axios.get(source, {
        responseType: 'arraybuffer'
      })
      await fs.writeFile(destination, Buffer.from(body.data), {
        encoding: 'binary'
      })
      downloadLoader.succeed()
    } catch (error) {
      downloadLoader.fail()
      await log.error({
        stderr: `Could not download Leon source code located at ${source}`,
        commandPath: 'create birth',
        value: error.toString()
      })
    }
  }

  public async extractZip (source: string, target: string): Promise<void> {
    const extractLoader = ora('Extracting Leon').start()
    try {
      await extractZip(source, { dir: target })
      extractLoader.succeed()
    } catch (error) {
      extractLoader.fail()
      await log.error({
        stderr: `Could not extract Leon source code located at ${source}`,
        commandPath: 'create birth',
        value: error.toString()
      })
    }
  }

  public getSourceCodeInformation (): {
    url: string
    zipName: string
    folderName: string
  } {
    let url = `${Leon.GITHUB_URL}/archive`
    let version = this.useDevelopGitBranch ? 'develop' : 'master'
    if (this.version != null) {
      version = this.version
      url += '/refs/tags'
    }
    const folderName = `${Leon.NAME}-${version}`
    const zipName = `${version}.zip`
    return {
      url: `${url}/${zipName}`,
      zipName,
      folderName
    }
  }

  public async createBirth (): Promise<void> {
    if (await isExistingFile(this.birthPath)) {
      return await log.error({
        stderr: `${this.birthPath} already exists, please provide another path.`,
        commandPath: 'create birth'
      })
    }
    const sourceCodeInformation = this.getSourceCodeInformation()
    const destination = path.join(TEMPORARY_PATH, sourceCodeInformation.zipName)
    const extractedPath = path.join(
      TEMPORARY_PATH,
      sourceCodeInformation.folderName
    )
    await createTemporaryEmptyFolder()
    await this.downloadSourceCode(sourceCodeInformation.url, destination)
    await this.extractZip(destination, TEMPORARY_PATH)
    await fs.rename(extractedPath, this.birthPath)
    await LeonInstance.create({
      name: this.name,
      mode: this.useDocker ? 'docker' : 'classic',
      path: this.birthPath
    })
  }
}