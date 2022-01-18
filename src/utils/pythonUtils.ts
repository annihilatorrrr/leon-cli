import execa from 'execa'
import { LogError } from './LogError'

function extractVersionForPath(str: string): string {
  const match = str.match(/\d\.\d{1,3}/g)
  if (match?.length !== 1) {
    throw new LogError({
      message: 'Could not extract python version : no relevant match'
    })
  }
  return match[0].split('.').join('')
}

function extractPythonVersionForSemver(str: string): string {
  const match = str.match(/\d\.\d{1,3}\.\d{1,3}/g)
  if (match?.length !== 1) {
    throw new LogError({
      message: 'Could not extract python version : no relevant match'
    })
  }
  return match[0].toString()
}

async function getPythonSiteString(): Promise<string> {
  const errorMessage = 'Error while getting the path of python3 libraries'

  try {
    const { stdout: pythonSite, failed: pythonSiteFailed } = await execa(
      'python3 -m site --user-base'
    )
    if (pythonSiteFailed) {
      throw new LogError({ message: errorMessage })
    }
    return pythonSite
  } catch (error: any) {
    throw new LogError({ message: errorMessage, logFileMessage: error })
  }
}

async function getPythonVersionString(): Promise<string> {
  const errorMessage = 'Error while getting the version of python'

  try {
    const { stdout: pythonVersionString, failed: pythonVersionFailed } =
      await execa('python --version')
    if (pythonVersionFailed) {
      throw new LogError({ message: errorMessage })
    }
    return pythonVersionString
  } catch (error: any) {
    throw new LogError({ message: errorMessage, logFileMessage: error })
  }
}

export {
  extractVersionForPath,
  extractPythonVersionForSemver,
  getPythonSiteString,
  getPythonVersionString
}