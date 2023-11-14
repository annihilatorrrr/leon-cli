import { Command, Option } from 'clipanion'

import { LeonInstance } from '#src/services/LeonInstance.js'
import { Log } from '#src/services/Log.js'
import { Prompt } from '#src/services/Prompt.js'

export class DeleteCommand extends Command {
  public static override paths = [['delete']]

  public static override usage = {
    description: 'Delete a Leon instance.'
  }

  public name = Option.String('--name', {
    description: 'Name of the Leon instance.'
  })

  public yes = Option.Boolean('--yes', {
    description: 'Skip all questions with a "yes" answer.'
  })

  public async execute(): Promise<number> {
    try {
      const { yes = false } = this
      const leonInstance = await LeonInstance.get(this.name)
      console.log(
        `You are about to delete Leon instance "${leonInstance.name}".`
      )
      const prompt = Prompt.getInstance()
      if (yes || (await prompt.shouldExecute('Are you sure?', 'no'))) {
        await leonInstance.delete()
        console.log(`Leon instance "${leonInstance.name}" deleted.`)
      } else {
        console.log('Deletion canceled.')
      }
      return 0
    } catch (error) {
      const log = Log.getInstance()
      log.error({
        error,
        commandPath: 'delete'
      })
      return 1
    }
  }
}
